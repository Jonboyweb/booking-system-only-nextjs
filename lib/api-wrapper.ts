import { NextRequest, NextResponse } from 'next/server';
import { withCORS } from '@/lib/cors';
import { checkRateLimit, applyRateLimitHeaders, RateLimitOptions } from '@/lib/rate-limit';

/**
 * Wrapper function to apply CORS and rate limiting to API routes
 * This is used directly in API route handlers to avoid Edge Runtime issues
 */

export interface ApiWrapperOptions {
  rateLimit?: RateLimitOptions & { endpoint: string };
  cors?: boolean;
}

/**
 * Wrap an API handler with CORS and rate limiting
 */
export function withApiMiddleware(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: ApiWrapperOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Apply rate limiting if configured
      if (options.rateLimit) {
        const rateLimitResult = await checkRateLimit(
          request,
          options.rateLimit.endpoint,
          options.rateLimit
        );

        if (!rateLimitResult.success) {
          const response = NextResponse.json(
            {
              success: false,
              error: 'Too many requests. Please try again later.',
              retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
            },
            { status: 429 }
          );

          const finalResponse = options.cors !== false
            ? withCORS(response, request)
            : response;

          return applyRateLimitHeaders(finalResponse, rateLimitResult);
        }

        // Execute the handler
        const response = await handler(request);

        // Apply CORS and rate limit headers to successful response
        const corsResponse = options.cors !== false
          ? withCORS(response, request)
          : response;

        return applyRateLimitHeaders(corsResponse, rateLimitResult);
      }

      // No rate limiting, just execute handler
      const response = await handler(request);

      // Apply CORS if enabled
      return options.cors !== false
        ? withCORS(response, request)
        : response;

    } catch (error) {
      console.error('API handler error:', error);

      const errorResponse = NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error'
        },
        { status: 500 }
      );

      // Apply CORS to error response
      return options.cors !== false
        ? withCORS(errorResponse, request)
        : errorResponse;
    }
  };
}