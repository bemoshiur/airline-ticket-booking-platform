import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TtlCache } from "@/lib/iata/cache";

describe("TtlCache", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("returns a stored value", () => {
    const cache = new TtlCache<string>(1000);
    cache.set("k", "v");
    expect(cache.get("k")).toBe("v");
  });

  it("returns undefined for an unknown key", () => {
    expect(new TtlCache<string>(1000).get("missing")).toBeUndefined();
  });

  it("expires an entry once its TTL elapses", () => {
    const cache = new TtlCache<string>(1000);
    cache.set("k", "v");
    vi.advanceTimersByTime(1001);
    expect(cache.get("k")).toBeUndefined();
  });

  it("keeps an entry right up to its TTL", () => {
    const cache = new TtlCache<string>(1000);
    cache.set("k", "v");
    vi.advanceTimersByTime(999);
    expect(cache.get("k")).toBe("v");
  });

  it("honours a per-entry TTL override", () => {
    const cache = new TtlCache<string>(10_000);
    cache.set("short", "v", 500);
    vi.advanceTimersByTime(600);
    expect(cache.get("short")).toBeUndefined();
  });

  it("deletes on request", () => {
    const cache = new TtlCache<string>(1000);
    cache.set("k", "v");
    cache.delete("k");
    expect(cache.get("k")).toBeUndefined();
  });

  it("clears every entry", () => {
    const cache = new TtlCache<string>(1000);
    cache.set("a", "1");
    cache.set("b", "2");
    cache.clear();
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBeUndefined();
  });

  it("evicts expired entries before live ones when full", () => {
    const cache = new TtlCache<string>(1000, 2);
    cache.set("stale", "x", 100);
    cache.set("fresh", "y", 10_000);
    vi.advanceTimersByTime(200);

    cache.set("new", "z", 10_000);

    expect(cache.get("stale")).toBeUndefined();
    expect(cache.get("fresh")).toBe("y");
    expect(cache.get("new")).toBe("z");
  });

  it("evicts the least recently used entry when nothing has expired", () => {
    const cache = new TtlCache<string>(10_000, 2);
    cache.set("a", "1");
    cache.set("b", "2");
    cache.set("c", "3");

    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe("2");
    expect(cache.get("c")).toBe("3");
  });

  it("treats a read as recent use, sparing a hot key from eviction", () => {
    const cache = new TtlCache<string>(10_000, 2);
    cache.set("a", "1");
    cache.set("b", "2");
    cache.get("a"); // refreshes "a", making "b" the least recently used
    cache.set("c", "3");

    expect(cache.get("a")).toBe("1");
    expect(cache.get("b")).toBeUndefined();
  });

  it("stays within its size cap", () => {
    const cache = new TtlCache<number>(10_000, 5);
    for (let i = 0; i < 50; i++) cache.set(`k${i}`, i);

    const live = Array.from({ length: 50 }, (_, i) => cache.get(`k${i}`)).filter(
      (value) => value !== undefined
    );
    expect(live.length).toBeLessThanOrEqual(5);
  });
});
