import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { getAuthUser } from '@/src/middleware/auth';
import sgMail from '@sendgrid/mail';
import { generateRefundConfirmationEmail } from '@/src/lib/email/templates/refund-confirmation';

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
  return process.env.SENDGRID_FROM_EMAIL || 'noreply@thebackroomleeds.com';
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
    const { refundAmount, refundId, reason } = body;

    // Fetch booking with all necessary data
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
    const tableName = `Table ${booking.table.tableNumber} - ${booking.table.floor.charAt(0).toUpperCase() + booking.table.floor.slice(1).toLowerCase()}`;
    
    const formattedSpirits = booking.spirits.length > 0
      ? booking.spirits.map(bs => `${bs.quantity}x ${bs.spirit.brand} ${bs.spirit.name}`).join('\n')
      : null;
      
    const formattedChampagnes = booking.champagnes.length > 0
      ? booking.champagnes.map(bc => `${bc.quantity}x ${bc.champagne.brand} ${bc.champagne.name}`).join('\n')
      : null;

    const emailData = {
      booking: {
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
      },
      refundAmount: refundAmount || Number(booking.depositAmount),
      refundId: refundId || `REF-${Date.now()}`,
      reason: reason || 'Customer request',
      refundDate: new Date()
    };

    // Generate email content
    const { subject, text, html } = generateRefundConfirmationEmail(emailData);

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
    
    console.log(`Refund confirmation email sent to ${booking.customer.email} for booking ${booking.bookingReference}`);

    // Update modification record to mark email as sent
    await prisma.bookingModification.updateMany({
      where: {
        bookingId: booking.id,
        reason: {
          contains: 'Refund processed'
        },
        emailSent: false
      },
      data: {
        emailSent: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Refund confirmation email sent successfully',
      recipient: booking.customer.email 
    });
  } catch (error) {
    console.error('Error sending refund email:', error);
    return NextResponse.json(
      { error: 'Failed to send refund email' },
      { status: 500 }
    );
  }
}