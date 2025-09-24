import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isDateWithinBookingWindow } from '@/lib/booking-validation';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date: dateParam } = await params;
    const date = new Date(dateParam);

    // Validate date is within booking window
    if (!isDateWithinBookingWindow(date)) {
      return NextResponse.json(
        { error: 'Date is outside booking window (31 days)' },
        { status: 400 }
      );
    }

    // Get all tables
    const tables = await db.table.findMany({
      orderBy: [
        { floor: 'asc' },
        { tableNumber: 'asc' }
      ]
    });

    // Get all bookings for the date (regardless of time)
    // When a table is booked for ANY time, it's reserved for the ENTIRE evening
    const bookings = await db.booking.findMany({
      where: {
        bookingDate: date,
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      },
      include: {
        table: true
      }
    });

    // Get list of booked table IDs (these tables are unavailable for the entire evening)
    const bookedTableIds = bookings.map(b => b.tableId);
    const bookedTableNumbers = bookings.map(b => b.table.tableNumber);

    // Available tables are those not booked at all for this date
    const availableTables = tables.filter(
      table => !bookedTableIds.includes(table.id)
    );

    // Check combinable tables (15 & 16)
    const table15Available = availableTables.some(t => t.tableNumber === 15);
    const table16Available = availableTables.some(t => t.tableNumber === 16);
    const canCombine = table15Available && table16Available;

    // Create time slots for display purposes
    const timeSlots = [
      '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
      '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'
    ];

    // Since tables are booked for entire evening, availability is the same for all time slots
    const availability = timeSlots.map(time => ({
      time,
      availableCount: availableTables.length,
      availableTables: availableTables.map(t => ({
        id: t.id,
        tableNumber: t.tableNumber,
        floor: t.floor,
        capacityMin: t.capacityMin,
        capacityMax: t.capacityMax,
        isVip: t.isVip,
        canCombineWith: t.canCombineWith
      })),
      bookedTableNumbers: bookedTableNumbers,
      canCombineTables: canCombine
    }));

    return NextResponse.json({
      date: dateParam,
      totalTables: tables.length,
      totalBooked: bookedTableIds.length,
      totalAvailable: availableTables.length,
      timeSlots: availability,
      summary: {
        availableTables: availableTables.length,
        bookedTables: bookedTableIds.length,
        message: `Tables are reserved for the entire evening when booked. ${availableTables.length} tables available for ${dateParam}.`
      }
    });
  } catch (error) {
    console.error('Availability check failed:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}