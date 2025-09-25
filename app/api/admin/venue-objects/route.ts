import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/venue-objects - List all venue objects
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const floor = searchParams.get('floor');

    const where = floor ? { floor: floor as 'UPSTAIRS' | 'DOWNSTAIRS' } : {};

    const venueObjects = await db.venueObject.findMany({
      where,
      orderBy: [
        { floor: 'asc' },
        { type: 'asc' },
        { description: 'asc' }
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

// POST /api/admin/venue-objects - Create a new venue object
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.type || !body.description || !body.floor) {
      return NextResponse.json(
        { error: 'Type, description, and floor are required' },
        { status: 400 }
      );
    }

    // Validate enum values
    const validTypes = ['BAR', 'DJ_BOOTH', 'PARTITION', 'DANCE_FLOOR', 'EXIT', 'STAIRCASE', 'TOILETS', 'CUSTOM'];
    const validFloors = ['UPSTAIRS', 'DOWNSTAIRS'];

    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid venue object type' },
        { status: 400 }
      );
    }

    if (!validFloors.includes(body.floor)) {
      return NextResponse.json(
        { error: 'Invalid floor value' },
        { status: 400 }
      );
    }

    const venueObject = await db.venueObject.create({
      data: {
        type: body.type,
        description: body.description,
        floor: body.floor,
        positionX: body.positionX ?? 300,
        positionY: body.positionY ?? 200,
        width: body.width ?? 100,
        height: body.height ?? 80,
        color: body.color,
        isTransparent: body.isTransparent ?? false
      }
    });

    return NextResponse.json(venueObject, { status: 201 });
  } catch (error) {
    console.error('Error creating venue object:', error);
    return NextResponse.json(
      { error: 'Failed to create venue object' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/venue-objects - Bulk update all venue objects (for save all functionality)
export async function PUT(request: NextRequest) {
  try {
    const { venueObjects } = await request.json();

    if (!Array.isArray(venueObjects)) {
      return NextResponse.json(
        { error: 'venueObjects must be an array' },
        { status: 400 }
      );
    }

    // Update each venue object
    const updates = await Promise.all(
      venueObjects.map(obj =>
        db.venueObject.update({
          where: { id: obj.id },
          data: {
            type: obj.type,
            description: obj.description,
            floor: obj.floor,
            positionX: obj.positionX,
            positionY: obj.positionY,
            width: obj.width,
            height: obj.height,
            color: obj.color,
            isTransparent: obj.isTransparent ?? false
          }
        })
      )
    );

    return NextResponse.json({
      success: true,
      data: updates
    });
  } catch (error) {
    console.error('Error bulk updating venue objects:', error);
    return NextResponse.json(
      { error: 'Failed to update venue objects' },
      { status: 500 }
    );
  }
}