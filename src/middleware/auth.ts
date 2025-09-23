import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, verifyTokenDetailed, JWTPayload } from '@/src/lib/auth/jwt';
import { prisma } from '@/lib/db';

/**
 * Check if request has a valid authentication token
 */
export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('admin-token')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return false;
  }

  const payload = verifyToken(token);
  return payload !== null;
}

/**
 * Get authenticated user from request
 * Performs full JWT verification with expiration checks
 */
export async function getAuthUser(request: NextRequest): Promise<JWTPayload | null> {
  const token = request.cookies.get('admin-token')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);

  // Additional security: Verify user still exists and is active
  if (payload) {
    try {
      const user = await prisma.adminUser.findUnique({
        where: {
          id: payload.userId,
          isActive: true
        }
      });

      if (!user) {
        console.error(`JWT valid but user ${payload.userId} not found or inactive`);
        return null;
      }

      // Update payload with current user role (in case it changed)
      payload.role = user.role;
    } catch (error) {
      console.error('Error verifying user status:', error);
      // Continue with cached payload if DB check fails
    }
  }

  return payload;
}

/**
 * Get authenticated user with detailed error information
 */
export async function getAuthUserDetailed(request: NextRequest) {
  const token = request.cookies.get('admin-token')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return {
      authenticated: false,
      error: 'No token provided',
      user: null
    };
  }

  const result = verifyTokenDetailed(token);

  if (!result.valid) {
    return {
      authenticated: false,
      error: result.error,
      expired: result.expired,
      user: null
    };
  }

  // Verify user still exists and is active
  if (result.payload) {
    try {
      const user = await prisma.adminUser.findUnique({
        where: {
          id: result.payload.userId,
          isActive: true
        }
      });

      if (!user) {
        return {
          authenticated: false,
          error: 'User account not found or deactivated',
          user: null
        };
      }

      // Update payload with current user role
      result.payload.role = user.role;
    } catch (error) {
      console.error('Error verifying user status:', error);
      // Continue with cached payload if DB check fails
    }
  }

  return {
    authenticated: true,
    user: result.payload
  };
}

/**
 * Middleware to require authentication with optional role-based access control
 */
export function requireAuth(allowedRoles: string[] = []) {
  return async function middleware(request: NextRequest) {
    const authResult = await getAuthUserDetailed(request);

    if (!authResult.authenticated) {
      return NextResponse.json(
        {
          error: authResult.error || 'Unauthorized',
          expired: authResult.expired
        },
        { status: 401 }
      );
    }

    const user = authResult.user;
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Check role-based access
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
          userRole: user.role
        },
        { status: 403 }
      );
    }

    // Log access for audit trail (optional)
    if (process.env.NODE_ENV === 'production') {
      console.log(`[AUTH] User ${user.email} (${user.role}) accessed ${request.url}`);
    }

    return null; // Continue to the route handler
  };
}

/**
 * Validate admin token for middleware (lightweight check)
 * Used in Next.js middleware which runs in Edge Runtime
 */
export async function validateAdminToken(token: string): Promise<boolean> {
  if (!token) return false;

  try {
    // In Edge Runtime, we can't use the full JWT verification
    // This is a simplified check - full verification happens in API routes
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Decode payload
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    // Check expiration
    if (payload.exp) {
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp < currentTime) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}