import { NextRequest, NextResponse } from 'next/server';
import { validateAdminToken } from '@/src/middleware/auth';

export async function middleware(request: NextRequest) {
  // Handle preflight OPTIONS requests for API routes
  if (request.nextUrl.pathname.startsWith('/api/') && request.method === 'OPTIONS') {
    // Simple CORS preflight response
    const response = new NextResponse(null, { status: 204 });
    const origin = request.headers.get('origin');

    // Set CORS headers for preflight
    if (origin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Vary', 'Origin');
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Max-Age', '86400');

    return response;
  }

  // Check if it's an admin route
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Allow access to login page and login API endpoint only
    if (request.nextUrl.pathname === '/admin/login' ||
        request.nextUrl.pathname === '/api/admin/auth/login') {
      return NextResponse.next();
    }

    // Check for admin token
    const token = request.cookies.get('admin-token')?.value;

    if (!token) {
      // API routes should return 401, pages should redirect to login
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Perform lightweight token validation (Edge Runtime compatible)
    const isValid = await validateAdminToken(token);

    if (!isValid) {
      // Clear invalid token
      const response = request.nextUrl.pathname.startsWith('/api/')
        ? NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
        : NextResponse.redirect(new URL('/admin/login', request.url));

      response.cookies.delete('admin-token');
      return response;
    }

    // Token is valid, continue to the route
    // Full JWT verification with database checks happens in API routes
    return NextResponse.next();
  }

  // Check if it's an admin API route that doesn't start with /admin
  if (request.nextUrl.pathname.startsWith('/api/admin/')) {
    // Allow login and 2FA verification endpoints without authentication
    if (request.nextUrl.pathname === '/api/admin/auth/login' ||
        request.nextUrl.pathname === '/api/admin/auth/2fa/verify') {
      return NextResponse.next();
    }

    // Check for token in cookie or Authorization header
    const token = request.cookies.get('admin-token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate token
    const isValid = await validateAdminToken(token);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/:path*'
  ]
};