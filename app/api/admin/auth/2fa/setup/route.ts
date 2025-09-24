import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/src/lib/auth/jwt';
import { cookies } from 'next/headers';
import { withCORS } from '@/lib/cors';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric codes
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}

export async function GET(request: NextRequest) {
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

    // Check if 2FA is already enabled
    if (adminUser.twoFactorEnabled) {
      return withCORS(NextResponse.json(
        { success: false, error: '2FA is already enabled for this account' },
        { status: 400 }
      ), request);
    }

    // Generate a new secret
    const secret = speakeasy.generateSecret({
      name: `The Backroom Leeds (${adminUser.email})`,
      issuer: 'The Backroom Leeds'
    });

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    // Generate backup codes
    const backupCodes = generateBackupCodes();

    // Store the secret temporarily in the session (we'll save it when verified)
    // For now, we'll return it to the client to store temporarily
    return withCORS(NextResponse.json({
      success: true,
      data: {
        secret: secret.base32,
        qrCode: qrCodeDataUrl,
        backupCodes: backupCodes,
        manualEntryKey: secret.base32
      }
    }), request);

  } catch (error) {
    console.error('2FA setup error:', error);
    return withCORS(NextResponse.json(
      { success: false, error: 'Failed to setup 2FA' },
      { status: 500 }
    ), request);
  }
}

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

    // Get the verification code and secret from request
    const { code, secret, backupCodes } = await request.json();

    if (!code || !secret || !backupCodes) {
      return withCORS(NextResponse.json(
        { success: false, error: 'Verification code, secret, and backup codes are required' },
        { status: 400 }
      ), request);
    }

    // Verify the code
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: code,
      window: 2 // Allow some time drift
    });

    if (!verified) {
      return withCORS(NextResponse.json(
        { success: false, error: 'Invalid verification code' },
        { status: 400 }
      ), request);
    }

    // Hash backup codes for storage
    const hashedBackupCodes = backupCodes.map((code: string) => {
      // Simple hash for backup codes (in production, consider using bcrypt)
      return Buffer.from(code).toString('base64');
    });

    // Update the user with 2FA enabled
    await db.adminUser.update({
      where: { id: decoded.userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        twoFactorBackupCodes: hashedBackupCodes,
        updatedAt: new Date()
      }
    });

    return withCORS(NextResponse.json({
      success: true,
      message: '2FA has been successfully enabled'
    }), request);

  } catch (error) {
    console.error('2FA verification error:', error);
    return withCORS(NextResponse.json(
      { success: false, error: 'Failed to enable 2FA' },
      { status: 500 }
    ), request);
  }
}