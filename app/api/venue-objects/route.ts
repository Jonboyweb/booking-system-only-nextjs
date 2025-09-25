import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/venue-objects - Public endpoint to list venue objects (read-only)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const floor = searchParams.get('floor');

    const where = floor ? { floor: floor as 'UPSTAIRS' | 'DOWNSTAIRS' } : {};

    const venueObjects = await db.venueObject.findMany({
      where,
      select: {
        id: true,
        type: true,
        description: true,
        floor: true,
        positionX: true,
        positionY: true,
        width: true,
        height: true,
        color: true,
        isTransparent: true
      },
      orderBy: [
        { floor: 'asc' },
        { type: 'asc' }
      ]
    });

    return NextResponse.json(venueObjects);
  } catch (error) {
    console.error('Error fetching venue objects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch venue objects' },
      { status: 500 }
    );
  }
}