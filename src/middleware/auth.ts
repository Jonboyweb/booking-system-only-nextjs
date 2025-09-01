import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';

export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('admin-token')?.value;
  
  if (!token) {
    return false;
  }
  
  const payload = verifyToken(token);
  return payload !== null;
}

export async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get('admin-token')?.value;
  
  if (!token) {
    return null;
  }
  
  return verifyToken(token);
}

export function requireAuth(allowedRoles: string[] = []) {
  return async function middleware(request: NextRequest) {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    return null; // Continue to the route handler
  };
}