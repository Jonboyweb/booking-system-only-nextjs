import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getClearCookieOptions } from '@/lib/cookie-utils';

export async function POST() {
  const cookieStore = await cookies();

  // Use proper cookie clearing options to ensure removal across all browsers
  const clearOptions = getClearCookieOptions();

  // Try multiple approaches to ensure cookie is cleared
  // First, delete with the same options used when setting
  cookieStore.set('admin-token', '', clearOptions);

  // Also try direct deletion as fallback
  cookieStore.delete('admin-token');

  return NextResponse.json({ success: true });
}