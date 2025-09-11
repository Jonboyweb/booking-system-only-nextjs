import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { getAuthUser } from '@/src/middleware/auth';

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
    
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        table: true,
        drinkPackage: true,
        spirits: {
          include: {
            spirit: true
          }
        },
        champagnes: {
          include: {
            champagne: true
          }
        }
      }
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Format the response
    const formattedBooking = {
      ...booking,
      depositAmount: Number(booking.depositAmount),
      depositRefunded: booking.depositRefunded,
      refundDate: booking.refundDate,
      refundAmount: booking.refundAmount ? Number(booking.refundAmount) : null,
      spirits: booking.spirits.map(bs => ({
        id: bs.spirit.id,
        name: bs.spirit.name,
        brand: bs.spirit.brand,
        category: bs.spirit.category,
        quantity: bs.quantity,
        price: Number(bs.price)
      })),
      champagnes: booking.champagnes.map(bc => ({
        id: bc.champagne.id,
        name: bc.champagne.name,
        brand: bc.champagne.brand,
        quantity: bc.quantity,
        price: Number(bc.price)
      })),
      drinkPackage: booking.drinkPackage ? {
        ...booking.drinkPackage,
        price: Number(booking.drinkPackage.price)
      } : null
    };

    return NextResponse.json(formattedBooking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const body = await request.json();

    // Get current booking for comparison and validation
    const currentBooking = await prisma.booking.findUnique({
      where: { id },
      include: {
        table: true,
        customer: true
      }
    });

    if (!currentBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date()
    };

    // Handle status update
    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    // Handle internal notes update
    if (body.internalNotes !== undefined) {
      updateData.internalNotes = body.internalNotes;
    }

    // Handle comprehensive booking modifications
    if (body.bookingDate || body.bookingTime || body.partySize || body.tableId) {
      // Import validation functions
      const { checkTableAvailability, validatePartySize, validateBookingDate } = await import('@/src/lib/booking/availability');

      // Validate booking date if provided
      if (body.bookingDate) {
        if (!validateBookingDate(body.bookingDate)) {
          return NextResponse.json(
            { error: 'Booking date must be within 31 days from today' },
            { status: 400 }
          );
        }
        updateData.bookingDate = new Date(body.bookingDate);
      }

      // Update booking time if provided
      if (body.bookingTime) {
        updateData.bookingTime = body.bookingTime;
      }

      // Validate party size if provided
      if (body.partySize) {
        if (body.partySize < 2 || body.partySize > 12) {
          return NextResponse.json(
            { error: 'Party size must be between 2 and 12 guests' },
            { status: 400 }
          );
        }
        updateData.partySize = body.partySize;
      }

      // Handle table change with availability validation
      if (body.tableId && body.tableId !== currentBooking.tableId) {
        // Check if new table is available
        const dateToCheck = body.bookingDate || currentBooking.bookingDate.toISOString();
        const timeToCheck = body.bookingTime || currentBooking.bookingTime;
        const partySizeToCheck = body.partySize || currentBooking.partySize;

        // Validate table availability
        const isAvailable = await checkTableAvailability(
          body.tableId,
          dateToCheck,
          timeToCheck,
          id // Exclude current booking from check
        );

        if (!isAvailable) {
          return NextResponse.json(
            { error: 'The selected table is not available for the specified date and time' },
            { status: 400 }
          );
        }

        // Validate party size for the new table
        const capacityValid = await validatePartySize(body.tableId, partySizeToCheck);
        if (!capacityValid) {
          const newTable = await prisma.table.findUnique({
            where: { id: body.tableId }
          });
          return NextResponse.json(
            { error: `The selected table can only accommodate ${newTable?.capacityMin}-${newTable?.capacityMax} guests` },
            { status: 400 }
          );
        }

        updateData.tableId = body.tableId;
      }

      // If only party size changed, validate against current table
      if (body.partySize && !body.tableId) {
        const capacityValid = await validatePartySize(currentBooking.tableId, body.partySize);
        if (!capacityValid) {
          return NextResponse.json(
            { error: `The current table can only accommodate ${currentBooking.table.capacityMin}-${currentBooking.table.capacityMax} guests` },
            { status: 400 }
          );
        }
      }
    }

    // Store modification history (if schema is updated)
    // This would be implemented after adding the BookingModification model
    const previousData = {
      bookingDate: currentBooking.bookingDate,
      bookingTime: currentBooking.bookingTime,
      partySize: currentBooking.partySize,
      tableId: currentBooking.tableId,
      status: currentBooking.status
    };

    // Update the booking
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        table: true,
        drinkPackage: true,
        spirits: {
          include: {
            spirit: true
          }
        },
        champagnes: {
          include: {
            champagne: true
          }
        }
      }
    });

    // Send modification email if requested
    if (body.sendEmail && (body.bookingDate || body.bookingTime || body.partySize || body.tableId)) {
      // Trigger email send (async, don't wait)
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/bookings/${id}/send-modification-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || ''
        },
        body: JSON.stringify({
          originalBooking: {
            date: previousData.bookingDate.toISOString(),
            time: previousData.bookingTime,
            party_size: previousData.partySize,
            table_name: `Table ${currentBooking.table.tableNumber} - ${currentBooking.table.floor}`
          },
          updatedBooking: {
            date: updatedBooking.bookingDate.toISOString(),
            time: updatedBooking.bookingTime,
            party_size: updatedBooking.partySize,
            table_name: `Table ${updatedBooking.table.tableNumber} - ${updatedBooking.table.floor}`
          },
          modificationReason: body.modificationReason
        })
      }).catch(err => console.error('Failed to send modification email:', err));
    }

    // Format the response
    const formattedBooking = {
      ...updatedBooking,
      depositAmount: Number(updatedBooking.depositAmount),
      depositRefunded: updatedBooking.depositRefunded,
      refundDate: updatedBooking.refundDate,
      refundAmount: updatedBooking.refundAmount ? Number(updatedBooking.refundAmount) : null,
      spirits: updatedBooking.spirits.map(bs => ({
        id: bs.spirit.id,
        name: bs.spirit.name,
        brand: bs.spirit.brand,
        category: bs.spirit.category,
        quantity: bs.quantity,
        price: Number(bs.price)
      })),
      champagnes: updatedBooking.champagnes.map(bc => ({
        id: bc.champagne.id,
        name: bc.champagne.name,
        brand: bc.champagne.brand,
        quantity: bc.quantity,
        price: Number(bc.price)
      })),
      drinkPackage: updatedBooking.drinkPackage ? {
        ...updatedBooking.drinkPackage,
        price: Number(updatedBooking.drinkPackage.price)
      } : null
    };

    return NextResponse.json(formattedBooking);
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}