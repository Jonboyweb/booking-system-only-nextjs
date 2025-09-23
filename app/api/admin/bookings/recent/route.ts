import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/src/middleware/auth';


export async function GET(request: NextRequest) {
  // Check authentication
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const bookings = await db.booking.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        customer: true,
        table: true
      }
    });

    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      bookingReference: booking.bookingReference,
      customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
      tableName: `Table ${booking.table.tableNumber} - ${booking.table.floor}`,
      bookingDate: booking.bookingDate.toISOString(),
      bookingTime: booking.bookingTime,
      partySize: booking.partySize,
      status: booking.status,
      depositPaid: booking.depositPaid
    }));

    return NextResponse.json(formattedBookings);
  } catch (error) {
    console.error('Error fetching recent bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}