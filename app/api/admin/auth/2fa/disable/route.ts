import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@/lib/generated/prisma';
import { verifyToken } from '@/src/lib/auth/jwt';
import { verifyPassword } from '@/src/lib/auth/password';
import { cookies } from 'next/headers';
import { withCORS } from '@/lib/cors';
import speakeasy from 'speakeasy';

export async function POST(request: NextRequest) {
  try {
    // Get the JWT token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('admin-token');

    if (!token) {
      return withCORS(NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      ), request);
    }

    // Verify JWT token
    const decoded = verifyToken(token.value);
    if (!decoded) {
      return withCORS(NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      ), request);
    }

    // Get password or 2FA code from request
    const { password, code } = await request.json();

    if (!password) {
      return withCORS(NextResponse.json(
        { success: false, error: 'Password is required to disable 2FA' },
        { status: 400 }
      ), request);
    }

    // Get the admin user from database
    const adminUser = await db.adminUser.findUnique({
      where: { id: decoded.userId }
    });

    if (!adminUser) {
      return withCORS(NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      ), request);
    }

    // Check if 2FA is enabled
    if (!adminUser.twoFactorEnabled) {
      return withCORS(NextResponse.json(
        { success: false, error: '2FA is not enabled for this account' },
        { status: 400 }
      ), request);
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, adminUser.passwordHash);
    if (!isPasswordValid) {
      return withCORS(NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      ), request);
    }

    // If 2FA code is provided, verify it as well for extra security
    if (code && adminUser.twoFactorSecret) {
      const isCodeValid = speakeasy.totp.verify({
        secret: adminUser.twoFactorSecret,
        encoding: 'base32',
        token: code,
        window: 2
      });

      if (!isCodeValid) {
        return withCORS(NextResponse.json(
          { success: false, error: 'Invalid 2FA code' },
          { status: 401 }
        ), request);
      }
    }

    // Disable 2FA
    await db.adminUser.update({
      where: { id: decoded.userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: Prisma.DbNull,
        updatedAt: new Date()
      }
    });

    return withCORS(NextResponse.json({
      success: true,
      message: '2FA has been successfully disabled'
    }), request);

  } catch (error) {
    console.error('2FA disable error:', error);
    return withCORS(NextResponse.json(
      { success: false, error: 'Failed to disable 2FA' },
      { status: 500 }
    ), request);
  }
}