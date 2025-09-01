import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { getAuthUser } from '@/middleware/auth';

const prisma = new PrismaClient();

export async function GET(
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
    
    const bookings = await prisma.booking.findMany({
      where: {
        customerId: id
      },
      orderBy: {
        bookingDate: 'desc'
      },
      include: {
        table: true,
        drinkPackage: true
      }
    });

    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      bookingReference: booking.bookingReference,
      tableName: `Table ${booking.table.tableNumber} - ${booking.table.floor}`,
      bookingDate: booking.bookingDate.toISOString(),
      bookingTime: booking.bookingTime,
      partySize: booking.partySize,
      status: booking.status,
      depositPaid: booking.depositPaid,
      packageName: booking.drinkPackage?.name || null
    }));

    return NextResponse.json(formattedBookings);
  } catch (error) {
    console.error('Error fetching customer bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer bookings' },
      { status: 500 }
    );
  }
}