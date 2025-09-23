import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/src/middleware/auth';
import { processRefund } from '@/src/lib/payment/stripe-refund';


// Map user-friendly reasons to Stripe's valid reasons
function mapToStripeReason(reason: string | undefined): string {
  if (!reason) return 'requested_by_customer';
  
  const lowerReason = reason.toLowerCase();
  
  // Check for keywords to map to valid Stripe reasons
  if (lowerReason.includes('duplicate') || lowerReason.includes('double')) {
    return 'duplicate';
  }
  if (lowerReason.includes('fraud') || lowerReason.includes('suspicious')) {
    return 'fraudulent';
  }
  
  // Default to requested_by_customer for all other cases
  // (Customer request, Event cancelled, Other, etc.)
  return 'requested_by_customer';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check authentication
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only allow managers and admins to process refunds
  if (user.role === 'staff') {
    return NextResponse.json(
      { error: 'Insufficient permissions. Only managers and admins can process refunds.' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { amount, reason, sendEmail } = body;

    // Fetch the booking
    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        table: true,
        drinkPackage: true
      }
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Validate booking can be refunded
    if (!booking.depositPaid) {
      return NextResponse.json(
        { error: 'No deposit has been paid for this booking' },
        { status: 400 }
      );
    }

    if (booking.depositRefunded) {
      return NextResponse.json(
        { error: 'Deposit has already been refunded' },
        { status: 400 }
      );
    }

    if (!booking.stripeIntentId) {
      return NextResponse.json(
        { error: 'No payment intent found for this booking' },
        { status: 400 }
      );
    }

    if (booking.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot refund completed bookings' },
        { status: 400 }
      );
    }

    // Process the refund through Stripe
    const refundAmount = amount || Number(booking.depositAmount) * 100; // Convert to pence
    
    // Map user-provided reasons to valid Stripe reasons
    const stripeReason = mapToStripeReason(reason);
    
    console.log('Processing refund:', {
      bookingId: booking.id,
      stripeIntentId: booking.stripeIntentId,
      refundAmount,
      userReason: reason,
      stripeReason
    });
    
    const refundResult = await processRefund(
      booking.stripeIntentId,
      refundAmount,
      stripeReason
    );

    if (!refundResult.success) {
      console.error('Refund failed:', {
        bookingId: booking.id,
        error: refundResult.error,
        stripeIntentId: booking.stripeIntentId
      });
      
      // Log failed refund attempt
      await db.paymentLog.create({
        data: {
          bookingId: booking.id,
          stripePaymentId: booking.stripeIntentId,
          amount: refundAmount,
          currency: 'GBP',
          status: 'REFUND_FAILED',
          errorMessage: refundResult.error,
          metadata: {
            attemptedBy: user.email,
            userReason: reason || 'Customer request',
            stripeReason
          }
        }
      });

      return NextResponse.json(
        { error: refundResult.error || 'Failed to process refund' },
        { status: 500 }
      );
    }

    // Update booking with refund information
    const updatedBooking = await db.booking.update({
      where: { id },
      data: {
        depositRefunded: true,
        refundDate: new Date(),
        refundAmount: refundAmount,
        status: booking.status === 'PENDING' ? 'CANCELLED' : booking.status,
        updatedAt: new Date()
      }
    });

    // Log successful refund
    await db.paymentLog.create({
      data: {
        bookingId: booking.id,
        stripePaymentId: refundResult.refundId!,
        amount: refundResult.amount!,
        currency: 'GBP',
        status: 'REFUNDED',
        metadata: {
          refundedBy: user.email,
          originalPaymentIntent: booking.stripeIntentId,
          userReason: reason || 'Customer request',
          stripeReason,
          refundStatus: refundResult.status
        }
      }
    });

    // Create modification record for audit trail
    await db.bookingModification.create({
      data: {
        bookingId: booking.id,
        modifiedBy: user.email,
        previousData: {
          depositRefunded: false,
          depositAmount: Number(booking.depositAmount)
        },
        newData: {
          depositRefunded: true,
          refundAmount: refundAmount / 100,
          refundDate: new Date().toISOString()
        },
        reason: `Refund processed: ${reason || 'Customer request'}`,
        emailSent: false
      }
    });

    // Send refund confirmation email if requested
    if (sendEmail) {
      console.log('Attempting to send refund email...');
      // Import and call the email function directly instead of using fetch
      try {
        const { sendRefundConfirmationEmail } = await import('@/src/lib/email/refund');
        const emailSent = await sendRefundConfirmationEmail({
          booking: {
            ...booking,
            email: booking.customer.email,
            name: `${booking.customer.firstName} ${booking.customer.lastName}`,
            phone: booking.customer.phone,
            reference_number: booking.bookingReference,
            table_name: `Table ${booking.table.tableNumber} - ${booking.table.floor.charAt(0).toUpperCase() + booking.table.floor.slice(1).toLowerCase()}`,
            date: booking.bookingDate.toISOString().split('T')[0],
            time: booking.bookingTime,
            booking_time: booking.bookingTime,
            party_size: booking.partySize,
            drinks_package: booking.drinkPackage?.name,
            specialRequests: booking.specialRequests || undefined,
            depositAmount: Number(booking.depositAmount),
            stripeIntentId: booking.stripeIntentId || undefined
          },
          refundAmount: refundAmount / 100,
          refundId: refundResult.refundId,
          reason: reason || 'Customer request',
          refundDate: new Date()
        });

        if (emailSent) {
          console.log(`Refund confirmation email sent for booking ${booking.bookingReference}`);
        } else {
          console.error('Failed to send refund confirmation email');
        }
      } catch (err) {
        console.error('Error sending refund email:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Refund processed successfully',
      refund: {
        id: refundResult.refundId,
        amount: refundResult.amount! / 100,
        status: refundResult.status,
        date: refundResult.refundDate
      },
      booking: {
        id: updatedBooking.id,
        bookingReference: updatedBooking.bookingReference,
        status: updatedBooking.status,
        depositRefunded: updatedBooking.depositRefunded,
        refundDate: updatedBooking.refundDate,
        refundAmount: updatedBooking.refundAmount
      }
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    );
  }
}

// GET endpoint to check refund status
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

    // Fetch the booking with refund info
    const booking = await db.booking.findUnique({
      where: { id },
      select: {
        id: true,
        bookingReference: true,
        depositRefunded: true,
        refundDate: true,
        refundAmount: true,
        stripeIntentId: true,
        paymentLogs: {
          where: {
            status: 'REFUNDED'
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({
      refunded: booking.depositRefunded,
      refundDate: booking.refundDate,
      refundAmount: booking.refundAmount ? Number(booking.refundAmount) / 100 : null,
      refundLog: booking.paymentLogs[0] || null
    });
  } catch (error) {
    console.error('Error checking refund status:', error);
    return NextResponse.json(
      { error: 'Failed to check refund status' },
      { status: 500 }
    );
  }
}