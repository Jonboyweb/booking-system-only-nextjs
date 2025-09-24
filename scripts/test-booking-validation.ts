#!/usr/bin/env tsx
import { randomUUID } from 'crypto';

async function testBookingValidation() {
  const baseUrl = 'http://localhost:3000';

  // Get a table ID first
  const tablesResponse = await fetch(`${baseUrl}/api/tables`);
  const tables = await tablesResponse.json();
  const tableId = tables[0]?.id;

  if (!tableId) {
    console.error('No tables found');
    return;
  }

  // Get a package ID
  const packagesResponse = await fetch(`${baseUrl}/api/packages`);
  const packages = await packagesResponse.json();
  const packageId = packages[0]?.id;

  console.log('Testing booking validation with:');
  console.log('Table ID:', tableId);
  console.log('Package ID:', packageId);

  // Get a date within the valid range (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

  // Test scenario 1: With package selected (should succeed)
  const testData1 = {
    tableId: tableId,
    date: dateStr,
    timeSlot: '20:00-22:00',
    partySize: 4,
    customer: {
      name: 'John Doe',
      email: 'test@example.com',
      phone: '07700900123'
    },
    packageId: packageId,
    customOrder: null,
    champagneOrder: null,
    specialRequests: ''
  };

  // Test scenario 2: Without package (should fail with proper message)
  const testData2 = {
    tableId: tableId,
    date: dateStr,
    timeSlot: '20:00-22:00',
    partySize: 4,
    customer: {
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '07700900124'
    },
    packageId: null,
    customOrder: null,
    champagneOrder: null,
    specialRequests: ''
  };

  console.log('\n=== Test 1: WITH package (should succeed) ===');
  console.log('Sending booking data:', JSON.stringify(testData1, null, 2));

  try {
    const response1 = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData1)
    });

    const result1 = await response1.json();

    if (!response1.ok) {
      console.error('❌ Validation failed:', response1.status);
      console.error('Error:', result1.error);
      if (result1.details) {
        console.error('Details:', JSON.stringify(result1.details, null, 2));
      }
    } else {
      console.log('✅ Booking created successfully!');
      console.log('Booking Reference:', result1.data.bookingReference);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }

  console.log('\n=== Test 2: WITHOUT package (should fail) ===');
  console.log('Sending booking data:', JSON.stringify(testData2, null, 2));

  try {
    const response2 = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData2)
    });

    const result2 = await response2.json();

    if (!response2.ok) {
      console.log('✅ Correctly rejected booking without drinks:', result2.error);
      if (result2.details) {
        console.log('Validation details:', result2.details);
      }
    } else {
      console.error('❌ Unexpectedly accepted booking without drinks');
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

testBookingValidation().catch(console.error);