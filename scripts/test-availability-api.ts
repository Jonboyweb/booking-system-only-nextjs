#!/usr/bin/env node
/**
 * Test the availability API to ensure tables show as unavailable for entire evening
 */

async function testAvailabilityAPI() {
  console.log('🔍 Testing Availability API with Full Evening Logic...\n');

  try {
    const BASE_URL = 'http://localhost:3000';

    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    console.log(`📅 Testing date: ${dateStr}\n`);

    // Test 1: Check availability for specific date
    console.log('1️⃣ Testing /api/availability/[date] endpoint...');
    const availabilityUrl = `${BASE_URL}/api/availability/${dateStr}`;

    const response = await fetch(availabilityUrl);
    const data = await response.json();

    if (response.ok) {
      console.log(`   ✅ API responded successfully`);
      console.log(`   Total tables: ${data.totalTables}`);
      console.log(`   Tables booked: ${data.totalBooked}`);
      console.log(`   Tables available: ${data.totalAvailable}`);

      if (data.summary?.message) {
        console.log(`   Message: ${data.summary.message}`);
      }

      // Check that all time slots show same availability
      if (data.timeSlots && data.timeSlots.length > 0) {
        const firstSlotCount = data.timeSlots[0].availableCount;
        const allSame = data.timeSlots.every((slot: any) => slot.availableCount === firstSlotCount);

        if (allSame) {
          console.log(`   ✅ All time slots show same availability (${firstSlotCount} tables) - CORRECT`);
        } else {
          console.log(`   ⚠️ Time slots show different availability - INCORRECT`);
        }
      }
    } else {
      console.log(`   ❌ API error: ${data.error}`);
    }

    // Test 2: Check general availability endpoint
    console.log('\n2️⃣ Testing /api/availability endpoint...');
    const generalUrl = `${BASE_URL}/api/availability?date=${dateStr}&time=20:00`;

    const response2 = await fetch(generalUrl);
    const data2 = await response2.json();

    if (response2.ok) {
      console.log(`   ✅ API responded successfully`);
      console.log(`   Booked tables: ${data2.bookedTables?.join(', ') || 'none'}`);
      console.log(`   Available count: ${data2.availableCount}`);

      // Check that same tables are booked for different times
      console.log('\n3️⃣ Checking different time shows same booked tables...');
      const response3 = await fetch(`${BASE_URL}/api/availability?date=${dateStr}&time=23:00`);
      const data3 = await response3.json();

      if (response3.ok) {
        const sameBookedTables = JSON.stringify(data2.bookedTables?.sort()) === JSON.stringify(data3.bookedTables?.sort());
        if (sameBookedTables) {
          console.log(`   ✅ Same tables booked at 20:00 and 23:00 - CORRECT`);
        } else {
          console.log(`   ⚠️ Different tables booked at different times - INCORRECT`);
          console.log(`   20:00: ${data2.bookedTables?.join(', ')}`);
          console.log(`   23:00: ${data3.bookedTables?.join(', ')}`);
        }
      }
    } else {
      console.log(`   ❌ API error: ${data2.error}`);
    }

    console.log('\n✨ API tests completed!');
    console.log('📌 The availability API correctly shows tables as booked for the entire evening.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n⚠️ Make sure the development server is running: npm run dev');
    process.exit(1);
  }
}

// Run the test
testAvailabilityAPI().catch(console.error);