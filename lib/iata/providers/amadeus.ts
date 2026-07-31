/**
 * Amadeus Self-Service provider.
 *
 * Endpoints used:
 *   POST /v1/security/oauth2/token          — client-credentials access token
 *   GET  /v2/shopping/flight-offers         — shopping
 *   POST /v1/shopping/flight-offers/pricing — authoritative re-quote
 *
 * Amadeus reprices from the *entire* original offer object, not an id, so the
 * raw payload goes into `offerVault` under an id we mint. The client only ever
 * sees our id.
 */

import { ProviderError } from "../errors";
import { offerVault } from "../cache";
import { fetchWithTimeout, type FlightProvider } from "../provider";
import { qualifiedFlightNumber } from "../time";
import { convert, isSupportedCurrency } from "@/lib/fx";
import type {
  BaggageAllowance,
  CabinClass,
  Carrier,
  FlightOffer,
  FlightSegment,
  Itinerary,
  PriceBreakdown,
  PricedOffer,
  SearchQuery,
} from "../types";

const PROVIDER = "amadeus" as const;
const SEARCH_TIMEOUT_MS = 15_000;
const PRICING_TIMEOUT_MS = 12_000;
/** Amadeus quotes are held briefly; force a reprice past this. */
const OFFER_TTL_MS = 15 * 60 * 1000;

const CABIN_TO_AMADEUS: Record<CabinClass, string> = {
  economy: "ECONOMY",
  premium_economy: "PREMIUM_ECONOMY",
  business: "BUSINESS",
  first: "FIRST",
};

const AMADEUS_TO_CABIN: Record<string, CabinClass> = {
  ECONOMY: "economy",
  PREMIUM_ECONOMY: "premium_economy",
  BUSINESS: "business",
  FIRST: "first",
};

// ---------------------------------------------------------------------------
// Upstream response shapes (only the fields we consume)
// ---------------------------------------------------------------------------

interface AmadeusSegment {
  departure: { iataCode: string; at: string; terminal?: string };
  arrival: { iataCode: string; at: string; terminal?: string };
  carrierCode: string;
  number: string;
  aircraft?: { code?: string };
  operating?: { carrierCode?: string };
  duration?: string;
  id: string;
  numberOfStops?: number;
}

interface AmadeusItinerary {
  duration?: string;
  segments: AmadeusSegment[];
}

interface AmadeusFareDetail {
  segmentId: string;
  cabin?: string;
  class?: string;
  fareBasis?: string;
  includedCheckedBags?: {
    weight?: number;
    weightUnit?: string;
    quantity?: number;
  };
}

interface AmadeusTravelerPricing {
  travelerId: string;
  travelerType: string;
  price: { currency: string; total: string; base?: string };
  fareDetailsBySegment?: AmadeusFareDetail[];
}

interface AmadeusOffer {
  id: string;
  lastTicketingDate?: string;
  numberOfBookableSeats?: number;
  itineraries: AmadeusItinerary[];
  price: {
    currency: string;
    total: string;
    base?: string;
    grandTotal?: string;
    fees?: { amount: string; type: string }[];
  };
  pricingOptions?: { refundableFare?: boolean; noPenaltyFare?: boolean };
  validatingAirlineCodes?: string[];
  travelerPricings?: AmadeusTravelerPricing[];
}

interface AmadeusDictionaries {
  carriers?: Record<string, string>;
  aircraft?: Record<string, string>;
}

interface AmadeusSearchResponse {
  data?: AmadeusOffer[];
  dictionaries?: AmadeusDictionaries;
  errors?: { status?: number; code?: number; title?: string; detail?: string }[];
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export class AmadeusProvider implements FlightProvider {
  readonly name = PROVIDER;

  private token: { value: string; expiresAt: number } | null = null;
  /** Shared across concurrent callers so we mint at most one token at a time. */
  private tokenRequest: Promise<string> | null = null;

  private get baseUrl(): string {
    return (
      process.env.AMADEUS_BASE_URL?.replace(/\/$/, "") ??
      "https://test.api.amadeus.com"
    );
  }

  isConfigured(): boolean {
    return Boolean(
      process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET
    );
  }

  // -- auth ----------------------------------------------------------------

  private async accessToken(signal?: AbortSignal): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 30_000) {
      return this.token.value;
    }
    if (this.tokenRequest) return this.tokenRequest;

