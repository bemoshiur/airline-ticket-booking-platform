import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clientKey, rateLimit, resetRateLimits } from "@/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    resetRateLimits();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetRateLimits();
  });

  it("allows requests up to the limit", () => {
    for (let i = 0; i < 3; i++) {
      expect(rateLimit("a", 3, 60_000).allowed).toBe(true);
    }
  });

  it("blocks the request that exceeds the limit", () => {
    for (let i = 0; i < 3; i++) rateLimit("a", 3, 60_000);
    expect(rateLimit("a", 3, 60_000).allowed).toBe(false);
  });

  it("counts down the remaining budget", () => {
    expect(rateLimit("a", 3, 60_000).remaining).toBe(2);
    expect(rateLimit("a", 3, 60_000).remaining).toBe(1);
    expect(rateLimit("a", 3, 60_000).remaining).toBe(0);
  });

  it("never reports a negative remaining budget", () => {
    for (let i = 0; i < 10; i++) rateLimit("a", 2, 60_000);
    expect(rateLimit("a", 2, 60_000).remaining).toBe(0);
  });

  it("keeps separate budgets per key", () => {
    for (let i = 0; i < 3; i++) rateLimit("a", 3, 60_000);
    expect(rateLimit("a", 3, 60_000).allowed).toBe(false);
    expect(rateLimit("b", 3, 60_000).allowed).toBe(true);
  });

  it("reports how long until the window resets", () => {
    rateLimit("a", 1, 60_000);
    const blocked = rateLimit("a", 1, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
    expect(blocked.retryAfter).toBeLessThanOrEqual(60);
  });

  it("opens a fresh window after the interval elapses", () => {
    for (let i = 0; i < 3; i++) rateLimit("a", 3, 60_000);
    expect(rateLimit("a", 3, 60_000).allowed).toBe(false);

    vi.advanceTimersByTime(60_001);
    expect(rateLimit("a", 3, 60_000).allowed).toBe(true);
  });

  it("does not reset early, part-way through a window", () => {
    for (let i = 0; i < 3; i++) rateLimit("a", 3, 60_000);
    vi.advanceTimersByTime(59_000);
    expect(rateLimit("a", 3, 60_000).allowed).toBe(false);
  });
});

describe("clientKey", () => {
  const request = (headers: Record<string, string>) =>
    new Request("https://example.com", { headers });

  it("uses the leftmost x-forwarded-for entry", () => {
    const key = clientKey(
      request({ "x-forwarded-for": "203.0.113.5, 70.41.3.18" }),
      "search"
    );
    expect(key).toBe("search:203.0.113.5");
  });

  it("falls back to x-real-ip", () => {
    expect(clientKey(request({ "x-real-ip": "198.51.100.7" }), "search")).toBe(
      "search:198.51.100.7"
    );
  });

  it("falls back to a shared bucket when no client ip is present", () => {
    expect(clientKey(request({}), "search")).toBe("search:unknown");
  });

  it("scopes keys so different endpoints do not share a budget", () => {
    const headers = { "x-real-ip": "198.51.100.7" };
    expect(clientKey(request(headers), "search")).not.toBe(
      clientKey(request(headers), "price")
    );
  });
});
