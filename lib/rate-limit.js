// Simple in-memory rate limiter for development
// TODO: Replace with Redis-based implementation for production

const rateLimitMap = new Map()

export function rateLimit(identifier, limit = 10, windowMs = 60000) {
  const now = Date.now()
  const windowStart = now - windowMs
  
  // Clean up old entries
  for (const [key, requests] of rateLimitMap.entries()) {
    rateLimitMap.set(key, requests.filter(time => time > windowStart))
    if (rateLimitMap.get(key).length === 0) {
      rateLimitMap.delete(key)
    }
  }
  
  // Get current requests for this identifier
  const requests = rateLimitMap.get(identifier) || []
  
  // Check if limit exceeded
  if (requests.length >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      resetTime: Math.min(...requests) + windowMs
    }
  }
  
  // Add current request
  requests.push(now)
  rateLimitMap.set(identifier, requests)
  
  return {
    success: true,
    limit,
    remaining: limit - requests.length,
    resetTime: now + windowMs
  }
}

export function createRateLimitHandler(limit = 10, windowMs = 60000) {
  return function rateLimitMiddleware(req) {
    // Create identifier from IP + user ID if available
    const forwarded = req.headers['x-forwarded-for']
    const ip = forwarded ? forwarded.split(',')[0] : req.headers['x-real-ip'] || 'unknown'
    const userId = req.user?.id || 'anonymous'
    const identifier = `${ip}:${userId}`
    
    const result = rateLimit(identifier, limit, windowMs)
    
    if (!result.success) {
      return new Response('Too Many Requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString()
        }
      })
    }
    
    return null // Continue processing
  }
}