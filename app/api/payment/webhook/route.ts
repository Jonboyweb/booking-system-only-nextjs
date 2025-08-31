import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(paymentIntent);
        break;

      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailure(failedIntent);
        break;

      case 'charge.refunded':
        const charge = event.data.object as Stripe.Charge;
        await handleRefund(charge);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata.bookingId;
  
  if (!bookingId) {
    console.error('No booking ID in payment intent metadata');
    return;
  }

  // Update booking status
  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      depositPaid: true,
      stripePaymentId: paymentIntent.id,
      status: 'CONFIRMED',
      paymentDate: new Date(),
    },
    include: {
      customer: true,
      table: true,
      drinksPackage: true,
      spirits: true,
      champagnes: true,
    }
  });

  // TODO: Send confirmation email
  console.log(`Payment confirmed for booking ${booking.bookingReference}`);
  
  // Log the successful payment
  await prisma.paymentLog.create({
    data: {
      bookingId: booking.id,
      stripePaymentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'SUCCEEDED',
      metadata: paymentIntent.metadata as any,
    }
  });
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata.bookingId;
  
  if (!bookingId) {
    console.error('No booking ID in payment intent metadata');
    return;
  }

  // Log the failed payment
  await prisma.paymentLog.create({
    data: {
      bookingId,
      stripePaymentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'FAILED',
      errorMessage: paymentIntent.last_payment_error?.message,
      metadata: paymentIntent.metadata as any,
    }
  });

  console.log(`Payment failed for booking ${bookingId}`);
}

async function handleRefund(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;
  
  // Find the booking by payment intent ID
  const booking = await prisma.booking.findFirst({
    where: { stripePaymentId: paymentIntentId },
  });

  if (!booking) {
    console.error('No booking found for refunded payment');
    return;
  }

  // Update booking status
  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: 'CANCELLED',
      depositRefunded: true,
      refundDate: new Date(),
      refundAmount: charge.amount_refunded,
    }
  });

  // Log the refund
  await prisma.paymentLog.create({
    data: {
      bookingId: booking.id,
      stripePaymentId: paymentIntentId,
      amount: -charge.amount_refunded,
      currency: charge.currency,
      status: 'REFUNDED',
      metadata: { chargeId: charge.id } as any,
    }
  });

  console.log(`Refund processed for booking ${booking.bookingReference}`);
}