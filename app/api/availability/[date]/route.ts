import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isDateWithinBookingWindow } from '@/lib/booking-validation';

export async function GET(
  request: Request,
  { params }: { params: { date: string } }
) {
  try {
    const date = new Date(params.date);
    
    // Validate date is within booking window
    if (!isDateWithinBookingWindow(date)) {
      return NextResponse.json(
        { error: 'Date is outside booking window (31 days)' },
        { status: 400 }
      );
    }
    
    // Get all tables
    const tables = await prisma.table.findMany({
      orderBy: [
        { floor: 'asc' },
        { tableNumber: 'asc' }
      ]
    });
    
    // Get all bookings for the date
    const bookings = await prisma.booking.findMany({
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
    
    // Create availability map by time slot
    const timeSlots = [
      '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
      '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'
    ];
    
    const availability = timeSlots.map(time => {
      const bookedTableIds = bookings
        .filter(b => {
          const bookingHour = parseInt(b.bookingTime.split(':')[0]);
          const slotHour = parseInt(time.split(':')[0]);
          // Consider 2-hour booking duration
          return Math.abs(bookingHour - slotHour) < 2;
        })
        .map(b => b.tableId);
      
      const availableTables = tables.filter(
        table => !bookedTableIds.includes(table.id)
      );
      
      // Check combinable tables (15 & 16)
      const table15Available = availableTables.some(t => t.tableNumber === 15);
      const table16Available = availableTables.some(t => t.tableNumber === 16);
      const canCombine = table15Available && table16Available;
      
      return {
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
        bookedTableNumbers: bookedTableIds.map(id => 
          tables.find(t => t.id === id)?.tableNumber
        ).filter(Boolean),
        canCombineTables: canCombine
      };
    });
    
    return NextResponse.json({
      date: params.date,
      totalTables: tables.length,
      timeSlots: availability,
      summary: {
        mostAvailable: availability.reduce((prev, curr) => 
          curr.availableCount > prev.availableCount ? curr : prev
        ),
        leastAvailable: availability.reduce((prev, curr) => 
          curr.availableCount < prev.availableCount ? curr : prev
        )
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