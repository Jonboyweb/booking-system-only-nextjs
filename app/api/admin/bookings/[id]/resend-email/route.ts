import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { getAuthUser } from '@/src/middleware/auth';
import { sendBookingConfirmationEmail } from '@/src/lib/email/sendgrid';

const prisma = new PrismaClient();

export async function POST(
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
    
    // Fetch booking with all necessary relations
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

    // Format booking for email
    const tableName = `Table ${booking.table.tableNumber} - ${booking.table.floor.charAt(0).toUpperCase() + booking.table.floor.slice(1).toLowerCase()}`;
    
    const formattedSpirits = booking.spirits.length > 0
      ? booking.spirits.map(bs => `${bs.quantity}x ${bs.spirit.brand} ${bs.spirit.name}`).join('\n')
      : null;
      
    const formattedChampagnes = booking.champagnes.length > 0
      ? booking.champagnes.map(bc => `${bc.quantity}x ${bc.champagne.brand} ${bc.champagne.name}`).join('\n')
      : null;

    const emailData = {
      id: booking.id,
      bookingReference: booking.bookingReference,
      reference_number: booking.bookingReference,
      tableId: booking.tableId,
      table_name: tableName,
      customerId: booking.customerId,
      name: `${booking.customer.firstName} ${booking.customer.lastName}`,
      email: booking.customer.email,
      phone: booking.customer.phone,
      bookingDate: booking.bookingDate,
      date: booking.bookingDate.toISOString(),
      bookingTime: booking.bookingTime,
      time: booking.bookingTime,
      partySize: booking.partySize,
      party_size: booking.partySize,
      status: booking.status as 'PENDING' | 'CONFIRMED' | 'CANCELLED',
      depositAmount: Number(booking.depositAmount),
      depositPaid: booking.depositPaid,
      stripe_payment_intent_id: booking.stripeIntentId,
      drinkPackageId: booking.drinkPackageId,
      drinks_package: booking.drinkPackage?.name,
      specialRequests: booking.specialRequests,
      custom_spirits: formattedSpirits,
      custom_champagnes: formattedChampagnes,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    };

    // Send email
    const emailSent = await sendBookingConfirmationEmail(emailData);

    if (emailSent) {
      return NextResponse.json({ success: true, message: 'Email resent successfully' });
    } else {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error resending email:', error);
    return NextResponse.json(
      { error: 'Failed to resend email' },
      { status: 500 }
    );
  }
}