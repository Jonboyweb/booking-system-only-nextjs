import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { getAuthUser } from '@/src/middleware/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  // Check authentication
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const date = searchParams.get('date');

    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      where.bookingDate = {
        gte: startDate,
        lt: endDate
      };
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: {
        bookingDate: 'desc'
      },
      include: {
        customer: true,
        table: true,
        drinkPackage: true
      }
    });

    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      bookingReference: booking.bookingReference,
      customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
      customerEmail: booking.customer.email,
      customerPhone: booking.customer.phone,
      tableName: `Table ${booking.table.tableNumber} - ${booking.table.floor}`,
      bookingDate: booking.bookingDate.toISOString(),
      bookingTime: booking.bookingTime,
      partySize: booking.partySize,
      status: booking.status,
      depositPaid: booking.depositPaid,
      depositAmount: Number(booking.depositAmount),
      specialRequests: booking.specialRequests,
      createdAt: booking.createdAt.toISOString()
    }));

    return NextResponse.json(formattedBookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}