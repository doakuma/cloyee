/**
 * Sliding-window rate limiter (in-memory, per-process).
 *
 * IMPORTANT — production caveat:
 * Vercel and other serverless platforms spin up multiple isolated instances,
 * so this in-memory store is NOT shared across them. For multi-instance
 * production deployments, replace the `store` with Upstash Redis or
 * Vercel KV using the same interface below.
 *
 * For the current usage (Claude API abuse prevention) this is still
 * meaningful: each instance enforces its own window, making mass abuse
 * harder even if not perfectly global.
 */

/** @type {Map<string, number[]>} key → array of request timestamps (ms) */
const store = new Map();

// Periodically clean up expired entries to prevent memory growth
// (runs in the module scope — fires once per process lifetime)
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of store.entries()) {
    const fresh = timestamps.filter((t) => now - t < 60_000);
    if (fresh.length === 0) {
      store.delete(key);
    } else {
      store.set(key, fresh);
    }
  }
}, 60_000);

/**
 * Check whether a key is within the allowed rate limit.
 *
 * @param {string}  key        - unique identifier (user id or IP)
 * @param {object}  [opts]
 * @param {number}  [opts.max=20]         - max requests per window
 * @param {number}  [opts.windowMs=60000] - window size in milliseconds
 * @returns {{ allowed: boolean, remaining: number, retryAfterSec: number }}
 */
export function checkRateLimit(key, opts = {}) {
  const max = opts.max ?? 20;
  const windowMs = opts.windowMs ?? 60_000;
  const now = Date.now();

  const timestamps = (store.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= max) {
    // Oldest request in the window determines when they can retry
    const oldest = timestamps[0];
    const retryAfterSec = Math.ceil((oldest + windowMs - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  timestamps.push(now);
  store.set(key, timestamps);

  return { allowed: true, remaining: max - timestamps.length, retryAfterSec: 0 };
}

/**
 * Extract the best available client identifier from a Next.js Request.
 * Authenticated users use their user ID; guests fall back to IP.
 *
 * @param {Request} request
 * @param {string|null} userId - authenticated user id, or null for guests
 * @returns {string}
 */
export function getRateLimitKey(request, userId) {
  if (userId) return `user:${userId}`;

  const xff = request.headers.get("x-forwarded-for");
  const ip = xff ? xff.split(",")[0].trim() : (request.headers.get("x-real-ip") ?? "unknown");
  return `ip:${ip}`;
}
