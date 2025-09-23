import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken';
import { AdminUser } from '@/lib/generated/prisma';

// Security: Ensure JWT_SECRET is properly set
const JWT_SECRET = process.env.JWT_SECRET;

// Strict secret validation
function getJWTSecret(): string {
  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be at least 32 characters in production');
    }
    // Only use default in development
    console.warn('WARNING: Using default JWT secret. This is insecure and should only be used in development.');
    return 'development-only-secret-key-minimum-32-chars';
  }
  return JWT_SECRET;
}

const JWT_ALGORITHM = 'HS256' as const;
const JWT_EXPIRES_IN = '24h';
const JWT_MAX_AGE = 24 * 60 * 60; // 24 hours in seconds
const JWT_ISSUER = 'backroom-booking-system';
const JWT_AUDIENCE = 'backroom-admin';

export interface JWTPayload extends JwtPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
  iat?: number;
  exp?: number;
}

export interface TokenVerificationResult {
  valid: boolean;
  payload?: JWTPayload;
  error?: string;
  expired?: boolean;
}

/**
 * Generate a secure JWT token with proper algorithm and expiration
 */
export function generateToken(user: Partial<AdminUser>): string {
  if (!user.id || !user.email || !user.role || !user.name) {
    throw new Error('Invalid user data for token generation');
  }

  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  };

  return jwt.sign(payload, getJWTSecret(), {
    algorithm: JWT_ALGORITHM,
    expiresIn: JWT_EXPIRES_IN,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    notBefore: 0 // Token valid immediately
  });
}

/**
 * Verify JWT token with proper security checks
 * Returns null only for invalid/expired tokens
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    // Validate token format first
    if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
      return null;
    }

    const decoded = jwt.verify(token, getJWTSecret(), {
      algorithms: [JWT_ALGORITHM],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      maxAge: `${JWT_MAX_AGE}s`, // Ensure proper format
      clockTolerance: 30 // Allow 30 seconds clock skew
    }) as JWTPayload;

    // Additional validation
    if (!decoded.userId || !decoded.email || !decoded.role) {
      console.error('JWT payload missing required fields');
      return null;
    }

    // Verify token age manually as additional check
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      console.error('Token expired based on exp claim');
      return null;
    }

    if (decoded.iat) {
      const tokenAge = currentTime - decoded.iat;
      if (tokenAge > JWT_MAX_AGE) {
        console.error('Token too old based on iat claim');
        return null;
      }
    }

    return decoded;
  } catch (error) {
    // Log errors but don't expose details
    if (process.env.NODE_ENV === 'development' && error instanceof Error) {
      const jwtError = error as VerifyErrors;
      if (jwtError.name === 'TokenExpiredError') {
        console.error('JWT token expired');
      } else if (jwtError.name === 'JsonWebTokenError') {
        console.error('Invalid JWT token');
      } else {
        console.error('JWT verification error');
      }
    }
    return null;
  }
}

/**
 * Verify token with detailed error information
 * Useful for providing specific error messages to clients
 */
export function verifyTokenDetailed(token: string): TokenVerificationResult {
  try {
    // Validate token format first
    if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
      return {
        valid: false,
        error: 'Authentication required'
      };
    }

    const decoded = jwt.verify(token, getJWTSecret(), {
      algorithms: [JWT_ALGORITHM],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      maxAge: `${JWT_MAX_AGE}s`,
      clockTolerance: 30
    }) as JWTPayload;

    // Additional validation
    if (!decoded.userId || !decoded.email || !decoded.role) {
      return {
        valid: false,
        error: 'Authentication failed'
      };
    }

    // Verify token age manually
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      return {
        valid: false,
        error: 'Session expired',
        expired: true
      };
    }

    if (decoded.iat) {
      const tokenAge = currentTime - decoded.iat;
      if (tokenAge > JWT_MAX_AGE) {
        return {
          valid: false,
          error: 'Session expired',
          expired: true
        };
      }
    }

    return {
      valid: true,
      payload: decoded
    };
  } catch (error) {
    if (error instanceof Error) {
      const jwtError = error as VerifyErrors;
      if (jwtError.name === 'TokenExpiredError') {
        return {
          valid: false,
          error: 'Session expired',
          expired: true
        };
      } else if (jwtError.name === 'JsonWebTokenError') {
        // Don't expose specific JWT errors to prevent information leakage
        return {
          valid: false,
          error: 'Authentication failed'
        };
      } else if (jwtError.message?.includes('jwt malformed')) {
        return {
          valid: false,
          error: 'Authentication failed'
        };
      }
    }
    return {
      valid: false,
      error: 'Authentication failed'
    };
  }
}

/**
 * Decode token without verification (for debugging only)
 * WARNING: Never use this for authentication decisions
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    if (!decoded) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Check if token is expired without full verification
 * Useful for client-side checks before making API calls
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    if (!decoded || !decoded.exp) {
      return true;
    }
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch {
    return true;
  }
}

/**
 * Generate a refresh token (for future implementation)
 * This is a placeholder for when refresh token mechanism is added
 */
export function generateRefreshToken(user: Partial<AdminUser>): string {
  if (!user.id || !user.email) {
    throw new Error('Invalid user data for refresh token generation');
  }

  const payload = {
    userId: user.id,
    email: user.email,
    type: 'refresh'
  };

  return jwt.sign(payload, getJWTSecret(), {
    algorithm: JWT_ALGORITHM,
    expiresIn: '7d', // Refresh tokens last longer
    issuer: JWT_ISSUER,
    audience: 'backroom-admin-refresh'
  });
}