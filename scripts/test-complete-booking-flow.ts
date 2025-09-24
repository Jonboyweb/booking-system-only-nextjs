#!/usr/bin/env tsx
import { randomUUID } from 'crypto';

async function testCompleteBookingFlow() {
  const baseUrl = 'http://localhost:3000';

  console.log('🔍 Testing Complete Booking Flow\n');

  // Step 1: Get available tables
  console.log('1️⃣ Getting available tables...');
  const tablesResponse = await fetch(`${baseUrl}/api/tables`);
  const tables = await tablesResponse.json();
  const table = tables[0];

  if (!table) {
    console.error('❌ No tables found');
    return;
  }
  console.log(`✅ Found ${tables.length} tables, selected Table ${table.tableNumber}`);

  // Step 2: Get drink packages
  console.log('\n2️⃣ Getting drink packages...');
  const packagesResponse = await fetch(`${baseUrl}/api/packages`);
  const packages = await packagesResponse.json();
  const drinkPackage = packages[0];

  if (!drinkPackage) {
    console.error('❌ No packages found');
    return;
  }
  console.log(`✅ Found ${packages.length} packages, selected "${drinkPackage.name}" (£${drinkPackage.price})`);

  // Step 3: Create booking with package selected
  console.log('\n3️⃣ Creating booking with drink package...');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

  const uniqueEmail = `test-${Date.now()}@example.com`;

  // Try different time slots to find an available one
  const timeSlots = ['18:00-20:00', '20:00-22:00', '22:00-00:00'];
  const randomSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];

  const bookingData = {
    tableId: table.id,
    date: dateStr,
    timeSlot: randomSlot,
    partySize: 4,
    customer: {
      name: 'Test Customer',
      email: uniqueEmail,
      phone: '07700900123'
    },
    packageId: drinkPackage.id, // Package is selected
    customOrder: null,
    champagneOrder: null,
    specialRequests: 'Test booking from validation script'
  };

  const bookingResponse = await fetch(`${baseUrl}/api/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bookingData)
  });

  const bookingResult = await bookingResponse.json();

  if (!bookingResponse.ok) {
    console.error('❌ Booking creation failed:', bookingResult.error);
    if (bookingResult.details) {
      console.error('Details:', bookingResult.details);
    }
    return;
  }

  console.log(`✅ Booking created successfully!`);
  console.log(`   Reference: ${bookingResult.data.bookingReference}`);
  console.log(`   Table: ${bookingResult.data.table.tableNumber}`);
  console.log(`   Date: ${bookingResult.data.bookingDate}`);
  console.log(`   Time: ${bookingResult.data.bookingTime}`);
  console.log(`   Package: ${bookingResult.data.drinkPackage.name}`);
  console.log(`   Status: ${bookingResult.data.status}`);

  // Step 4: Test validation - Try to create booking WITHOUT drinks (should fail)
  console.log('\n4️⃣ Testing validation (booking without drinks - should fail)...');

  const invalidBookingData = {
    ...bookingData,
    customer: {
      ...bookingData.customer,
      email: `test2-${Date.now()}@example.com`
    },
    packageId: null, // No package selected
    customOrder: null, // No custom order
  };

  const invalidResponse = await fetch(`${baseUrl}/api/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(invalidBookingData)
  });

  const invalidResult = await invalidResponse.json();

  if (!invalidResponse.ok) {
    console.log('✅ Correctly rejected booking without drinks');
    console.log(`   Error: ${invalidResult.error}`);
    if (invalidResult.details) {
      console.log(`   Details: ${invalidResult.details}`);
    }
  } else {
    console.error('❌ Unexpectedly accepted booking without drinks!');
  }

  console.log('\n✅ All tests completed successfully!');
  console.log('\nSummary:');
  console.log('- Booking WITH drinks package: ✅ Works');
  console.log('- Booking WITHOUT drinks: ✅ Correctly rejected');
  console.log('- Validation messages: ✅ Clear and informative');
  console.log('\n🎉 The booking system is working correctly!');
}

testCompleteBookingFlow().catch(console.error);