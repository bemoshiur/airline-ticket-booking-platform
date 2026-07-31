/**
 * In-process TTL cache.
 *
 * Two jobs:
 *   1. Collapse repeated shopping requests (GDS calls are metered and slow).
 *   2. Hold the provider's raw offer payload between shopping and pricing —
 *      Amadeus requires the *entire* original offer object to reprice, so we
 *      hand the client an opaque id and keep the payload server-side.
 *
 * Deliberately per-process: entries are short-lived (minutes) and a cold
 * serverless instance simply re-shops. Swap in Redis behind this same API if
 * multi-instance hit rates ever matter.
 */

import type { SearchQuery } from "./types";

interface Entry<T> {
  value: T;
  expiresAt: number;
}

export class TtlCache<T> {
  private readonly store = new Map<string, Entry<T>>();

  constructor(
    private readonly defaultTtlMs: number,
    private readonly maxEntries = 1000
  ) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    // Refresh insertion order so hot keys survive eviction.
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T, ttlMs = this.defaultTtlMs): void {
    if (this.store.size >= this.maxEntries) this.evict();
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  /** Drop expired entries first; if none, drop the least recently used. */
  private evict(): void {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of this.store) {
      if (entry.expiresAt <= now) {
        this.store.delete(key);
        removed++;
      }
    }
    if (removed > 0) return;

    const oldest = this.store.keys().next();
    if (!oldest.done) this.store.delete(oldest.value);
  }
}

export interface VaultedOffer {
  provider: string;
  raw: unknown;
  total: number;
  currency: string;
  /** The shopping request this offer answered — needed to reprice it. */
  query: SearchQuery;
}

/**
 * Raw provider payloads for offers we have quoted, keyed by our offer id.
 * Bounded and TTL'd: an offer nobody prices within the window is dead anyway.
 */
export const offerVault = new TtlCache<VaultedOffer>(15 * 60 * 1000, 5000);

/** Shopping responses, keyed by a canonical form of the search query. */
export const searchCache = new TtlCache<unknown>(3 * 60 * 1000, 500);

/**
 * Fare calendars. Held longer than a search: a whole-month view is expensive
 * to build and a few minutes of staleness on a browse surface is acceptable.
 */
export const calendarCache = new TtlCache<unknown>(10 * 60 * 1000, 200);
