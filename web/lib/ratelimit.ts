import "server-only";

// In-memory fixed window. Di Vercel serverless tiap instance punya Map sendiri → tidak global
// (cukup untuk demo; upgrade: Upstash Redis). Lihat ARCHITECTURE.md.

type Bucket = { count: number; resetAt: number };

export type RateLimitResult = { ok: true } | { ok: false; retryAfterS: number };

export function createRateLimiter(limit: number, windowMs: number) {
  const buckets = new Map<string, Bucket>();

  return function hit(key: string, now = Date.now()): RateLimitResult {
    // Bersihkan bucket kedaluwarsa sesekali supaya Map tidak tumbuh tanpa batas.
    if (buckets.size > 5000) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    }
    const b = buckets.get(key);
    if (!b || b.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return { ok: true };
    }
    if (b.count >= limit) return { ok: false, retryAfterS: Math.ceil((b.resetAt - now) / 1000) };
    b.count++;
    return { ok: true };
  };
}

/** 20 req / IP / jam — terpisah per endpoint (API_SPEC §Umum). */
export const attestLimiter = createRateLimiter(20, 60 * 60 * 1000);
export const auraLimiter = createRateLimiter(20, 60 * 60 * 1000);
