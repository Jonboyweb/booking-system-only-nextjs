#!/usr/bin/env npx tsx

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { db } from '../lib/db';
import { sendRefundConfirmationEmail } from '../src/lib/email/refund';

async function testRefundEmail() {
  const bookingRef = process.argv[2] || 'BR-F5ONF3';

  console.log(`Testing refund email for booking: ${bookingRef}`);
  console.log('Email Provider:', process.env.EMAIL_PROVIDER);

  // Fetch the booking
  const booking = await db.booking.findFirst({
    where: { bookingReference: bookingRef },
    include: {
      customer: true,
      table: true,
      drinkPackage: true
    }
  });

  if (!booking) {
    console.error(`Booking ${bookingRef} not found`);
    process.exit(1);
  }

  console.log(`Found booking for ${booking.customer.firstName} ${booking.customer.lastName}`);
  console.log(`Email: ${booking.customer.email}`);

  // Send refund email
  const emailSent = await sendRefundConfirmationEmail({
    booking: {
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
    refundAmount: Number(booking.depositAmount),
    refundId: 'REF-TEST-123',
    reason: 'Test refund email',
    refundDate: new Date()
  });

  if (emailSent) {
    console.log('✅ Refund email sent successfully!');
    if (process.env.EMAIL_PROVIDER === 'mailhog') {
      console.log('📧 Check MailHog at http://localhost:8025');
    }
  } else {
    console.log('❌ Failed to send refund email');
  }

  process.exit(0);
}

testRefundEmail().catch(console.error);