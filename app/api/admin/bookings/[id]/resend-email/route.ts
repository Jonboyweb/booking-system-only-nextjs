import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/src/middleware/auth';
import { sendBookingConfirmationEmail } from '@/src/lib/email/sendgrid';


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
    const booking = await db.booking.findUnique({
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

    // Add additional fields for email template compatibility
    const bookingWithEmail = {
      ...booking,
      email: booking.customer.email,
      name: `${booking.customer.firstName} ${booking.customer.lastName}`,
      phone: booking.customer.phone,
      reference_number: booking.bookingReference,
      table_name: `Table ${booking.table.tableNumber} - ${booking.table.floor.charAt(0).toUpperCase() + booking.table.floor.slice(1).toLowerCase()}`,
      date: booking.bookingDate.toISOString(),
      time: booking.bookingTime,
      booking_time: booking.bookingTime,  // Add this field for email template
      party_size: booking.partySize,
      drinks_package: booking.drinkPackage?.name || undefined,
      custom_spirits: booking.spirits.length > 0
        ? booking.spirits.map(bs => `${bs.quantity}x ${bs.spirit.brand} ${bs.spirit.name}`).join('\n')
        : undefined,
      custom_champagnes: booking.champagnes.length > 0
        ? booking.champagnes.map(bc => `${bc.quantity}x ${bc.champagne.brand} ${bc.champagne.name}`).join('\n')
        : undefined,
      stripe_payment_intent_id: booking.stripeIntentId
    };

    // Send email
    const emailSent = await sendBookingConfirmationEmail(bookingWithEmail);

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