// In-memory fixed-window rate limiter for API-key traffic. Adequate for the
// current single-container deploy; state is per-process and resets on restart.
// (If the app ever scales horizontally, swap this for a shared store.)

const WINDOW_MS = 60_000;
const DEFAULT_LIMIT = Number(process.env.API_RATE_LIMIT ?? 120); // requests / window

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export type RateResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter: number; // seconds until the window resets (0 when ok)
};

// Consume one unit for `key`. Buckets are created lazily and rolled over once
// their window elapses, so the map only holds recently-active keys.
export function rateLimit(key: string, limit = DEFAULT_LIMIT): RateResult {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    b = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, b);
  }
  b.count += 1;
  const remaining = Math.max(0, limit - b.count);
  const ok = b.count <= limit;
  return {
    ok,
    limit,
    remaining,
    resetAt: b.resetAt,
    retryAfter: ok ? 0 : Math.ceil((b.resetAt - now) / 1000),
  };
}
