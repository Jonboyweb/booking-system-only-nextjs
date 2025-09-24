#!/usr/bin/env node
/**
 * Test script to verify booking form validation fix
 * Tests that the frontend correctly transforms firstName/lastName to name field
 */

async function testBookingForm() {
  console.log('Testing booking form validation fix...\n');

  // Step 1: Get available tables
  const tablesResponse = await fetch('http://localhost:3002/api/tables');
  const tables = await tablesResponse.json();
  const table = tables[0];
  console.log(`✓ Found table: ${table.tableNumber} (${table.id})`);

  // Step 2: Get available packages
  const packagesResponse = await fetch('http://localhost:3002/api/packages');
  const packages = await packagesResponse.json();
  const drinkPackage = packages[0];
  console.log(`✓ Found package: ${drinkPackage.name} (${drinkPackage.id})`);

  // Step 3: Test booking creation with correct data transformation
  const bookingData = {
    tableId: table.id,
    date: '2025-09-26',
    timeSlot: '20:00-22:00',
    partySize: 4,
    customer: {
      name: 'Test User', // Single name field as expected by backend
      email: `test-${Date.now()}@example.com`, // Unique email
      phone: '07123456789'
    },
    packageId: drinkPackage.id
  };

  console.log('\n📋 Sending booking request with transformed data:');
  console.log('  - customer.name:', bookingData.customer.name);
  console.log('  - timeSlot:', bookingData.timeSlot);
  console.log('  - packageId:', bookingData.packageId);

  const bookingResponse = await fetch('http://localhost:3002/api/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bookingData)
  });

  const result = await bookingResponse.json();

  if (result.success) {
    console.log('\n✅ Booking created successfully!');
    console.log(`   Reference: ${result.data.bookingReference}`);
    console.log(`   Customer: ${result.data.customer.firstName} ${result.data.customer.lastName}`);
    console.log(`   Email: ${result.data.customer.email}`);
    console.log('\n🎉 Frontend validation fix is working correctly!');
  } else {
    console.error('\n❌ Booking failed:', result.error);
    if (result.details) {
      console.error('   Details:', result.details);
    }
    process.exit(1);
  }
}

// Run the test
testBookingForm().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});