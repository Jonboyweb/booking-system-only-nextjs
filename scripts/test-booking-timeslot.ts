#!/usr/bin/env tsx

async function testBookingTimeSlot() {
  const baseUrl = 'http://localhost:3003';

  console.log('🔍 Testing booking time slot validation...\n');

  // Get today's date for booking
  const today = new Date();
  const bookingDate = today.toISOString().split('T')[0];

  // Test data
  const bookingData = {
    tableId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', // This will need to be a valid table ID
    date: bookingDate,
    timeSlot: '23:00', // Valid time slot for nightclub operating hours
    partySize: 4,
    customer: {
      name: 'Test Customer',
      email: 'test@example.com',
      phone: '07123456789'
    },
    packageId: 'package-uuid-here', // This will need to be a valid package ID
    specialRequests: 'Testing time slot validation'
  };

  console.log('📅 Booking Date:', bookingDate);
  console.log('⏰ Time Slot:', bookingData.timeSlot);
  console.log('👥 Party Size:', bookingData.partySize);
  console.log('\n');

  // First, let's get valid table and package IDs
  try {
    // Get tables
    console.log('📊 Fetching available tables...');
    const tablesRes = await fetch(`${baseUrl}/api/tables`);
    const tables = await tablesRes.json();

    if (tables && tables.length > 0) {
      bookingData.tableId = tables[0].id;
      console.log(`✅ Using table: ${tables[0].tableNumber} (ID: ${tables[0].id})`);
    }

    // Get packages
    console.log('🍾 Fetching drink packages...');
    const packagesRes = await fetch(`${baseUrl}/api/packages`);
    const packages = await packagesRes.json();

    if (packages && packages.length > 0) {
      bookingData.packageId = packages[0].id;
      console.log(`✅ Using package: ${packages[0].name} (ID: ${packages[0].id})`);
    }

    console.log('\n');
  } catch (error) {
    console.error('❌ Failed to fetch initial data:', error);
  }

  // Test 1: Valid time slot within operating hours
  console.log('Test 1: Valid time slot (23:00)');
  console.log('----------------------------------');

  try {
    const response = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Booking created successfully!');
      console.log('Booking ID:', result.id);
      console.log('Booking Reference:', result.bookingReference);
    } else {
      console.log('❌ Booking failed:', result.error);
      if (result.details) {
        console.log('Details:', result.details);
      }
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }

  console.log('\n');

  // Test 2: Another valid time slot
  console.log('Test 2: Valid time slot (00:30)');
  console.log('----------------------------------');

  bookingData.timeSlot = '00:30';
  bookingData.customer.email = 'test2@example.com'; // Different email to avoid conflicts

  try {
    const response = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Booking created successfully!');
      console.log('Booking ID:', result.id);
      console.log('Booking Reference:', result.bookingReference);
    } else {
      console.log('❌ Booking failed:', result.error);
      if (result.details) {
        console.log('Details:', result.details);
      }
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }

  console.log('\n');

  // Test 3: Invalid time slot (outside operating hours)
  console.log('Test 3: Invalid time slot (10:00 - outside operating hours)');
  console.log('------------------------------------------------------------');

  bookingData.timeSlot = '10:00';
  bookingData.customer.email = 'test3@example.com';

  try {
    const response = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('⚠️ Unexpected: Booking created with invalid time slot!');
      console.log('Booking ID:', result.id);
    } else {
      console.log('✅ Correctly rejected invalid time slot');
      console.log('Error:', result.error);
      if (result.details) {
        console.log('Details:', result.details);
      }
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }

  console.log('\n');

  // Test 4: Check generated time slots for the date
  console.log('Test 4: Check available time slots for', bookingDate);
  console.log('----------------------------------------------------');

  try {
    // Import operating hours functions
    const { generateTimeSlots, getOperatingHours } = await import('../lib/operating-hours');

    const date = new Date(bookingDate);
    const hours = getOperatingHours(date);
    const slots = generateTimeSlots(date);

    console.log(`Operating Hours: ${hours.startTime} - ${hours.endTime}`);
    if (hours.isSpecialEvent) {
      console.log(`Special Event: ${hours.eventName}`);
    }
    console.log('\nAvailable Time Slots:');
    console.log(slots.join(', '));
  } catch (error) {
    console.error('❌ Failed to get time slots:', error);
  }

  console.log('\n✅ Time slot validation test complete!');
}

testBookingTimeSlot().catch(console.error);