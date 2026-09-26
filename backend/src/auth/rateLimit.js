/**
 * Simple in-memory rate limiter for auth endpoints.
 * Limitation: per-process only; not shared across instances.
 */
export function createRateLimiter({ windowMs, max, name = 'auth' }) {
  /** @type {Map<string, { count: number, resetAt: number }>} */
  const buckets = new Map();

  function clientKey(req) {
    return (
      req.ip ||
      req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown'
    );
  }

  return function rateLimit(req, res, next) {
    if (process.env.NODE_ENV === 'test') return next();
    const key = `${name}:${clientKey(req)}`;
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > max) {
      res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
      return res.status(429).json({ error: 'Too many requests' });
    }
    return next();
  };
}

/** Test helper */
export function __clearRateLimitBucketsForTests(limiter) {
  if (limiter && typeof limiter.reset === 'function') limiter.reset();
}
