import { LRUCache } from 'lru-cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Rate limiting utility for API endpoints
 * Uses LRU cache for efficient request tracking
 */

export interface RateLimitOptions {
  uniqueTokenPerInterval?: number;  // Max number of unique tokens
  interval?: number;                 // Time window in milliseconds
  limit?: number;                    // Max requests per interval
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// Different rate limiters for different endpoints
const rateLimiters = new Map<string, LRUCache<string, number[]>>();

/**
 * Get or create a rate limiter for a specific endpoint
 */
function getRateLimiter(
  endpoint: string,
  options: RateLimitOptions = {}
): LRUCache<string, number[]> {
  const key = `${endpoint}-${options.interval || 60000}`;

  if (!rateLimiters.has(key)) {
    const limiter = new LRUCache<string, number[]>({
      max: options.uniqueTokenPerInterval || 500,
      ttl: options.interval || 60000, // Default 1 minute
    });
    rateLimiters.set(key, limiter);
  }

  return rateLimiters.get(key)!;
}

/**
 * Get client identifier from request
 * Uses IP address, falls back to a hash of headers if IP not available
 */
export function getClientIdentifier(request: NextRequest): string {
  // Try to get IP from various headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (forwardedFor) {
    // x-forwarded-for may contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to a combination of user agent and accept headers
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const accept = request.headers.get('accept') || 'unknown';

  // Simple hash function for fallback identifier
  const hash = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  };

  return `fallback-${hash(userAgent + accept)}`;
}

/**
 * Check if a request should be rate limited
 */
export async function checkRateLimit(
  request: NextRequest,
  endpoint: string,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const {
    limit = 10,
    interval = 60000, // 1 minute default
    uniqueTokenPerInterval = 500
  } = options;

  const identifier = getClientIdentifier(request);
  const limiter = getRateLimiter(endpoint, { uniqueTokenPerInterval, interval });

  const now = Date.now();
  const windowStart = now - interval;

  // Get or initialize request timestamps for this identifier
  let timestamps = limiter.get(identifier) || [];

  // Filter out old timestamps outside the current window
  timestamps = timestamps.filter(ts => ts > windowStart);

  // Check if limit is exceeded
  if (timestamps.length >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Math.min(...timestamps) + interval
    };
  }

  // Add current timestamp and update cache
  timestamps.push(now);
  limiter.set(identifier, timestamps);

  return {
    success: true,
    limit,
    remaining: limit - timestamps.length,
    reset: now + interval
  };
}

/**
 * Rate limiting middleware for API routes
 */
export function rateLimitMiddleware(
  endpoint: string,
  options: RateLimitOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const result = await checkRateLimit(request, endpoint, options);

    if (!result.success) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000)
        },
        { status: 429 }
      );

      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', result.limit.toString());
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', new Date(result.reset).toISOString());
      response.headers.set('Retry-After', Math.ceil((result.reset - Date.now()) / 1000).toString());

      return response;
    }

    // Request is within rate limit, continue processing
    return null;
  };
}

/**
 * Apply rate limit headers to a response
 */
export function applyRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(result.reset).toISOString());

  if (!result.success) {
    response.headers.set('Retry-After', Math.ceil((result.reset - Date.now()) / 1000).toString());
  }

  return response;
}

/**
 * Higher-order function to wrap an API route handler with rate limiting
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  endpoint: string,
  options: RateLimitOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const rateLimitResult = await checkRateLimit(request, endpoint, options);

    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        },
        { status: 429 }
      );

      return applyRateLimitHeaders(response, rateLimitResult);
    }

    // Execute the original handler
    const response = await handler(request);

    // Add rate limit headers to successful response
    return applyRateLimitHeaders(response, rateLimitResult);
  };
}

// Pre-configured rate limiters for common endpoints
export const RateLimitConfigs = {
  // Public booking creation - strict limit
  bookingCreate: {
    limit: 5,
    interval: 60000 // 5 requests per minute
  },

  // Payment intent creation - moderate limit
  paymentIntent: {
    limit: 10,
    interval: 60000 // 10 requests per minute
  },

  // Admin login - strict limit to prevent brute force
  adminLogin: {
    limit: 5,
    interval: 60000 // 5 requests per minute
  },

  // General API endpoints - relaxed limit
  general: {
    limit: 60,
    interval: 60000 // 60 requests per minute
  },

  // Read-only endpoints - higher limit
  readonly: {
    limit: 100,
    interval: 60000 // 100 requests per minute
  }
} as const;