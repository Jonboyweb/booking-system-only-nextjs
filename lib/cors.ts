import { NextRequest, NextResponse } from 'next/server';

/**
 * CORS configuration for the booking system API
 * Manages allowed origins, methods, headers, and credentials
 */

export interface CORSOptions {
  origin?: string | string[] | boolean | ((origin: string | undefined) => boolean | string);
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

// Default CORS configuration
const DEFAULT_CORS_OPTIONS: CORSOptions = {
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: [],
  credentials: true,
  maxAge: 86400 // 24 hours
};

/**
 * Get allowed origins from environment variables
 * Supports comma-separated list in ALLOWED_ORIGINS env variable
 */
export function getAllowedOrigins(): string[] {
  const defaultOrigins = [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  ];

  // In development, allow common localhost ports
  if (process.env.NODE_ENV === 'development') {
    defaultOrigins.push(
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    );
  } else {
    // Production URLs
    defaultOrigins.push(
      'https://br.door50a.co.uk',
      'https://backroomleeds.co.uk'
    );
  }

  // Add custom origins from environment variable
  const customOrigins = process.env.ALLOWED_ORIGINS?.split(',')
    .map(origin => origin.trim())
    .filter(Boolean) || [];

  return [...new Set([...defaultOrigins, ...customOrigins])];
}

/**
 * Check if an origin is allowed
 */
export function isOriginAllowed(origin: string | null | undefined): boolean {
  if (!origin) return false;

  const allowedOrigins = getAllowedOrigins();

  // Check exact match
  if (allowedOrigins.includes(origin)) return true;

  // Check wildcard patterns (e.g., for subdomains)
  return allowedOrigins.some(allowed => {
    if (allowed.includes('*')) {
      const pattern = allowed.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(origin);
    }
    return false;
  });
}

/**
 * Set CORS headers on a NextResponse
 */
export function setCORSHeaders(
  response: NextResponse,
  request: NextRequest,
  options: CORSOptions = {}
): NextResponse {
  const opts = { ...DEFAULT_CORS_OPTIONS, ...options };
  const origin = request.headers.get('origin');

  // Handle origin
  if (opts.origin === true) {
    // Allow any origin
    response.headers.set('Access-Control-Allow-Origin', '*');
  } else if (typeof opts.origin === 'string') {
    // Allow specific origin
    response.headers.set('Access-Control-Allow-Origin', opts.origin);
  } else if (Array.isArray(opts.origin)) {
    // Allow origins from array
    if (origin && opts.origin.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Vary', 'Origin');
    }
  } else if (typeof opts.origin === 'function') {
    // Use custom function to determine allowed origin
    const result = opts.origin(origin || undefined);
    if (result) {
      response.headers.set('Access-Control-Allow-Origin', typeof result === 'string' ? result : origin!);
      response.headers.set('Vary', 'Origin');
    }
  } else {
    // Default: check against allowed origins
    if (origin && isOriginAllowed(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Vary', 'Origin');
    }
  }

  // Set other CORS headers
  if (opts.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  if (opts.methods && opts.methods.length > 0) {
    response.headers.set('Access-Control-Allow-Methods', opts.methods.join(', '));
  }

  if (opts.allowedHeaders && opts.allowedHeaders.length > 0) {
    response.headers.set('Access-Control-Allow-Headers', opts.allowedHeaders.join(', '));
  }

  if (opts.exposedHeaders && opts.exposedHeaders.length > 0) {
    response.headers.set('Access-Control-Expose-Headers', opts.exposedHeaders.join(', '));
  }

  if (opts.maxAge) {
    response.headers.set('Access-Control-Max-Age', opts.maxAge.toString());
  }

  return response;
}

/**
 * Handle preflight OPTIONS requests
 */
export function handlePreflightRequest(
  request: NextRequest,
  options: CORSOptions = {}
): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  return setCORSHeaders(response, request, options);
}

/**
 * Create a CORS middleware wrapper for API routes
 */
export function createCORSMiddleware(options: CORSOptions = {}) {
  return (request: NextRequest): NextResponse | null => {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return handlePreflightRequest(request, options);
    }

    // For other requests, return null to continue processing
    // CORS headers will be added to the response later
    return null;
  };
}

/**
 * Apply CORS to an existing NextResponse
 */
export function withCORS(
  response: NextResponse,
  request: NextRequest,
  options: CORSOptions = {}
): NextResponse {
  return setCORSHeaders(response, request, options);
}