/**
 * Fixed-window limits per client and overall, in memory.
 *
 * Limitation: each server instance keeps its own counters, so on a multi-instance or serverless
 * host the real ceiling is (limit × instances). Good enough to stop accidental loops and casual
 * abuse; move to a shared store (e.g. Redis/KV) before relying on it for hard cost caps.
 */

interface Window {
  start: number;
  count: number;
}

export interface RateLimitConfig {
  perClient: { windowMs: number; max: number }[];
  /** All clients together, per day. Protects the bill. */
  globalPerDay: number;
}

export const DEFAULT_LIMITS: RateLimitConfig = {
  perClient: [
    { windowMs: 10 * 60_000, max: 20 },
    { windowMs: 24 * 3_600_000, max: 120 },
  ],
  globalPerDay: 3000,
};

export class RateLimiter {
  private clients = new Map<string, Window[]>();
  private global: Window = { start: 0, count: 0 };

  constructor(private config: RateLimitConfig = DEFAULT_LIMITS) {}

  /** Records one request and returns false if it is over a limit (the request is then not counted). */
  take(clientKey: string, now = Date.now()): boolean {
    const day = 24 * 3_600_000;
    if (now - this.global.start >= day) this.global = { start: now, count: 0 };
    if (this.global.count >= this.config.globalPerDay) return false;

    const windows =
      this.clients.get(clientKey) ?? this.config.perClient.map(() => ({ start: now, count: 0 }));
    windows.forEach((w, i) => {
      if (now - w.start >= this.config.perClient[i].windowMs) {
        w.start = now;
        w.count = 0;
      }
    });
    if (windows.some((w, i) => w.count >= this.config.perClient[i].max)) return false;

    windows.forEach((w) => w.count++);
    this.global.count++;
    this.clients.set(clientKey, windows);
    if (this.clients.size > 50_000) this.clients.clear(); // bound memory under abuse
    return true;
  }
}
