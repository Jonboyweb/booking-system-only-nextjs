import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/src/middleware/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check authentication
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    // Build update data object dynamically
    const updateData: any = {
      updatedAt: new Date()
    };

    // Only update provided fields
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.capacityMin !== undefined) updateData.capacityMin = body.capacityMin;
    if (body.capacityMax !== undefined) updateData.capacityMax = body.capacityMax;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.features !== undefined) updateData.features = body.features;
    if (body.isVip !== undefined) updateData.isVip = body.isVip;
    if (body.canCombineWith !== undefined) updateData.canCombineWith = body.canCombineWith;
    if (body.positionX !== undefined) updateData.positionX = body.positionX;
    if (body.positionY !== undefined) updateData.positionY = body.positionY;
    if (body.width !== undefined) updateData.width = body.width;
    if (body.height !== undefined) updateData.height = body.height;

    const updatedTable = await db.table.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updatedTable);
  } catch (error) {
    console.error('Error updating table:', error);
    return NextResponse.json(
      { error: 'Failed to update table' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check authentication
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only admins can delete tables
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;

    // Check if table has any bookings
    const bookingCount = await db.booking.count({
      where: { tableId: id }
    });

    if (bookingCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete table with existing bookings' },
        { status: 400 }
      );
    }

    await db.table.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting table:', error);
    return NextResponse.json(
      { error: 'Failed to delete table' },
      { status: 500 }
    );
  }
}