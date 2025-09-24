#!/usr/bin/env tsx
import { db } from '../lib/db';

async function testBookingFetch() {
  const bookingRef = process.argv[2] || 'BR-F5ONF3';

  console.log(`\nFetching booking ${bookingRef}...\n`);

  try {
    // First, check if booking exists in database
    const booking = await db.booking.findUnique({
      where: { bookingReference: bookingRef },
      include: {
        table: true,
        customer: true,
        drinkPackage: true,
        customOrder: true
      }
    });

    if (!booking) {
      console.log('❌ Booking not found in database');
      return;
    }

    console.log('✅ Booking found in database:');
    console.log('- Reference:', booking.bookingReference);
    console.log('- Status:', booking.status);
    console.log('- Date:', booking.bookingDate);
    console.log('- Time:', booking.bookingTime);
    console.log('- Party Size:', booking.partySize);
    console.log('- Deposit Paid:', booking.depositPaid);

    if (booking.table) {
      console.log('\n✅ Table data:');
      console.log('- Table Number:', booking.table.tableNumber);
      console.log('- Floor:', booking.table.floor);
      console.log('- Description:', booking.table.description);
    } else {
      console.log('\n❌ Table data is missing!');
    }

    if (booking.customer) {
      console.log('\n✅ Customer data:');
      console.log('- Name:', booking.customer.firstName, booking.customer.lastName);
      console.log('- Email:', booking.customer.email);
    } else {
      console.log('\n❌ Customer data is missing!');
    }

    // Now test the API endpoint
    console.log('\n\nTesting API endpoint...');
    const apiUrl = `http://localhost:3000/api/bookings?reference=${bookingRef}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok) {
      console.log('❌ API request failed:', data.error);
      return;
    }

    console.log('✅ API response received');

    if (data.success === false) {
      console.log('❌ API returned error:', data.error);
      return;
    }

    // Check if the response has the expected structure
    const apiBooking = data.data || data;

    if (apiBooking.table) {
      console.log('✅ API response includes table data');
    } else {
      console.log('❌ API response missing table data!');
    }

    if (apiBooking.customer) {
      console.log('✅ API response includes customer data');
    } else {
      console.log('❌ API response missing customer data!');
    }

    console.log('\nAPI Response structure:');
    console.log(JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.$disconnect();
  }
}

testBookingFetch().catch(console.error);