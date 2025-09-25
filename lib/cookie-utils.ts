/**
 * Cookie utilities for consistent cross-browser compatibility
 */

import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

export interface CookieOptions extends Partial<ResponseCookie> {
  maxAge?: number;
  expires?: Date;
}

/**
 * Get environment-aware cookie configuration
 * Ensures proper settings for development, staging, and production
 */
export function getSecureCookieOptions(options: CookieOptions = {}): CookieOptions {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const isLocalhost = appUrl.includes('localhost') || appUrl.includes('127.0.0.1');
  const isHttps = appUrl.startsWith('https://');

  // Base configuration
  const baseOptions: CookieOptions = {
    httpOnly: true,
    path: '/',
    // Default to 24 hours if not specified
    maxAge: options.maxAge || 24 * 60 * 60,
  };

  // Environment-specific settings
  if (isDevelopment || isLocalhost || !isHttps) {
    // Development/localhost/HTTP settings
    return {
      ...baseOptions,
      ...options,
      // Never use secure flag on HTTP connections
      secure: false,
      // Use 'lax' for localhost to allow navigation
      sameSite: 'lax',
    };
  } else {
    // Production HTTPS settings
    // For production, we'll use a more conservative approach:
    // - Use 'lax' by default for better compatibility
    // - Only use 'none' if explicitly needed for cross-origin scenarios
    // This fixes issues with Chrome and Safari on iPad
    return {
      ...baseOptions,
      ...options,
      // Use secure flag on HTTPS
      secure: true,
      // Use 'lax' for production - more compatible across browsers
      // 'lax' allows cookies on navigation (like login redirects)
      // but blocks them on cross-site subrequests
      sameSite: 'lax',
      // Set domain if available (helps with subdomains)
      ...(process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN }),
    };
  }
}

/**
 * Get admin token cookie options
 * Specific configuration for admin authentication cookies
 */
export function getAdminTokenCookieOptions(): CookieOptions {
  return getSecureCookieOptions({
    maxAge: 24 * 60 * 60, // 24 hours
    // Add explicit name for debugging
    name: 'admin-token',
  });
}

/**
 * Clear cookie options (for logout)
 */
export function getClearCookieOptions(): CookieOptions {
  const options = getSecureCookieOptions({
    maxAge: 0,
    expires: new Date(0),
  });

  // Ensure cookie is cleared regardless of sameSite setting
  return {
    ...options,
    // Try to clear with both settings to ensure compatibility
    sameSite: 'lax',
  };
}