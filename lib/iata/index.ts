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

import { ProviderError } from "./errors";
import { offerVault, searchCache } from "./cache";
import { searchCacheKey, type FlightProvider } from "./provider";
import { AmadeusProvider } from "./providers/amadeus";
import { DatabaseProvider } from "./providers/database";
import type {
  FlightOffer,
  PricedOffer,
  ProviderName,
  SearchQuery,
  SearchResult,
} from "./types";

export * from "./types";
export { ProviderError, toClientError } from "./errors";

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
      primary !== "database" &&
      error instanceof ProviderError &&
      error.retryable;

    if (!canFallback) throw error;

    console.error(
      `Provider ${primary} failed (${(error as ProviderError).code}); ` +
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
