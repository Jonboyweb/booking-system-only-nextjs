import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword } from '@/src/lib/auth/password';
import { generateToken } from '@/src/lib/auth/jwt';
import { cookies } from 'next/headers';
import { checkRateLimit, applyRateLimitHeaders, RateLimitConfigs } from '@/lib/rate-limit';
import { withCORS } from '@/lib/cors';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for admin login to prevent brute force attacks
    const rateLimitResult = await checkRateLimit(request, 'admin-login', RateLimitConfigs.adminLogin);

    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Too many login attempts. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        },
        { status: 429 }
      );
      return applyRateLimitHeaders(withCORS(response, request), rateLimitResult);
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      const response = NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
      return applyRateLimitHeaders(withCORS(response, request), rateLimitResult);
    }

    // Find admin user
    const adminUser = await db.adminUser.findUnique({
      where: { email }
    });

    if (!adminUser || !adminUser.isActive) {
      const response = NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
      return applyRateLimitHeaders(withCORS(response, request), rateLimitResult);
    }

    // Verify password
    const isValid = await verifyPassword(password, adminUser.passwordHash);

    if (!isValid) {
      const response = NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
      return applyRateLimitHeaders(withCORS(response, request), rateLimitResult);
    }

    // Update last login
    await db.adminUser.update({
      where: { id: adminUser.id },
      data: { lastLogin: new Date() }
    });

    // Generate JWT token
    const token = generateToken(adminUser);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      }
    });

    // Apply rate limit headers and CORS
    return applyRateLimitHeaders(withCORS(response, request), rateLimitResult);
  } catch (error) {
    console.error('Login error:', error);
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return withCORS(response, request);
  }
}