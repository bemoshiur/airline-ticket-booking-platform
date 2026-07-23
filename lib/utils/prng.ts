/**
 * Seeded pseudo-random number generator (Mulberry32).
 * Deterministic: same seed always produces the same sequence.
 */
export class SeededPRNG {
  private state: number;

  constructor(seed: string | number) {
    if (typeof seed === "string") {
      // Convert string seed to number via hash
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit int
      }
      this.state = hash;
    } else {
      this.state = seed;
    }
  }

  /** Returns a float in [0, 1) */
  next(): number {
    let t = this.state += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  /** Returns an integer in [min, max] inclusive */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Returns a float in [min, max) */
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /** Pick a random element from an array */
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** Shuffle array (Fisher-Yates) */
  shuffle<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /** Returns a random subset of size n */
  subset<T>(arr: T[], n: number): T[] {
    return this.shuffle(arr).slice(0, Math.min(n, arr.length));
  }

  /** Roll a dice: returns true with probability p */
  chance(p: number): boolean {
    return this.next() < p;
  }
}
