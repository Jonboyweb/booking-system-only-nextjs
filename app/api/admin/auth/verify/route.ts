import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserDetailed } from '@/src/middleware/auth';
import { isTokenExpired } from '@/src/lib/auth/jwt';

/**
 * Verify JWT token and return user information
 * Used by frontend to check authentication status
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from cookie or header
    const token = request.cookies.get('admin-token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        {
          authenticated: false,
          error: 'No token provided'
        },
        { status: 401 }
      );
    }

    // Check if token is expired (quick check)
    if (isTokenExpired(token)) {
      return NextResponse.json(
        {
          authenticated: false,
          error: 'Token expired',
          expired: true
        },
        { status: 401 }
      );
    }

    // Perform full authentication check
    const authResult = await getAuthUserDetailed(request);

    if (!authResult.authenticated) {
      return NextResponse.json(
        {
          authenticated: false,
          error: authResult.error || 'Invalid token',
          expired: authResult.expired || false
        },
        { status: 401 }
      );
    }

    // Return user information
    return NextResponse.json({
      authenticated: true,
      user: {
        id: authResult.user!.userId,
        email: authResult.user!.email,
        name: authResult.user!.name,
        role: authResult.user!.role
      },
      tokenExp: authResult.user!.exp,
      tokenIat: authResult.user!.iat
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      {
        authenticated: false,
        error: 'Token verification failed'
      },
      { status: 500 }
    );
  }
}

/**
 * Refresh token endpoint (for future implementation)
 * Currently returns a message indicating the feature is not yet available
 */
export async function POST() {
  // This endpoint is reserved for future refresh token implementation
  return NextResponse.json(
    {
      error: 'Token refresh not yet implemented',
      message: 'Please log in again when your session expires'
    },
    { status: 501 }
  );
}