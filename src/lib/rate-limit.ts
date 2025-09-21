import { NextRequest } from 'next/server'

// In-memory storage for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
}

/**
 * Rate limiting function
 * @param request - Next.js request object
 * @param action - Action being rate limited (e.g., 'login', 'register')
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns Promise<RateLimitResult>
 */
export async function rateLimit(
  request: NextRequest,
  action: string,
  maxRequests: number = 100,
  windowMs: number = 900000 // 15 minutes
): Promise<RateLimitResult> {
  const identifier = getClientIdentifier(request)
  const key = `${action}:${identifier}`
  const now = Date.now()
  const windowStart = now - windowMs

  // Clean up expired entries
  cleanupExpiredEntries(windowStart)

  // Get current count for this key
  const current = rateLimitStore.get(key)

  if (!current || current.resetTime < now) {
    // First request or window expired
    const resetTime = now + windowMs
    rateLimitStore.set(key, { count: 1, resetTime })

    return {
      success: true,
      remaining: maxRequests - 1,
      resetTime,
    }
  }

  if (current.count >= maxRequests) {
    // Rate limit exceeded
    return {
      success: false,
      remaining: 0,
      resetTime: current.resetTime,
    }
  }

  // Increment count
  current.count++
  rateLimitStore.set(key, current)

  return {
    success: true,
    remaining: maxRequests - current.count,
    resetTime: current.resetTime,
  }
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get IP address from various headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown'

  // Include user agent for additional uniqueness
  const userAgent = request.headers.get('user-agent') || 'unknown'

  // Simple hash function for Edge Runtime compatibility
  const identifier = `${ip}:${userAgent}`
  let hash = 0
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(16).substring(0, 16)
}

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries(windowStart: number): void {
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < windowStart) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Clear rate limit for a specific key (useful for testing)
 */
export function clearRateLimit(action: string, identifier: string): void {
  const key = `${action}:${identifier}`
  rateLimitStore.delete(key)
}

/**
 * Get current rate limit status
 */
export function getRateLimitStatus(
  request: NextRequest,
  action: string,
  maxRequests: number = 100
): { count: number; remaining: number; resetTime: number | null } {
  const identifier = getClientIdentifier(request)
  const key = `${action}:${identifier}`
  const current = rateLimitStore.get(key)

  if (!current) {
    return {
      count: 0,
      remaining: maxRequests,
      resetTime: null,
    }
  }

  return {
    count: current.count,
    remaining: Math.max(0, maxRequests - current.count),
    resetTime: current.resetTime,
  }
}

/**
 * Advanced rate limiting with multiple tiers
 */
export async function advancedRateLimit(
  request: NextRequest,
  action: string,
  config: {
    minute?: { max: number; window: number }
    hour?: { max: number; window: number }
    day?: { max: number; window: number }
  }
): Promise<RateLimitResult> {
  const checks = []

  if (config.minute) {
    checks.push(rateLimit(request, `${action}:minute`, config.minute.max, config.minute.window))
  }

  if (config.hour) {
    checks.push(rateLimit(request, `${action}:hour`, config.hour.max, config.hour.window))
  }

  if (config.day) {
    checks.push(rateLimit(request, `${action}:day`, config.day.max, config.day.window))
  }

  const results = await Promise.all(checks)

  // If any check fails, return the most restrictive result
  const failed = results.find(result => !result.success)
  if (failed) {
    return failed
  }

  // Return the result with the least remaining requests
  return results.reduce((min, current) =>
    current.remaining < min.remaining ? current : min
  )
}

/**
 * User-specific rate limiting (requires authentication)
 */
export async function userRateLimit(
  userId: string,
  action: string,
  maxRequests: number = 100,
  windowMs: number = 900000
): Promise<RateLimitResult> {
  const key = `user:${action}:${userId}`
  const now = Date.now()

  const current = rateLimitStore.get(key)

  if (!current || current.resetTime < now) {
    const resetTime = now + windowMs
    rateLimitStore.set(key, { count: 1, resetTime })

    return {
      success: true,
      remaining: maxRequests - 1,
      resetTime,
    }
  }

  if (current.count >= maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: current.resetTime,
    }
  }

  current.count++
  rateLimitStore.set(key, current)

  return {
    success: true,
    remaining: maxRequests - current.count,
    resetTime: current.resetTime,
  }
}