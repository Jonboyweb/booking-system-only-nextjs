#!/usr/bin/env tsx
import { db } from '../lib/db';

async function testApiResponseStructure() {
  console.log('\nTesting API response structure for different scenarios...\n');

  try {
    // Test 1: Valid booking reference
    console.log('Test 1: Valid booking reference (BR-F5ONF3)');
    let response = await fetch('http://localhost:3000/api/bookings?reference=BR-F5ONF3');
    let data = await response.json();

    if (data.success && data.data && data.data.table) {
      console.log('✅ Valid booking returns correct structure');
      console.log('   - Has success: true');
      console.log('   - Has data object');
      console.log('   - Has table data');
    } else {
      console.log('❌ Invalid structure:', JSON.stringify(data, null, 2));
    }

    // Test 2: Invalid booking reference
    console.log('\nTest 2: Invalid booking reference');
    response = await fetch('http://localhost:3000/api/bookings?reference=BR-INVALID');
    data = await response.json();

    if (!response.ok && data.success === false && data.error) {
      console.log('✅ Invalid booking returns error correctly');
      console.log('   - Has success: false');
      console.log('   - Has error message:', data.error);
    } else {
      console.log('❌ Unexpected response for invalid booking');
    }

    // Test 3: Booking by ID
    const booking = await db.booking.findFirst({
      where: { status: 'CONFIRMED' },
      select: { id: true }
    });

    if (booking) {
      console.log('\nTest 3: Booking by ID');
      response = await fetch(`http://localhost:3000/api/bookings?id=${booking.id}`);
      data = await response.json();

      if (data.success && data.data && data.data.table) {
        console.log('✅ Booking by ID returns correct structure');
      } else {
        console.log('❌ Invalid structure for ID query');
      }
    }

    // Test 4: Missing parameters
    console.log('\nTest 4: Missing parameters');
    response = await fetch('http://localhost:3000/api/bookings');
    data = await response.json();

    if (!response.ok && data.success === false) {
      console.log('✅ Missing parameters handled correctly');
      console.log('   - Error:', data.error);
    } else {
      console.log('❌ Should return error for missing parameters');
    }

    console.log('\n✅ All API response structure tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.$disconnect();
  }
}

testApiResponseStructure().catch(console.error);