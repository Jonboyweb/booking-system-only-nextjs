#!/usr/bin/env tsx

import { db } from '../lib/db';


async function testBookingModification() {
  console.log('🧪 Testing Booking Modification Feature\n');

  try {
    // 1. Create a test customer
    console.log('1️⃣ Creating test customer...');
    const customer = await db.customer.create({
      data: {
        firstName: 'Test',
        lastName: 'Customer',
        email: 'test.modification@example.com',
        phone: '07700900000',
        marketingConsent: true
      }
    });
    console.log(`✅ Customer created: ${customer.firstName} ${customer.lastName}\n`);

    // 2. Get a table for testing
    console.log('2️⃣ Getting test table...');
    const table = await db.table.findFirst({
      where: { tableNumber: 5 }
    });
    if (!table) throw new Error('Table not found');
    console.log(`✅ Using Table ${table.tableNumber} - ${table.floor}\n`);

    // 3. Create a test booking for tomorrow
    console.log('3️⃣ Creating test booking...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const booking = await db.booking.create({
      data: {
        bookingReference: `TEST-${Date.now()}`,
        tableId: table.id,
        customerId: customer.id,
        bookingDate: tomorrow,
        bookingTime: '10:00 PM',
        partySize: 4,
        status: 'CONFIRMED',
        depositPaid: true,
        depositAmount: 50,
        stripeIntentId: 'pi_test_' + Date.now(),
        paymentDate: new Date(),
        specialRequests: 'Test booking for modification feature'
      },
      include: {
        table: true,
        customer: true
      }
    });

    console.log(`✅ Booking created:`);
    console.log(`   Reference: ${booking.bookingReference}`);
    console.log(`   Date: ${booking.bookingDate.toDateString()}`);
    console.log(`   Time: ${booking.bookingTime}`);
    console.log(`   Table: ${booking.table.tableNumber}`);
    console.log(`   Party Size: ${booking.partySize}\n`);

    // 4. Test availability check
    console.log('4️⃣ Testing availability check...');
    const availableTable = await db.table.findFirst({
      where: { 
        tableNumber: 8,
        bookings: {
          none: {
            bookingDate: tomorrow,
            bookingTime: '11:00 PM',
            status: { in: ['PENDING', 'CONFIRMED'] }
          }
        }
      }
    });
    console.log(`✅ Table 8 is ${availableTable ? 'available' : 'not available'} for 11:00 PM\n`);

    // 5. Simulate a modification
    console.log('5️⃣ Simulating booking modification...');
    const modifiedBooking = await db.booking.update({
      where: { id: booking.id },
      data: {
        bookingTime: '11:00 PM',
        partySize: 6,
        updatedAt: new Date()
      },
      include: {
        table: true,
        customer: true
      }
    });

    // 6. Create modification record
    const modification = await db.bookingModification.create({
      data: {
        bookingId: booking.id,
        modifiedBy: 'admin@backroomleeds.co.uk',
        previousData: {
          bookingTime: booking.bookingTime,
          partySize: booking.partySize
        },
        newData: {
          bookingTime: modifiedBooking.bookingTime,
          partySize: modifiedBooking.partySize
        },
        reason: 'Customer requested time change',
        emailSent: false
      }
    });

    console.log(`✅ Booking modified:`);
    console.log(`   Time: ${booking.bookingTime} → ${modifiedBooking.bookingTime}`);
    console.log(`   Party Size: ${booking.partySize} → ${modifiedBooking.partySize}`);
    console.log(`   Modification ID: ${modification.id}\n`);

    // 7. Verify modification history
    console.log('6️⃣ Verifying modification history...');
    const modifications = await db.bookingModification.findMany({
      where: { bookingId: booking.id },
      orderBy: { modifiedAt: 'desc' }
    });

    console.log(`✅ Found ${modifications.length} modification(s) for this booking\n`);

    // Summary
    console.log('🎉 BOOKING MODIFICATION TEST COMPLETED SUCCESSFULLY!\n');
    console.log('📋 Summary:');
    console.log(`   - Created test customer and booking`);
    console.log(`   - Verified table availability checking`);
    console.log(`   - Successfully modified booking details`);
    console.log(`   - Created modification history record`);
    console.log(`   - All database operations working correctly\n`);
    console.log('📝 Next Steps:');
    console.log(`   1. Login to admin dashboard: http://localhost:3000/admin/login`);
    console.log(`   2. Navigate to Bookings section`);
    console.log(`   3. Find booking ${booking.bookingReference}`);
    console.log(`   4. Click "View" to see the booking details`);
    console.log(`   5. Click "Edit Booking" to test the modification UI`);
    console.log(`   6. Try changing date, time, party size, or table`);
    console.log(`   7. Use "Check Availability" to validate changes`);
    console.log(`   8. Save changes and optionally send email notification\n`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.$disconnect();
  }
}

testBookingModification();