    this.tokenRequest = this.requestToken(signal).finally(() => {
      this.tokenRequest = null;
    });
    return this.tokenRequest;
  }

  private async requestToken(signal?: AbortSignal): Promise<string> {
    const clientId = process.env.AMADEUS_CLIENT_ID;
    const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new ProviderError(
        "not_configured",
        PROVIDER,
        "Amadeus credentials are not configured"
      );
    }

    const response = await this.request(
      "/v1/security/oauth2/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret,
        }).toString(),
      },
      10_000,
      signal
    );

    if (!response.ok) {
      throw new ProviderError(
        "auth_failed",
        PROVIDER,
        "Amadeus rejected our credentials",
        { status: 502 }
      );
    }

    const body = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
    };
    if (!body.access_token) {
      throw new ProviderError(
        "auth_failed",
        PROVIDER,
        "Amadeus returned no access token"
      );
    }

    this.token = {
      value: body.access_token,
      expiresAt: Date.now() + (body.expires_in ?? 1799) * 1000,
    };
    return this.token.value;
  }

  private async request(
    path: string,
    init: RequestInit,
    timeoutMs: number,
    signal?: AbortSignal
  ): Promise<Response> {
    try {
      return await fetchWithTimeout(
        `${this.baseUrl}${path}`,
        init,
        timeoutMs,
        signal
      );
    } catch (cause) {
      const aborted = cause instanceof Error && cause.name === "AbortError";
      throw new ProviderError(
        aborted ? "timeout" : "upstream_error",
        PROVIDER,
        aborted
          ? "Amadeus did not respond in time"
          : "Could not reach Amadeus",
        { cause }
      );
    }
  }

  private async authedJson<T>(
    path: string,
    init: RequestInit,
    timeoutMs: number,
    signal?: AbortSignal
  ): Promise<T> {
    const token = await this.accessToken(signal);
    const response = await this.request(
      path,
      {
        ...init,
        headers: {
          ...(init.headers as Record<string, string> | undefined),
          Authorization: `Bearer ${token}`,
        },
      },
      timeoutMs,
      signal
    );

    if (response.status === 401) {
      // Token was revoked or rotated early — drop it so the next call re-auths.
      this.token = null;
      throw new ProviderError(
        "auth_failed",
        PROVIDER,
        "Amadeus session expired",
        { status: 502 }
      );
    }
    if (response.status === 429) {
      throw new ProviderError(
        "rate_limited",
        PROVIDER,
        "Amadeus rate limit reached"
      );
    }
    if (!response.ok) {
      // Upstream detail is logged, never returned — it can echo query internals.
      const detail = await response.text().catch(() => "");
      console.error(
        `Amadeus ${path} failed with ${response.status}: ${detail.slice(0, 500)}`
      );
      throw new ProviderError(
        response.status >= 500 ? "upstream_error" : "invalid_request",
        PROVIDER,
        response.status >= 500
          ? "Amadeus is currently unavailable"
          : "Amadeus rejected the search request",
        { status: response.status >= 500 ? 502 : 400 }
      );
    }

    return (await response.json()) as T;
  }

  // -- shopping ------------------------------------------------------------

  async searchOffers(
    query: SearchQuery,
    signal?: AbortSignal
  ): Promise<FlightOffer[]> {
    if (!this.isConfigured()) {
      throw new ProviderError(
        "not_configured",
        PROVIDER,
        "Amadeus credentials are not configured"
      );
    }

    // Amadeus prices in a currency it supports; BDT is not among them, so we
    // shop in the configured settlement currency and convert on the way out.
    const quoteCurrency = (
      process.env.AMADEUS_CURRENCY ?? "USD"
    ).toUpperCase();

    const params = new URLSearchParams({
      originLocationCode: query.from,
      destinationLocationCode: query.to,
      departureDate: query.departureDate,
      adults: String(query.adults),
      travelClass: CABIN_TO_AMADEUS[query.cabinClass],
      currencyCode: quoteCurrency,
      max: String(Math.min(query.maxResults, 50)),
    });
    if (query.returnDate) params.set("returnDate", query.returnDate);
    if (query.children > 0) params.set("children", String(query.children));
    if (query.infants > 0) params.set("infants", String(query.infants));
    if (query.nonStop) params.set("nonStop", "true");

    const body = await this.authedJson<AmadeusSearchResponse>(
      `/v2/shopping/flight-offers?${params.toString()}`,
      { method: "GET", headers: { Accept: "application/vnd.amadeus+json" } },
      SEARCH_TIMEOUT_MS,
      signal
    );

    const carriers = body.dictionaries?.carriers ?? {};
    const aircraft = body.dictionaries?.aircraft ?? {};

    return (body.data ?? []).map((raw) => {
      const offer = mapOffer(raw, carriers, aircraft, query);
      offerVault.set(
        offer.id,
        {
          provider: PROVIDER,
          raw,
          total: offer.price.total,
          currency: offer.price.currency,
          query,
        },
        OFFER_TTL_MS
      );
      return offer;
    });
  }

  // -- pricing -------------------------------------------------------------

  async priceOffer(offerId: string, signal?: AbortSignal): Promise<PricedOffer> {
    const stored = offerVault.get(offerId);
    if (!stored || stored.provider !== PROVIDER) {
      throw new ProviderError(
        "offer_expired",
        PROVIDER,
        "This fare is no longer held — please search again"
      );
    }

    const raw = stored.raw as AmadeusOffer;
    const body = await this.authedJson<AmadeusSearchResponse>(
      "/v1/shopping/flight-offers/pricing",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/vnd.amadeus+json",
        },
        body: JSON.stringify({
          data: { type: "flight-offers-pricing", flightOffers: [raw] },
        }),
      },
      PRICING_TIMEOUT_MS,
      signal
    );

    const priced = body.data?.[0];
    if (!priced) {
      throw new ProviderError(
        "offer_expired",
        PROVIDER,
        "This fare is no longer available"
      );
    }

    // Reuse the shopping query so the repriced offer keeps the same shape
    // (target currency, requested cabin) the customer was quoted in.
    const offer = mapOffer(
      priced,
      body.dictionaries?.carriers ?? {},
      body.dictionaries?.aircraft ?? {},
      stored.query,
      offerId
    );

    offerVault.set(
      offerId,
      {
        provider: PROVIDER,
        raw: priced,
        total: offer.price.total,
        currency: offer.price.currency,
        query: stored.query,
      },
      OFFER_TTL_MS
    );

    return {
      offer,
      changed: offer.price.total !== stored.total,
      previousTotal: stored.total,
    };
  }
}

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

