import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { getAuthUser } from '@/middleware/auth';

const prisma = new PrismaClient();

function generateBookingReference(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let reference = 'BR-';
  for (let i = 0; i < 6; i++) {
    reference += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return reference;
}

export async function POST(request: NextRequest) {
  // Check authentication
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const {
      customerId,
      tableId,
      bookingDate,
      bookingTime,
      partySize,
      drinkPackageId,
      specialRequests,
      internalNotes,
      depositPaid,
      status
    } = await request.json();

    // Check for existing booking conflicts
    const existingBooking = await prisma.booking.findFirst({
      where: {
        tableId,
        bookingDate: new Date(bookingDate),
        bookingTime,
        status: {
          notIn: ['CANCELLED', 'NO_SHOW']
        }
      }
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: 'This table is already booked for the selected date and time' },
        { status: 400 }
      );
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        bookingReference: generateBookingReference(),
        customerId,
        tableId,
        bookingDate: new Date(bookingDate),
        bookingTime,
        partySize,
        drinkPackageId: drinkPackageId || null,
        specialRequests,
        internalNotes,
        depositPaid,
        status: status || 'PENDING',
        depositAmount: 50,
        paymentDate: depositPaid ? new Date() : null
      },
      include: {
        customer: true,
        table: true,
        drinkPackage: true
      }
    });

    // Send confirmation email if deposit is paid
    if (depositPaid && status === 'CONFIRMED') {
      // We could trigger email here if needed
      console.log('Manual booking created with deposit - email would be sent');
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}