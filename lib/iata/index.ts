/**
 * Provider registry.
 *
 * `FLIGHT_PROVIDER` picks the primary channel (default `database`). If the
 * primary fails in a way that another channel could survive, we fall back to
 * the database provider and mark the result `degraded` so the UI can say so.
 *
 * Pricing never falls back: an offer belongs to the provider that issued it,
 * and the id carries that provenance.
 */

import { isProviderError, ProviderError } from "./errors";
import { calendarCache, offerVault, searchCache } from "./cache";
import { searchCacheKey, type FlightProvider } from "./provider";
import { AmadeusProvider } from "./providers/amadeus";
import { DatabaseProvider } from "./providers/database";
import type {
  FareCalendarEntry,
  FareCalendarQuery,
  FareCalendarResult,
  FlightOffer,
  PricedOffer,
  ProviderName,
  SearchQuery,
  SearchResult,
} from "./types";

export * from "./types";
export { ProviderError, isProviderError, toClientError } from "./errors";

const providers: Record<ProviderName, FlightProvider> = {
  amadeus: new AmadeusProvider(),
  database: new DatabaseProvider(),
};

function primaryName(): ProviderName {
  const configured = process.env.FLIGHT_PROVIDER?.toLowerCase();
  return configured === "amadeus" ? "amadeus" : "database";
}

export function getProvider(name: ProviderName): FlightProvider {
  return providers[name];
}

/** Which channel a search would use right now — useful for health checks. */
export function activeProviderName(): ProviderName {
  const primary = primaryName();
  return providers[primary].isConfigured() ? primary : "database";
}

export async function searchFlights(
  query: SearchQuery,
  signal?: AbortSignal
): Promise<SearchResult> {
  const cacheKey = `${activeProviderName()}:${searchCacheKey(query)}`;
  const cached = searchCache.get(cacheKey) as SearchResult | undefined;
  if (cached) return cached;

  const primary = primaryName();
  let offers: FlightOffer[];
  let source: ProviderName = primary;
  let degraded = false;

  try {
    if (!providers[primary].isConfigured()) {
      throw new ProviderError(
        "not_configured",
        primary,
        `${primary} is not configured`
      );
    }
    offers = await providers[primary].searchOffers(query, signal);
  } catch (error) {
    const canFallback =
      primary !== "database" && isProviderError(error) && error.retryable;

    if (!canFallback) throw error;

    console.error(
      `Provider ${primary} failed (${error.code}); ` +
        "falling back to local inventory"
    );
    offers = await providers.database.searchOffers(query, signal);
    source = "database";
    degraded = true;
  }

  const result: SearchResult = {
    offers,
    query,
    source,
    degraded,
    searchedAt: new Date().toISOString(),
  };

  // Degraded results are not cached — we want the next request to retry the
  // primary provider rather than serve stale fallback inventory for minutes.
  if (!degraded) searchCache.set(cacheKey, result);

  return result;
}

/**
 * Cheapest fare per departure date across a window.
 *
 * A provider that cannot price a whole window cheaply omits `fareCalendar`; we
 * serve local inventory and flag `degraded` rather than fanning out one
 * shopping call per day against a metered API.
 */
export async function fareCalendar(
  query: FareCalendarQuery,
  signal?: AbortSignal
): Promise<FareCalendarResult> {
  const cacheKey = `cal:${activeProviderName()}:${fareCalendarCacheKey(query)}`;
  const cached = calendarCache.get(cacheKey) as FareCalendarResult | undefined;
  if (cached) return cached;

  const primary = primaryName();
  const provider = providers[primary];
  const canServe = provider.isConfigured() && provider.fareCalendar;

  let entries: FareCalendarEntry[];
  let source: ProviderName = primary;
  let degraded = false;

  if (canServe) {
    try {
      entries = await provider.fareCalendar!(query, signal);
    } catch (error) {
      if (!isProviderError(error) || !error.retryable) throw error;
      console.error(
        `Provider ${primary} calendar failed (${error.code}); ` +
          "falling back to local inventory"
      );
      entries = await providers.database.fareCalendar!(query, signal);
      source = "database";
      degraded = true;
    }
  } else {
    entries = await providers.database.fareCalendar!(query, signal);
    degraded = primary !== "database";
    source = "database";
  }

  const priced = entries.filter(
    (entry): entry is FareCalendarEntry & { total: number } => entry.total !== null
  );

  const result: FareCalendarResult = {
    entries,
    query,
    source,
    degraded,
    cheapest: extreme(priced, (a, b) => a.total < b.total),
    dearest: extreme(priced, (a, b) => a.total > b.total),
    searchedAt: new Date().toISOString(),
  };

  if (!degraded) calendarCache.set(cacheKey, result);
  return result;
}

function extreme<T>(items: T[], better: (a: T, b: T) => boolean): T | null {
  return items.reduce<T | null>(
    (best, item) => (best === null || better(item, best) ? item : best),
    null
  );
}

function fareCalendarCacheKey(q: FareCalendarQuery): string {
  return [
    q.from,
    q.to,
    q.startDate,
    q.endDate,
    q.adults,
    q.children,
    q.infants,
    q.cabinClass,
    q.currency,
  ].join("|");
}

/**
 * Authoritative re-quote. Call this immediately before creating a booking;
 * shopping prices are advisory and go stale within minutes.
 */
export async function priceOffer(
  offerId: string,
  signal?: AbortSignal
): Promise<PricedOffer> {
  const stored = offerVault.get(offerId);
  if (!stored) {
    throw new ProviderError(
      "offer_expired",
      "registry",
      "This fare is no longer held — please search again"
    );
  }

  const owner = providers[stored.provider as ProviderName];
  if (!owner) {
    throw new ProviderError(
      "offer_expired",
      "registry",
      "This fare can no longer be confirmed"
    );
  }

  return owner.priceOffer(offerId, signal);
}
