import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/src/middleware/auth';

// DELETE /api/admin/table-blocks/[id] - Delete a table block
export async function DELETE(
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

    // Check if table block exists
    const tableBlock = await db.tableBlock.findUnique({
      where: { id }
    });

    if (!tableBlock) {
      return NextResponse.json(
        { success: false, error: 'Table block not found' },
        { status: 404 }
      );
    }

    // Delete the table block
    await db.tableBlock.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Table block deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting table block:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete table block' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/table-blocks/[id] - Update a table block
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
    const { startDate, endDate, reason } = body;

    // Check if table block exists
    const tableBlock = await db.tableBlock.findUnique({
      where: { id }
    });

    if (!tableBlock) {
      return NextResponse.json(
        { success: false, error: 'Table block not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (startDate !== undefined) {
      updateData.startDate = new Date(startDate);
    }

    if (endDate !== undefined) {
      updateData.endDate = new Date(endDate);
    }

    if (reason !== undefined) {
      updateData.reason = reason || null;
    }

    // Validate dates if both are provided
    if (updateData.startDate && updateData.endDate) {
      if (updateData.startDate > updateData.endDate) {
        return NextResponse.json(
          { success: false, error: 'Start date must be before end date' },
          { status: 400 }
        );
      }
    }

    // Check for existing bookings in the new date range
    const start = updateData.startDate || tableBlock.startDate;
    const end = updateData.endDate || tableBlock.endDate;

    const existingBookings = await db.booking.findMany({
      where: {
        tableId: tableBlock.tableId,
        bookingDate: {
          gte: start,
          lte: end
        },
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      }
    });

    if (existingBookings.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot update block dates. There are ${existingBookings.length} existing bookings in the selected date range.`,
          bookings: existingBookings.map(b => ({
            reference: b.bookingReference,
            date: b.bookingDate,
            time: b.bookingTime
          }))
        },
        { status: 400 }
      );
    }

    // Update the table block
    const updatedBlock = await db.tableBlock.update({
      where: { id },
      data: updateData,
      include: {
        table: true
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedBlock
    });
  } catch (error) {
    console.error('Error updating table block:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update table block' },
      { status: 500 }
    );
  }
}