import { NextRequest, NextResponse } from 'next/server';
import { stripe, DEPOSIT_AMOUNT } from '@/lib/stripe';
import { db } from '@/lib/db';
import { checkRateLimit, applyRateLimitHeaders, RateLimitConfigs } from '@/lib/rate-limit';
import { withCORS } from '@/lib/cors';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for payment intent creation
    const rateLimitResult = await checkRateLimit(request, 'payment-intent', RateLimitConfigs.paymentIntent);

    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Too many payment attempts. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        },
        { status: 429 }
      );
      return applyRateLimitHeaders(withCORS(response, request), rateLimitResult);
    }

    const body = await request.json();
    const { bookingId, customerEmail } = body;

    if (!bookingId) {
      const response = NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
      return applyRateLimitHeaders(withCORS(response, request), rateLimitResult);
    }

    // Verify booking exists and hasn't been paid
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        table: true
      }
    });

    if (!booking) {
      const response = NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
      return applyRateLimitHeaders(withCORS(response, request), rateLimitResult);
    }

    if (booking.depositPaid) {
      const response = NextResponse.json(
        { error: 'Deposit already paid for this booking' },
        { status: 400 }
      );
      return applyRateLimitHeaders(withCORS(response, request), rateLimitResult);
    }

    // Create or retrieve payment intent
    let paymentIntent;
    
    if (booking.stripeIntentId) {
      // Retrieve existing intent
      try {
        paymentIntent = await stripe.paymentIntents.retrieve(booking.stripeIntentId);
        
        // If already succeeded, mark as paid
        if (paymentIntent.status === 'succeeded') {
          await db.booking.update({
            where: { id: bookingId },
            data: {
              depositPaid: true,
              stripePaymentId: paymentIntent.id,
              status: 'CONFIRMED'
            }
          });
          
          const response = NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            alreadyPaid: true
          });
          return applyRateLimitHeaders(withCORS(response, request), rateLimitResult);
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
      await db.booking.update({
        where: { id: bookingId },
        data: {
          stripeIntentId: paymentIntent.id
        }
      });
    }

    const response = NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: DEPOSIT_AMOUNT,
      bookingReference: booking.bookingReference
    });

    // Apply rate limit headers and CORS
    return applyRateLimitHeaders(withCORS(response, request), rateLimitResult);
  } catch (error) {
    console.error('Payment intent creation failed:', error);
    const response = NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
    return withCORS(response, request);
  }
}