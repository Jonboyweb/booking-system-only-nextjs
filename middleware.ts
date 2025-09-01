import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if it's an admin route
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Allow access to login page and auth API routes
    if (request.nextUrl.pathname === '/admin/login' || 
        request.nextUrl.pathname.startsWith('/api/admin/auth/')) {
      return NextResponse.next();
    }

    // Check for admin token
    const token = request.cookies.get('admin-token')?.value;
    
    if (!token) {
      // Redirect to login if no token
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // For now, we just check if token exists
    // Full JWT verification should be done in API routes, not Edge Runtime
    // The presence of the httpOnly cookie is sufficient for basic protection
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*'
};