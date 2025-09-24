import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateTimeSlots, getOperatingHours } from '@/lib/operating-hours';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const time = searchParams.get('time');

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
    }

    const bookingDate = new Date(date);

    // Get operating hours and time slots for this date
    const operatingHours = getOperatingHours(bookingDate);
    const timeSlots = generateTimeSlots(bookingDate);

    // Get all active tables
    const activeTables = await db.table.findMany({
      where: {
        isActive: true
      }
    });

    // Get all blocked tables for this date
    const tableBlocks = await db.tableBlock.findMany({
      where: {
        startDate: {
          lte: bookingDate
        },
        endDate: {
          gte: bookingDate
        }
      },
      include: {
        table: true
      }
    });

    const blockedTableNumbers = tableBlocks.map(tb => tb.table.tableNumber);

    // If specific time is provided, check availability for that time
    if (time) {
      // Find all bookings for the entire night (any time slot)
      const allBookingsForDate = await db.booking.findMany({
        where: {
          bookingDate: bookingDate,
          status: {
            in: ['PENDING', 'CONFIRMED']
          }
        },
        include: {
          table: true
        }
      });

      // A table is considered booked for the entire night if it has ANY booking
      const bookedTables = [...new Set(allBookingsForDate.map(booking => booking.table.tableNumber))];

      // Combine booked and blocked tables
      const unavailableTables = [...new Set([...bookedTables, ...blockedTableNumbers])];

      // Filter out inactive tables from the unavailable list
      const activeTableNumbers = activeTables.map(t => t.tableNumber);
      const finalUnavailableTables = unavailableTables.filter(tn => activeTableNumbers.includes(tn));

      return NextResponse.json({
        bookedTables: finalUnavailableTables, // Include both booked and blocked tables
        blockedTables: blockedTableNumbers,
        availableCount: activeTables.length - finalUnavailableTables.length,
        operatingHours,
        timeSlots
      });
    }

    // If no specific time, return all bookings for the date
    const allBookingsForDate = await db.booking.findMany({
      where: {
        bookingDate: bookingDate,
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      },
      include: {
        table: true
      }
    });

    // Group bookings by time slot
    const bookingsByTime: Record<string, number[]> = {};
    const allBookedTables = new Set<number>();

    allBookingsForDate.forEach(booking => {
      allBookedTables.add(booking.table.tableNumber);
    });

    // Add blocked tables to the unavailable list
    blockedTableNumbers.forEach(tableNumber => {
      allBookedTables.add(tableNumber);
    });

    // For each time slot, if a table is booked at ANY time, it's unavailable for ALL times
    timeSlots.forEach(slot => {
      bookingsByTime[slot] = Array.from(allBookedTables);
    });

    return NextResponse.json({
      bookingsByTime,
      allBookedTables: Array.from(allBookedTables),
      blockedTables: blockedTableNumbers,
      operatingHours,
      timeSlots,
      totalTables: activeTables.length
    });
  } catch (error) {
    console.error('Availability check failed:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}