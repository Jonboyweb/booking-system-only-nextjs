#!/usr/bin/env tsx

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { prisma } from '../lib/prisma';
import { sendBookingConfirmationEmail } from '../src/lib/email/sendgrid';

async function resendConfirmationEmail(bookingRef: string) {
  console.log(`📧 Resending confirmation email for booking ${bookingRef}\n`);

  try {
    // Find the booking
    const booking = await prisma.booking.findFirst({
      where: { bookingReference: bookingRef },
      include: {
        customer: true,
        table: true,
        drinkPackage: true,
        spirits: {
          include: { spirit: true }
        },
        champagnes: {
          include: { champagne: true }
        }
      }
    });

    if (!booking) {
      console.error(`❌ Booking ${bookingRef} not found`);
      return;
    }

    console.log(`📚 Found booking:`);
    console.log(`   Customer: ${booking.customer.firstName} ${booking.customer.lastName}`);
    console.log(`   Email: ${booking.customer.email}`);
    console.log(`   Table: ${booking.table.tableNumber} - ${booking.table.floor}`);
    console.log(`   Status: ${booking.status}\n`);

    // Format booking for email with correct table name
    const tableName = `Table ${booking.table.tableNumber} - ${booking.table.floor.charAt(0).toUpperCase() + booking.table.floor.slice(1).toLowerCase()}`;
    
    const emailBooking = {
      ...booking,
      email: booking.customer.email,
      name: `${booking.customer.firstName} ${booking.customer.lastName}`,
      phone: booking.customer.phone,
      reference_number: booking.bookingReference,
      table_name: tableName,
      date: booking.bookingDate.toISOString().split('T')[0],
      time: booking.bookingTime,
      party_size: booking.partySize,
      drinks_package: booking.drinkPackage?.name,
      custom_spirits: booking.spirits.length > 0 
        ? booking.spirits.map(bs => `${bs.spirit.name} (£${bs.spirit.price})`).join('\n')
        : undefined,
      custom_champagnes: booking.champagnes.length > 0
        ? booking.champagnes.map(bc => `${bc.champagne.name} (£${bc.champagne.price})`).join('\n')
        : undefined,
      stripe_payment_intent_id: booking.stripePaymentId || 'pending'
    } as any;

    // Send confirmation email
    console.log(`📧 Sending confirmation email with table: ${tableName}`);
    const emailSent = await sendBookingConfirmationEmail(emailBooking);
    
    if (emailSent) {
      console.log(`✅ Confirmation email sent to ${booking.customer.email}`);
      console.log(`   Table shown in email: ${tableName}`);
    } else {
      console.log(`❌ Failed to send confirmation email`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get booking reference from command line
const bookingRef = process.argv[2];
if (!bookingRef) {
  console.error('Usage: npx tsx scripts/resend-email.ts <booking-reference>');
  process.exit(1);
}

resendConfirmationEmail(bookingRef);