function offerIdFor(raw: AmadeusOffer, query: SearchQuery): string {
  const route = `${query.from}${query.to}${query.departureDate}`;
  const firstSegment = raw.itineraries?.[0]?.segments?.[0];
  const stamp = firstSegment ? firstSegment.departure.at : "";
  return `am_${route}_${raw.id}_${stamp}`.replace(/[^A-Za-z0-9_-]/g, "");
}

function mapOffer(
  raw: AmadeusOffer,
  carriers: Record<string, string>,
  aircraft: Record<string, string>,
  query: SearchQuery,
  reuseId?: string
): FlightOffer {
  const id = reuseId ?? offerIdFor(raw, query);

  const cabinBySegment = new Map<string, CabinClass>();
  const classBySegment = new Map<string, string>();
  for (const detail of raw.travelerPricings?.[0]?.fareDetailsBySegment ?? []) {
    if (detail.cabin && AMADEUS_TO_CABIN[detail.cabin]) {
      cabinBySegment.set(detail.segmentId, AMADEUS_TO_CABIN[detail.cabin]);
    }
    if (detail.class) classBySegment.set(detail.segmentId, detail.class);
  }

  const fallbackCabin = query.cabinClass;
  const itineraries = raw.itineraries.map((itinerary) =>
    mapItinerary(
      itinerary,
      carriers,
      aircraft,
      cabinBySegment,
      classBySegment,
      fallbackCabin
    )
  );

  const price = mapPrice(raw, query.currency);

  const validatingCode =
    raw.validatingAirlineCodes?.[0] ??
    itineraries[0]?.segments[0]?.marketingCarrier.iataCode ??
    "";

  return {
    id,
    source: PROVIDER,
    itineraries,
    price,
    validatingCarrier: carrier(validatingCode, carriers),
    cabinClass: cabinBySegment.values().next().value ?? fallbackCabin,
    seatsAvailable: raw.numberOfBookableSeats ?? 0,
    refundable: raw.pricingOptions?.refundableFare ?? false,
    changeable: raw.pricingOptions?.noPenaltyFare ?? false,
    baggage: mapBaggage(raw),
    expiresAt: new Date(Date.now() + OFFER_TTL_MS).toISOString(),
    lastTicketingDate: raw.lastTicketingDate ?? null,
  };
}

