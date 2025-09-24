import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/src/lib/auth/jwt';
import { cookies } from 'next/headers';
import { withCORS } from '@/lib/cors';

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
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        twoFactorEnabled: true,
        twoFactorBackupCodes: true
      }
    });

    if (!adminUser) {
      return withCORS(NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      ), request);
    }

    // Count remaining backup codes
    const backupCodes = adminUser.twoFactorBackupCodes as string[] || [];
    const remainingBackupCodes = backupCodes.length;

    return withCORS(NextResponse.json({
      success: true,
      data: {
        twoFactorEnabled: adminUser.twoFactorEnabled,
        remainingBackupCodes: adminUser.twoFactorEnabled ? remainingBackupCodes : 0,
        email: adminUser.email,
        name: adminUser.name
      }
    }), request);

  } catch (error) {
    console.error('2FA status error:', error);
    return withCORS(NextResponse.json(
      { success: false, error: 'Failed to get 2FA status' },
      { status: 500 }
    ), request);
  }
}