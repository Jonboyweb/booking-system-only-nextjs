import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateToken } from '@/src/lib/auth/jwt';
import { cookies } from 'next/headers';
import { withCORS } from '@/lib/cors';
import speakeasy from 'speakeasy';

export async function POST(request: NextRequest) {
  try {
    const { email, code, isBackupCode } = await request.json();

    if (!email || !code) {
      return withCORS(NextResponse.json(
        { success: false, error: 'Email and verification code are required' },
        { status: 400 }
      ), request);
    }

    // Find the admin user
    const adminUser = await db.adminUser.findUnique({
      where: { email }
    });

    if (!adminUser || !adminUser.isActive) {
      return withCORS(NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      ), request);
    }

    // Check if 2FA is enabled
    if (!adminUser.twoFactorEnabled || !adminUser.twoFactorSecret) {
      return withCORS(NextResponse.json(
        { success: false, error: '2FA is not enabled for this account' },
        { status: 400 }
      ), request);
    }

    let isValid = false;

    if (isBackupCode) {
      // Verify backup code
      const backupCodes = adminUser.twoFactorBackupCodes as string[] || [];
      const hashedCode = Buffer.from(code).toString('base64');
      const codeIndex = backupCodes.indexOf(hashedCode);

      if (codeIndex !== -1) {
        isValid = true;
        // Remove used backup code
        const updatedCodes = backupCodes.filter((_, index) => index !== codeIndex);
        await db.adminUser.update({
          where: { id: adminUser.id },
          data: {
            twoFactorBackupCodes: updatedCodes
          }
        });
      }
    } else {
      // Verify TOTP code
      isValid = speakeasy.totp.verify({
        secret: adminUser.twoFactorSecret,
        encoding: 'base32',
        token: code,
        window: 2 // Allow some time drift
      });
    }

    if (!isValid) {
      return withCORS(NextResponse.json(
        { success: false, error: 'Invalid verification code' },
        { status: 401 }
      ), request);
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

    return withCORS(NextResponse.json({
      success: true,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      }
    }), request);

  } catch (error) {
    console.error('2FA verification error:', error);
    return withCORS(NextResponse.json(
      { success: false, error: 'Failed to verify 2FA code' },
      { status: 500 }
    ), request);
  }
}