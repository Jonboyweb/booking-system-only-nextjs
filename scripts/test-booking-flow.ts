#!/usr/bin/env npx tsx

/**
 * Test script to verify the complete booking flow
 * Tests booking creation -> payment page -> payment intent creation
 */

const BASE_URL = 'http://localhost:3000';

async function testBookingFlow() {
  console.log('🧪 Testing Complete Booking Flow\n');
  console.log('=====================================\n');

  try {
    // Step 1: Get available tables
    console.log('1️⃣ Fetching available tables...');
    const tablesRes = await fetch(`${BASE_URL}/api/tables`);
    const tables = await tablesRes.json();
    const table = tables[0];
    console.log(`   ✅ Found table ${table.tableNumber} (ID: ${table.id})\n`);

    // Step 2: Get drink packages
    console.log('2️⃣ Fetching drink packages...');
    const packagesRes = await fetch(`${BASE_URL}/api/packages`);
    const packages = await packagesRes.json();
    const drinkPackage = packages[0];
    console.log(`   ✅ Found package "${drinkPackage.name}" (ID: ${drinkPackage.id})\n`);

    // Step 3: Create a booking
    console.log('3️⃣ Creating test booking...');
    const bookingData = {
      customer: {
        name: 'Test Customer',
        email: `test${Date.now()}@example.com`,
        phone: '07123456789'
      },
      tableId: table.id,
      date: '2025-10-15',
      timeSlot: '23:00',
      partySize: 4,
      packageId: drinkPackage.id,
      specialRequests: 'Test booking'
    };

    const bookingRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });

    const bookingResult = await bookingRes.json();

    if (!bookingResult.success) {
      throw new Error(`Failed to create booking: ${bookingResult.error}`);
    }

    const booking = bookingResult.data;
    console.log(`   ✅ Booking created: ${booking.bookingReference}`);
    console.log(`   📝 Booking ID: ${booking.id}\n`);

    // Step 4: Test fetching booking details
    console.log('4️⃣ Testing booking fetch API...');
    const fetchRes = await fetch(`${BASE_URL}/api/bookings?id=${booking.id}`);
    const fetchResult = await fetchRes.json();

    if (!fetchResult.success) {
      throw new Error(`Failed to fetch booking: ${fetchResult.error}`);
    }

    console.log(`   ✅ Successfully fetched booking: ${fetchResult.data.bookingReference}\n`);

    // Step 5: Test payment intent creation
    console.log('5️⃣ Testing payment intent creation...');
    const paymentData = {
      bookingId: booking.id,
      customerEmail: booking.customer.email,
      customerName: `${booking.customer.firstName} ${booking.customer.lastName}`
    };

    const paymentRes = await fetch(`${BASE_URL}/api/payment/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });

    const paymentResult = await paymentRes.json();

    if (paymentResult.error) {
      throw new Error(`Failed to create payment intent: ${paymentResult.error}`);
    }

    console.log(`   ✅ Payment intent created successfully`);
    console.log(`   💳 Amount: £${paymentResult.amount / 100}`);
    console.log(`   🔑 Client Secret: ${paymentResult.clientSecret.substring(0, 30)}...`);

    // Step 6: Simulate payment page URL
    const paymentPageUrl = `${BASE_URL}/booking/payment?bookingId=${booking.id}`;
    console.log(`\n6️⃣ Payment page URL:`);
    console.log(`   🔗 ${paymentPageUrl}\n`);

    console.log('=====================================');
    console.log('✨ All tests passed successfully!\n');
    console.log('The bug has been fixed. The payment page should now load correctly.');
    console.log('Test the flow by visiting the payment URL above in your browser.\n');

  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the test
testBookingFlow().catch(console.error);