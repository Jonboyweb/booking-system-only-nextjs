import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, hashPassword } from '@/src/lib/auth/password';
import { verifyToken } from '@/src/lib/auth/jwt';
import { cookies } from 'next/headers';
import { withCORS } from '@/lib/cors';

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

    // Get password data from request body
    const { currentPassword, newPassword } = await request.json();

    // Validate input
    if (!currentPassword || !newPassword) {
      return withCORS(NextResponse.json(
        { success: false, error: 'Current password and new password are required' },
        { status: 400 }
      ), request);
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return withCORS(NextResponse.json(
        { success: false, error: 'New password must be at least 8 characters long' },
        { status: 400 }
      ), request);
    }

    // Ensure new password is different from current
    if (currentPassword === newPassword) {
      return withCORS(NextResponse.json(
        { success: false, error: 'New password must be different from current password' },
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

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, adminUser.passwordHash);

    if (!isCurrentPasswordValid) {
      return withCORS(NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 401 }
      ), request);
    }

    // Hash the new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update the password in database
    await db.adminUser.update({
      where: { id: adminUser.id },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      }
    });

    return withCORS(NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    }), request);

  } catch (error) {
    console.error('Password change error:', error);
    return withCORS(NextResponse.json(
      { success: false, error: 'Failed to change password' },
      { status: 500 }
    ), request);
  }
}