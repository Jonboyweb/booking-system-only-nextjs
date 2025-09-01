#!/usr/bin/env tsx

import { prisma } from '../lib/prisma';

async function checkRecentBookings() {
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      customer: true,
      table: true
    }
  });
  
  console.log('📚 Recent bookings:\n');
  bookings.forEach(b => {
    console.log(`  Reference: ${b.bookingReference}`);
    console.log(`  Status: ${b.status}`);
    console.log(`  Deposit Paid: ${b.depositPaid}`);
    console.log(`  Payment ID: ${b.stripePaymentId || 'None'}`);
    console.log(`  Customer: ${b.customer.firstName} ${b.customer.lastName}`);
    console.log(`  Email: ${b.customer.email}`);
    console.log(`  Date: ${b.bookingDate}`);
    console.log(`  Time: ${b.bookingTime}`);
    console.log(`  Created: ${b.createdAt}`);
    console.log('  ---');
  });
}

checkRecentBookings()
  .catch(console.error)
  .finally(() => prisma.$disconnect());