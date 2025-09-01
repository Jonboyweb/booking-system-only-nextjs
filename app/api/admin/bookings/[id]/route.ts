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

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: body.status,
        internalNotes: body.internalNotes,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(updatedBooking);
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