function mapItinerary(
  itinerary: AmadeusItinerary,
  carriers: Record<string, string>,
  aircraft: Record<string, string>,
  cabinBySegment: Map<string, CabinClass>,
  classBySegment: Map<string, string>,
  fallbackCabin: CabinClass
): Itinerary {
  const segments: FlightSegment[] = itinerary.segments.map((segment) => ({
    origin: segment.departure.iataCode,
    destination: segment.arrival.iataCode,
    departureTime: segment.departure.at,
    arrivalTime: segment.arrival.at,
    durationMinutes: parseIsoDuration(segment.duration),
    marketingCarrier: carrier(segment.carrierCode, carriers),
    operatingCarrier: segment.operating?.carrierCode
      ? carrier(segment.operating.carrierCode, carriers)
      : null,
    flightNumber: qualifiedFlightNumber(segment.carrierCode, segment.number),
    aircraftType: segment.aircraft?.code
      ? aircraft[segment.aircraft.code] ?? segment.aircraft.code
      : null,
    cabinClass: cabinBySegment.get(segment.id) ?? fallbackCabin,
    bookingClass: classBySegment.get(segment.id) ?? null,
  }));

  const duration = parseIsoDuration(itinerary.duration);
  return {
    // Amadeus omits itinerary duration on some fares; sum the segments instead.
    durationMinutes:
      duration || segments.reduce((sum, s) => sum + s.durationMinutes, 0),
    stops: Math.max(segments.length - 1, 0),
    layovers: segments.slice(0, -1).map((s) => s.destination),
    segments,
  };
}

function mapPrice(raw: AmadeusOffer, targetCurrency: string): PriceBreakdown {
  const sourceCurrency = raw.price.currency.toUpperCase();
  const rate = exchangeRate(sourceCurrency, targetCurrency);

  const total = Number(raw.price.grandTotal ?? raw.price.total ?? 0);
  const base = Number(raw.price.base ?? 0);
  const fees = (raw.price.fees ?? []).reduce(
    (sum, fee) => sum + Number(fee.amount || 0),
    0
  );
  // Amadeus folds taxes into the total; derive rather than trust a sum.
  const taxes = Math.max(total - base - fees, 0);

  const perPassengerType: Record<string, number> = {};
  for (const traveler of raw.travelerPricings ?? []) {
    const type = traveler.travelerType.toLowerCase();
    if (perPassengerType[type] !== undefined) continue;
    perPassengerType[type] = round(Number(traveler.price.total || 0) * rate);
  }

  return {
    currency: rate === 1 ? sourceCurrency : targetCurrency.toUpperCase(),
    baseFare: round(base * rate),
    taxes: round(taxes * rate),
    fees: round(fees * rate),
    total: round(total * rate),
    perPassengerType,
  };
}

function exchangeRate(from: string, to: string): number {
  if (from === to.toUpperCase()) return 1;
  if (!isSupportedCurrency(from) || !isSupportedCurrency(to)) {
    console.error(
      `No FX rate for ${from}->${to}; returning Amadeus prices unconverted`
    );
    return 1;
  }
  return convert(1, from, to).rate;
}

function mapBaggage(raw: AmadeusOffer): BaggageAllowance {
  const bags = raw.travelerPricings?.[0]?.fareDetailsBySegment?.find(
    (detail) => detail.includedCheckedBags
  )?.includedCheckedBags;

  if (!bags) return { cabinKg: null, checkedKg: null, checkedPieces: null };
  return {
    cabinKg: null,
    checkedKg: bags.weightUnit?.toUpperCase() === "KG" ? bags.weight ?? null : null,
    checkedPieces: bags.quantity ?? null,
  };
}

function carrier(code: string, carriers: Record<string, string>): Carrier {
  return { iataCode: code, name: titleCase(carriers[code] ?? code) };
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b[a-z]/g, (character) => character.toUpperCase());
}

/** `PT13H10M` -> 790. Returns 0 for absent or unparseable input. */
export function parseIsoDuration(duration?: string): number {
  if (!duration) return 0;
  const match = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/.exec(duration);
  if (!match) return 0;
  const [, days, hours, minutes] = match;
  return (
    Number(days ?? 0) * 1440 + Number(hours ?? 0) * 60 + Number(minutes ?? 0)
  );
}

function round(value: number): number {
  return Math.round(value);
}
