import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { getAuthUser } from '@/src/middleware/auth';
import sgMail from '@sendgrid/mail';
import { generateBookingModificationEmail } from '@/src/lib/email/templates/booking-modification';

const prisma = new PrismaClient();

// Helper function to get and validate API key
function getApiKey(): string | undefined {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (apiKey) {
    sgMail.setApiKey(apiKey);
  }
  return apiKey;
}

// Helper function to get from email
function getFromEmail(): string {
  return process.env.EMAIL_FROM || 'admin@backroomleeds.co.uk';
}

const FROM_NAME = 'The Backroom Leeds';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check authentication
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Email service not configured' },
      { status: 500 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { originalBooking, updatedBooking, modificationReason } = body;

    if (!originalBooking || !updatedBooking) {
      return NextResponse.json(
        { error: 'Missing booking data' },
        { status: 400 }
      );
    }

    // Fetch current booking to get customer email
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

    // Format booking data for email template
    const formatBookingForEmail = (bookingData: typeof booking, isOriginal: boolean = false) => {
      const tableName = isOriginal && originalBooking.table_name 
        ? originalBooking.table_name 
        : `Table ${bookingData.table.tableNumber} - ${bookingData.table.floor.charAt(0).toUpperCase() + bookingData.table.floor.slice(1).toLowerCase()}`;
      
      const formattedSpirits = bookingData.spirits?.length > 0
        ? bookingData.spirits.map((bs) => `${bs.quantity}x ${bs.spirit.brand} ${bs.spirit.name}`).join('\n')
        : null;
        
      const formattedChampagnes = bookingData.champagnes?.length > 0
        ? bookingData.champagnes.map((bc) => `${bc.quantity}x ${bc.champagne.brand} ${bc.champagne.name}`).join('\n')
        : null;

      return {
        id: bookingData.id,
        bookingReference: bookingData.bookingReference,
        reference_number: bookingData.bookingReference,
        tableId: bookingData.tableId,
        table_name: tableName,
        customerId: bookingData.customerId,
        name: `${bookingData.customer.firstName} ${bookingData.customer.lastName}`,
        email: bookingData.customer.email,
        phone: bookingData.customer.phone,
        bookingDate: bookingData.bookingDate,
        date: isOriginal && originalBooking.date 
          ? originalBooking.date 
          : bookingData.bookingDate.toISOString(),
        bookingTime: bookingData.bookingTime,
        time: isOriginal && originalBooking.time 
          ? originalBooking.time 
          : bookingData.bookingTime,
        partySize: bookingData.partySize,
        party_size: isOriginal && originalBooking.party_size 
          ? originalBooking.party_size 
          : bookingData.partySize,
        status: bookingData.status,
        depositAmount: Number(bookingData.depositAmount),
        depositPaid: bookingData.depositPaid,
        stripe_payment_intent_id: bookingData.stripeIntentId,
        drinkPackageId: bookingData.drinkPackageId,
        drinks_package: bookingData.drinkPackage?.name,
        specialRequests: bookingData.specialRequests,
        custom_spirits: formattedSpirits || undefined,
        custom_champagnes: formattedChampagnes || undefined,
        createdAt: bookingData.createdAt,
        updatedAt: bookingData.updatedAt
      };
    };

    // Format original and updated booking data
    const originalData = formatBookingForEmail(booking, true);
    const updatedData = formatBookingForEmail(booking, false);

    // Override with provided changes
    if (updatedBooking.date) updatedData.date = updatedBooking.date;
    if (updatedBooking.time) updatedData.time = updatedBooking.time;
    if (updatedBooking.party_size) updatedData.party_size = updatedBooking.party_size;
    if (updatedBooking.table_name) updatedData.table_name = updatedBooking.table_name;

    // Generate email content
    const { subject, text, html } = generateBookingModificationEmail({
      originalBooking: originalData,
      updatedBooking: updatedData,
      modificationReason,
      modifiedBy: user.email
    });

    // Send email
    const msg = {
      to: booking.customer.email,
      from: {
        email: getFromEmail(),
        name: FROM_NAME
      },
      subject,
      text,
      html,
    };

    await sgMail.send(msg);
    
    console.log(`Booking modification email sent to ${booking.customer.email} for booking ${booking.bookingReference}`);

    // Log the email send in the database (if we have modification tracking)
    // This would be done after adding the BookingModification model

    return NextResponse.json({ 
      success: true, 
      message: 'Modification email sent successfully',
      recipient: booking.customer.email 
    });
  } catch (error) {
    console.error('Error sending modification email:', error);
    return NextResponse.json(
      { error: 'Failed to send modification email' },
      { status: 500 }
    );
  }
}