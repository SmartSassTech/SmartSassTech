/**
 * Simple in-memory rate limiter.
 * Sufficient for single-server deployment (Vercel hobby/pro with a single region).
 * State resets on server restart / new deploy.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

interface RateLimitOptions {
  /** Maximum number of requests allowed in the window */
  limit: number
  /** Window size in seconds */
  windowSeconds: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

export function rateLimit(ip: string, options: RateLimitOptions): RateLimitResult {
  const { limit, windowSeconds } = options
  const now = Date.now()
  const windowMs = windowSeconds * 1000

  const key = `${ip}:${Math.floor(now / windowMs)}`

  const entry = store.get(key) ?? { count: 0, resetAt: now + windowMs }

  if (now > entry.resetAt) {
    // Window has expired — start fresh
    entry.count = 0
    entry.resetAt = now + windowMs
  }

  entry.count += 1
  store.set(key, entry)

  // Periodically prune stale entries to avoid memory leaks
  if (Math.random() < 0.01) {
    for (const [k, v] of store.entries()) {
      if (now > v.resetAt) store.delete(k)
    }
  }

  return {
    success: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  }
}

/**
 * Returns the client IP from a NextRequest, checking proxy headers first.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') ?? '127.0.0.1'
}
