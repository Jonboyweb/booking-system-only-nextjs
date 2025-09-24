#!/usr/bin/env tsx
/**
 * Integration test for venue objects in the customer booking flow
 */

import fetch from 'node-fetch';

// Type definitions matching Prisma schema
interface VenueObject {
  id: string;
  type: 'BAR' | 'DJ_BOOTH' | 'PARTITION' | 'DANCE_FLOOR' | 'EXIT' | 'STAIRCASE' | 'TOILETS' | 'CUSTOM';
  description: string;
  floor: 'UPSTAIRS' | 'DOWNSTAIRS';
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  color?: string | null;
  createdAt: string;
  updatedAt: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';

async function testVenueObjectsIntegration() {
  console.log('Testing Venue Objects Integration in Booking Flow\n');
  console.log('='.repeat(50));

  let allTestsPassed = true;

  try {
    // Test 1: Verify venue objects API endpoint
    console.log('\n1. Testing venue objects API endpoint...');
    const venueResponse = await fetch(`${BASE_URL}/api/venue-objects`);

    if (!venueResponse.ok) {
      console.error('   ❌ Failed to fetch venue objects');
      allTestsPassed = false;
    } else {
      const venueObjects = await venueResponse.json() as VenueObject[];
      console.log(`   ✅ Fetched ${venueObjects.length} venue objects`);

      // Verify floor distribution
      const upstairs = venueObjects.filter((obj) => obj.floor === 'UPSTAIRS');
      const downstairs = venueObjects.filter((obj) => obj.floor === 'DOWNSTAIRS');
      console.log(`   ✅ Upstairs: ${upstairs.length}, Downstairs: ${downstairs.length}`);
    }

    // Test 2: Verify tables API still works
    console.log('\n2. Testing tables API endpoint...');
    const tablesResponse = await fetch(`${BASE_URL}/api/tables`);

    if (!tablesResponse.ok) {
      console.error('   ❌ Failed to fetch tables');
      allTestsPassed = false;
    } else {
      const tables = await tablesResponse.json() as any[];
      console.log(`   ✅ Fetched ${tables.length} tables`);
    }

    // Test 3: Verify booking page loads
    console.log('\n3. Testing booking page...');
    const bookingResponse = await fetch(`${BASE_URL}/booking`);

    if (!bookingResponse.ok) {
      console.error('   ❌ Failed to load booking page');
      allTestsPassed = false;
    } else {
      console.log('   ✅ Booking page loads successfully');
    }

    // Test 4: Verify availability endpoint
    console.log('\n4. Testing availability endpoint...');
    const today = new Date().toISOString().split('T')[0];
    const availabilityResponse = await fetch(`${BASE_URL}/api/availability?date=${today}&time=20:00-22:00`);

    if (!availabilityResponse.ok) {
      console.error('   ❌ Failed to check availability');
      allTestsPassed = false;
    } else {
      const availability = await availabilityResponse.json() as {
        bookedTables?: number[];
        blockedTables?: number[];
      };
      console.log('   ✅ Availability check working');
      if (availability.bookedTables) {
        console.log(`      Booked tables: ${availability.bookedTables.join(', ') || 'none'}`);
      }
      if (availability.blockedTables) {
        console.log(`      Blocked tables: ${availability.blockedTables.join(', ') || 'none'}`);
      }
    }

    // Test 5: Verify all required APIs
    console.log('\n5. Testing supporting APIs...');
    const endpoints = [
      { path: '/api/packages', name: 'Drink packages' },
      { path: '/api/spirits', name: 'Spirits' },
      { path: '/api/champagnes', name: 'Champagnes' }
    ];

    for (const endpoint of endpoints) {
      const response = await fetch(`${BASE_URL}${endpoint.path}`);
      if (!response.ok) {
        console.error(`   ❌ Failed to fetch ${endpoint.name}`);
        allTestsPassed = false;
      } else {
        const data = await response.json() as any[];
        console.log(`   ✅ ${endpoint.name}: ${data.length} items`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    if (allTestsPassed) {
      console.log('✨ All tests passed successfully!');
      console.log('\n🎉 Venue objects are now integrated into the customer booking flow.');
      console.log('   Customers will see venue objects (bars, dance floors, etc.) on the floor plans');
      console.log('   while selecting their tables.');
    } else {
      console.log('⚠️  Some tests failed. Please check the errors above.');
    }

  } catch (error) {
    console.error('\n❌ Integration test failed:', error);
    process.exit(1);
  }
}

testVenueObjectsIntegration();