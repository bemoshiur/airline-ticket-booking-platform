/**
 * Fixed-window rate limiter, in-process.
 *
 * Guards metered upstreams (GDS shopping calls cost money per request) and
 * blunts scraping. Per-instance, so the effective limit scales with instance
 * count — deliberately conservative rather than exact. Move to Redis when a
 * precise global limit matters.
 */

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();
let lastSweep = 0;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until the window resets — feeds the `Retry-After` header. */
  retryAfter: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = windows.get(key);
  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }

  existing.count++;
  const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
  return {
    allowed: existing.count <= limit,
    remaining: Math.max(limit - existing.count, 0),
    retryAfter,
  };
}

/** Drop expired windows occasionally so the map cannot grow without bound. */
function sweep(now: number): void {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
}

/**
 * Best-effort client identity. `x-forwarded-for` is spoofable in general, but
 * on Vercel and behind most proxies the leftmost entry is set by the edge.
 */
export function clientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return `${scope}:${ip}`;
}

/** Test seam. */
export function resetRateLimits(): void {
  windows.clear();
  lastSweep = 0;
}
