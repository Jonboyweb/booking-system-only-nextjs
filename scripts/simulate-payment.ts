#!/usr/bin/env tsx

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { prisma } from '../lib/prisma';
import { sendBookingConfirmationEmail } from '../src/lib/email/sendgrid';

async function simulatePaymentConfirmation(bookingRef: string) {
  console.log(`🔄 Simulating payment confirmation for booking ${bookingRef}\n`);

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
    console.log(`   Current Status: ${booking.status}`);
    console.log(`   Deposit Paid: ${booking.depositPaid}\n`);

    // Update booking to confirmed
    console.log('💳 Updating booking status to CONFIRMED...');
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'CONFIRMED',
        depositPaid: true,
        stripePaymentId: 'pi_simulated_' + Date.now(),
        paymentDate: new Date()
      }
    });

    // Create payment log
    await prisma.paymentLog.create({
      data: {
        bookingId: booking.id,
        stripePaymentId: 'pi_simulated_' + Date.now(),
        amount: 5000, // £50
        currency: 'gbp',
        status: 'SUCCEEDED',
        metadata: { simulated: true }
      }
    });

    console.log('✅ Booking status updated\n');

    // Format booking for email
    const tableName = `Table ${booking.table.tableNumber} - ${booking.table.floor.charAt(0).toUpperCase() + booking.table.floor.slice(1).toLowerCase()}`;
    const emailBooking = {
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
      date: booking.bookingDate.toISOString().split('T')[0],
      bookingTime: booking.bookingTime,
      time: booking.bookingTime,
      partySize: booking.partySize,
      party_size: booking.partySize,
      status: 'CONFIRMED' as const,
      depositAmount: booking.depositAmount,
      depositPaid: true,
      stripe_payment_intent_id: 'pi_simulated_' + Date.now(),
      drinkPackageId: booking.drinkPackageId,
      drinks_package: booking.drinkPackage?.name,
      specialRequests: booking.specialRequests,
      custom_spirits: booking.spirits.length > 0 
        ? booking.spirits.map(bs => `${bs.spirit.name} (£${bs.spirit.price})`).join('\n')
        : undefined,
      custom_champagnes: booking.champagnes.length > 0
        ? booking.champagnes.map(bc => `${bc.champagne.name} (£${bc.champagne.price})`).join('\n')
        : undefined,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };

    // Send confirmation email
    console.log('📧 Sending confirmation email...');
    const emailSent = await sendBookingConfirmationEmail(emailBooking);
    
    if (emailSent) {
      console.log(`✅ Confirmation email sent to ${booking.customer.email}`);
    } else {
      console.log(`❌ Failed to send confirmation email`);
    }

    console.log('\n✨ Payment simulation complete!');
    console.log('   The booking is now confirmed and email has been sent.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get booking reference from command line
const bookingRef = process.argv[2];
if (!bookingRef) {
  console.error('Usage: npx tsx scripts/simulate-payment.ts <booking-reference>');
  process.exit(1);
}

simulatePaymentConfirmation(bookingRef);