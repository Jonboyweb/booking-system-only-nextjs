import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/src/middleware/auth';
import { 
  checkTableAvailability, 
  validatePartySize,
  getAvailableTablesForDateTime,
  getBookingConflicts,
  validateBookingDate
} from '@/src/lib/booking/availability';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check authentication
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: bookingId } = await params;
    const body = await request.json();
    const { date, time, tableId, partySize } = body;

    // Validate required fields
    if (!date || !time || !tableId || !partySize) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate booking date (within 31 days)
    if (!validateBookingDate(date)) {
      return NextResponse.json({
        available: false,
        error: 'Bookings can only be made up to 31 days in advance',
        capacityValid: false
      });
    }

    // Check table availability
    const isAvailable = await checkTableAvailability(
      tableId,
      date,
      time,
      bookingId
    );

    // Validate party size for the table
    const capacityValid = await validatePartySize(tableId, partySize);

    // Get conflicts if table is not available
    let conflicts: Awaited<ReturnType<typeof getBookingConflicts>> = [];
    if (!isAvailable) {
      conflicts = await getBookingConflicts(tableId, date, time, bookingId);
    }

    // Get alternative tables if requested table is not available
    let alternativeTables: Array<{id: string; tableNumber: number; floor: string; capacityMin: number; capacityMax: number; isVip: boolean; description: string; features: string[];}> = [];
    if (!isAvailable || !capacityValid) {
      alternativeTables = await getAvailableTablesForDateTime(
        date,
        time,
        partySize,
        bookingId
      );
    }

    return NextResponse.json({
      available: isAvailable && capacityValid,
      capacityValid,
      tableAvailable: isAvailable,
      conflicts: conflicts,
      alternativeTables: alternativeTables.map(t => ({
        id: t.id,
        tableNumber: t.tableNumber,
        floor: t.floor,
        capacityMin: t.capacityMin,
        capacityMax: t.capacityMax,
        description: t.description,
        isVip: t.isVip,
        features: t.features
      })),
      message: !isAvailable 
        ? 'This table is already booked for the selected date and time' 
        : !capacityValid 
          ? `This table can only accommodate ${alternativeTables[0]?.capacityMin || 2}-${alternativeTables[0]?.capacityMax || 6} guests`
          : 'Table is available'
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}