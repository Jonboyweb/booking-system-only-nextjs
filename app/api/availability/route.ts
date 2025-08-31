import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const time = searchParams.get('time');
    
    if (!date || !time) {
      return NextResponse.json(
        { error: 'Date and time are required' },
        { status: 400 }
      );
    }
    
    // Find all bookings for the given date and time
    const bookings = await prisma.booking.findMany({
      where: {
        bookingDate: new Date(date),
        bookingTime: time,
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      },
      include: {
        table: true
      }
    });
    
    // Extract booked table numbers
    const bookedTables = bookings.map(booking => booking.table.tableNumber);
    
    return NextResponse.json({
      bookedTables,
      availableCount: 16 - bookedTables.length
    });
  } catch (error) {
    console.error('Availability check failed:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}