#!/usr/bin/env tsx

import { prisma } from '../lib/prisma';

async function checkPaymentLogs() {
  // Check payment logs
  const paymentLogs = await prisma.paymentLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      booking: true
    }
  });
  
  console.log('💳 Recent payment logs:\n');
  if (paymentLogs.length === 0) {
    console.log('  No payment logs found - webhook may not be receiving events\n');
  } else {
    paymentLogs.forEach(log => {
      console.log(`  Booking: ${log.booking?.bookingReference || 'Unknown'}`);
      console.log(`  Status: ${log.status}`);
      console.log(`  Amount: £${(log.amount / 100).toFixed(2)}`);
      console.log(`  Stripe ID: ${log.stripePaymentId}`);
      console.log(`  Created: ${log.createdAt}`);
      if (log.errorMessage) {
        console.log(`  Error: ${log.errorMessage}`);
      }
      console.log('  ---');
    });
  }
  
  // Check for confirmed bookings
  const confirmedBookings = await prisma.booking.findMany({
    where: { status: 'CONFIRMED' },
    orderBy: { updatedAt: 'desc' },
    take: 3,
    include: {
      customer: true
    }
  });
  
  console.log('\n✅ Recently confirmed bookings:\n');
  if (confirmedBookings.length === 0) {
    console.log('  No confirmed bookings found\n');
  } else {
    confirmedBookings.forEach(b => {
      console.log(`  Reference: ${b.bookingReference}`);
      console.log(`  Customer: ${b.customer.firstName} ${b.customer.lastName}`);
      console.log(`  Email: ${b.customer.email}`);
      console.log(`  Payment Date: ${b.paymentDate}`);
      console.log('  ---');
    });
  }
}

checkPaymentLogs()
  .catch(console.error)
  .finally(() => prisma.$disconnect());