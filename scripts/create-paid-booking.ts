#!/usr/bin/env tsx

import { db } from '../lib/db';


async function createPaidBooking() {
  console.log('💳 Creating a paid booking for refund testing\n');

  try {
    // 1. Create or find a customer
    console.log('1️⃣ Setting up customer...');
    let customer = await db.customer.findFirst({
      where: { email: 'john.doe@example.com' }
    });

    if (!customer) {
      customer = await db.customer.create({
        data: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '07700900123',
          marketingConsent: true
        }
      });
      console.log(`✅ Customer created: ${customer.firstName} ${customer.lastName}`);
    } else {
      console.log(`✅ Using existing customer: ${customer.firstName} ${customer.lastName}`);
    }

    // 2. Get a table
    console.log('\n2️⃣ Selecting table...');
    const table = await db.table.findFirst({
      where: { tableNumber: 7 }
    });
    if (!table) throw new Error('Table not found');
    console.log(`✅ Using Table ${table.tableNumber} - ${table.floor}`);

    // 3. Create a booking for next Friday
    console.log('\n3️⃣ Creating booking...');
    const nextFriday = new Date();
    const daysUntilFriday = (5 - nextFriday.getDay() + 7) % 7 || 7;
    nextFriday.setDate(nextFriday.getDate() + daysUntilFriday);
    nextFriday.setHours(0, 0, 0, 0);

    const booking = await db.booking.create({
      data: {
        bookingReference: `BK-${Date.now().toString(36).toUpperCase()}`,
        tableId: table.id,
        customerId: customer.id,
        bookingDate: nextFriday,
        bookingTime: '10:30 PM',
        partySize: 6,
        status: 'CONFIRMED',
        depositPaid: true,
        depositAmount: 50,
        stripeIntentId: 'pi_test_' + Date.now(),
        stripePaymentId: 'py_test_' + Date.now(),
        paymentDate: new Date(),
        specialRequests: 'Birthday celebration - please have table ready with birthday card',
        internalNotes: 'VIP customer - ensure excellent service'
      },
      include: {
        table: true,
        customer: true
      }
    });

    // 4. Add a drink package
    const drinkPackage = await db.drinkPackage.findFirst({
      where: { name: 'The Speakeasy Special' }
    });

    if (drinkPackage) {
      await db.booking.update({
        where: { id: booking.id },
        data: { drinkPackageId: drinkPackage.id }
      });
      console.log(`✅ Added drink package: ${drinkPackage.name}`);
    }

    // 5. Create payment log
    await db.paymentLog.create({
      data: {
        bookingId: booking.id,
        stripePaymentId: booking.stripePaymentId!,
        amount: 5000, // £50 in pence
        currency: 'GBP',
        status: 'SUCCEEDED',
        metadata: {
          paymentMethod: 'card',
          last4: '4242',
          brand: 'visa'
        }
      }
    });

    console.log('\n✅ BOOKING CREATED SUCCESSFULLY!\n');
    console.log('📋 Booking Details:');
    console.log(`   Reference: ${booking.bookingReference}`);
    console.log(`   Customer: ${customer.firstName} ${customer.lastName}`);
    console.log(`   Email: ${customer.email}`);
    console.log(`   Date: ${nextFriday.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`);
    console.log(`   Time: ${booking.bookingTime}`);
    console.log(`   Table: ${table.tableNumber} (${table.floor})`);
    console.log(`   Party Size: ${booking.partySize} guests`);
    console.log(`   Deposit: £${booking.depositAmount} (PAID)`);
    console.log(`   Status: ${booking.status}`);
    
    console.log('\n📝 Next Steps:');
    console.log('1. Login to admin dashboard: http://localhost:3000/admin/login');
    console.log('2. Go to Bookings section');
    console.log(`3. Find booking ${booking.bookingReference}`);
    console.log('4. Click "View" to see details');
    console.log('5. Click "Refund Deposit" button to test refund functionality');
    console.log('6. Provide a refund reason');
    console.log('7. Confirm the refund');
    console.log('8. Check that:');
    console.log('   - Button changes to "Refunded" with date');
    console.log('   - Refund information appears in Payment section');
    console.log('   - Refund email is sent (if SendGrid is configured)');
    console.log('   - Audit trail is created\n');

  } catch (error) {
    console.error('❌ Error creating booking:', error);
  } finally {
    await db.$disconnect();
  }
}

createPaidBooking();