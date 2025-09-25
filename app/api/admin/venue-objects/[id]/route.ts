import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PATCH /api/admin/venue-objects/[id] - Update a venue object
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if venue object exists
    const existingObject = await db.venueObject.findUnique({
      where: { id }
    });

    if (!existingObject) {
      return NextResponse.json(
        { error: 'Venue object not found' },
        { status: 404 }
      );
    }

    // Validate enum values if provided
    if (body.type) {
      const validTypes = ['BAR', 'DJ_BOOTH', 'PARTITION', 'DANCE_FLOOR', 'EXIT', 'STAIRCASE', 'TOILETS', 'CUSTOM'];
      if (!validTypes.includes(body.type)) {
        return NextResponse.json(
          { error: 'Invalid venue object type' },
          { status: 400 }
        );
      }
    }

    if (body.floor) {
      const validFloors = ['UPSTAIRS', 'DOWNSTAIRS'];
      if (!validFloors.includes(body.floor)) {
        return NextResponse.json(
          { error: 'Invalid floor value' },
          { status: 400 }
        );
      }
    }

    const venueObject = await db.venueObject.update({
      where: { id },
      data: {
        type: body.type,
        description: body.description,
        floor: body.floor,
        positionX: body.positionX,
        positionY: body.positionY,
        width: body.width,
        height: body.height,
        color: body.color,
        isTransparent: body.isTransparent
      }
    });

    return NextResponse.json(venueObject);
  } catch (error) {
    console.error('Error updating venue object:', error);
    return NextResponse.json(
      { error: 'Failed to update venue object' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/venue-objects/[id] - Delete a venue object
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if venue object exists
    const existingObject = await db.venueObject.findUnique({
      where: { id }
    });

    if (!existingObject) {
      return NextResponse.json(
        { error: 'Venue object not found' },
        { status: 404 }
      );
    }

    await db.venueObject.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting venue object:', error);
    return NextResponse.json(
      { error: 'Failed to delete venue object' },
      { status: 500 }
    );
  }
}