import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withCORS } from '@/lib/cors';

export async function GET(request: NextRequest) {
  try {
    const spirits = await db.spirit.findMany({
      where: {
        isActive: true
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    // Map isActive to isAvailable for frontend compatibility
    const mappedSpirits = spirits.map(spirit => ({
      ...spirit,
      isAvailable: spirit.isActive
    }));

    const response = NextResponse.json(mappedSpirits);
    return withCORS(response, request);
  } catch (error) {
    console.error('Failed to fetch spirits:', error);
    const response = NextResponse.json(
      { error: 'Failed to fetch spirits' },
      { status: 500 }
    );
    return withCORS(response, request);
  }
}