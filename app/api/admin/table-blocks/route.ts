import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/src/middleware/auth';

// GET /api/admin/table-blocks - List all table blocks
export async function GET(request: NextRequest) {
  // Check authentication
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const tableId = searchParams.get('tableId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Build where clause
    const where: any = {};

    if (tableId) {
      where.tableId = tableId;
    }

    if (from) {
      where.startDate = { gte: new Date(from) };
    }

    if (to) {
      where.endDate = { lte: new Date(to) };
    }

    const tableBlocks = await db.tableBlock.findMany({
      where,
      include: {
        table: true
      },
      orderBy: [
        { startDate: 'asc' },
        { table: { tableNumber: 'asc' } }
      ]
    });

    return NextResponse.json({
      success: true,
      data: tableBlocks
    });
  } catch (error) {
    console.error('Error fetching table blocks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch table blocks' },
      { status: 500 }
    );
  }
}

// POST /api/admin/table-blocks - Create a new table block
export async function POST(request: NextRequest) {
  // Check authentication
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { tableId, startDate, endDate, reason } = body;

    // Validate required fields
    if (!tableId || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return NextResponse.json(
        { success: false, error: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    // Check if table exists
    const table = await db.table.findUnique({
      where: { id: tableId }
    });

    if (!table) {
      return NextResponse.json(
        { success: false, error: 'Table not found' },
        { status: 404 }
      );
    }

    // Check for existing bookings in the date range
    const existingBookings = await db.booking.findMany({
      where: {
        tableId,
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
          error: `Cannot block table. There are ${existingBookings.length} existing bookings in the selected date range.`,
          bookings: existingBookings.map(b => ({
            reference: b.bookingReference,
            date: b.bookingDate,
            time: b.bookingTime
          }))
        },
        { status: 400 }
      );
    }

    // Create the table block
    const tableBlock = await db.tableBlock.create({
      data: {
        tableId,
        startDate: start,
        endDate: end,
        reason: reason || null,
        blockedBy: user.email
      },
      include: {
        table: true
      }
    });

    return NextResponse.json({
      success: true,
      data: tableBlock
    });
  } catch (error) {
    console.error('Error creating table block:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create table block' },
      { status: 500 }
    );
  }
}