import type {
  FlightOffer,
  PricedOffer,
  ProviderName,
  SearchQuery,
} from "./types";

/**
 * Contract every distribution channel implements.
 *
 * Shopping is separated from pricing on purpose: shopping results are cached
 * and advisory, while `priceOffer` is the authoritative quote taken immediately
 * before we create a booking. Never charge a customer off a shopping price.
 */
export interface FlightProvider {
  readonly name: ProviderName;

  /** False when required credentials are absent — the registry skips it. */
  isConfigured(): boolean;

  searchOffers(query: SearchQuery, signal?: AbortSignal): Promise<FlightOffer[]>;

  /**
   * Re-quote a previously returned offer. Throws `ProviderError`
   * (`offer_expired`) once the offer can no longer be ticketed.
   */
  priceOffer(offerId: string, signal?: AbortSignal): Promise<PricedOffer>;
}

/** Stable cache key for a shopping request. */
export function searchCacheKey(q: SearchQuery): string {
  return [
    q.from,
    q.to,
    q.departureDate,
    q.returnDate ?? "-",
    q.adults,
    q.children,
    q.infants,
    q.cabinClass,
    q.currency,
    q.nonStop ? "ns" : "any",
    q.maxResults,
  ].join("|");
}

/** Fetch with an enforced deadline, so a hung GDS can't hold a request open. */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  signal?: AbortSignal
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}
