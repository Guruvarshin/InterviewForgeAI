// Simple sliding-window in-memory limiter (per process).
// Good for Vercel Dev / single server. For multi-region/prod, swap to Upstash/Redis.

const buckets = new Map(); // key -> [timestamps]

function now() {
  return Date.now();
}

/**
 * Assert the caller is within rate limits; throws 429 if exceeded.
 * @param {Object} o
 * @param {string} o.key         Unique key: userId or IP
 * @param {number} o.limit       Max requests in the window
 * @param {number} o.windowMs    Window size in ms
 * @param {string} [o.errorMsg]  Optional custom error message
 */
export function assertRateLimit({ key, limit, windowMs, errorMsg }) {
  if (!key) throw Object.assign(new Error("Missing rate limit key"), { status: 400 });

  const t = now();
  const since = t - windowMs;

  const arr = buckets.get(key) || [];
  // drop old stamps
  const fresh = arr.filter((ts) => ts >= since);
  if (fresh.length >= limit) {
    const err = new Error(errorMsg || "Too many requests, please slow down.");
    err.status = 429;
    throw err;
  }
  fresh.push(t);
  buckets.set(key, fresh);
}

export function getClientIP(req) {
  try {
    // Next.js Request in app router
    const xf = req.headers.get("x-forwarded-for");
    if (xf) return xf.split(",")[0].trim();
    const rip = req.headers.get("x-real-ip");
    if (rip) return rip.trim();
  } catch {}
  return "unknown";
}

/** Convenience helper to build keys consistently */
export function rateKey(parts = []) {
  return parts.filter(Boolean).join(":");
}
