import { NextResponse } from 'next/server';
import { stripe, DEPOSIT_AMOUNT } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bookingId, customerEmail } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Verify booking exists and hasn't been paid
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        table: true
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (booking.depositPaid) {
      return NextResponse.json(
        { error: 'Deposit already paid for this booking' },
        { status: 400 }
      );
    }

    // Create or retrieve payment intent
    let paymentIntent;
    
    if (booking.stripeIntentId) {
      // Retrieve existing intent
      try {
        paymentIntent = await stripe.paymentIntents.retrieve(booking.stripeIntentId);
        
        // If already succeeded, mark as paid
        if (paymentIntent.status === 'succeeded') {
          await prisma.booking.update({
            where: { id: bookingId },
            data: {
              depositPaid: true,
              stripePaymentId: paymentIntent.id,
              status: 'CONFIRMED'
            }
          });
          
          return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            alreadyPaid: true
          });
        }
      } catch {
        // Intent not found or invalid, create new one
        console.log('Creating new intent, previous one not found');
      }
    }
    
    if (!paymentIntent || paymentIntent.status === 'canceled') {
      // Create new payment intent
      paymentIntent = await stripe.paymentIntents.create({
        amount: DEPOSIT_AMOUNT,
        currency: 'gbp',
        metadata: {
          bookingId: booking.id,
          bookingReference: booking.bookingReference,
          tableNumber: booking.table.tableNumber.toString(),
          bookingDate: booking.bookingDate.toISOString(),
          bookingTime: booking.bookingTime,
          customerEmail: customerEmail || booking.customer.email,
        },
        receipt_email: customerEmail || booking.customer.email,
        description: `Deposit for table ${booking.table.tableNumber} on ${booking.bookingDate.toLocaleDateString()} at ${booking.bookingTime}`,
      });

      // Update booking with intent ID
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          stripeIntentId: paymentIntent.id
        }
      });
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: DEPOSIT_AMOUNT,
      bookingReference: booking.bookingReference
    });
  } catch (error) {
    console.error('Payment intent creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}