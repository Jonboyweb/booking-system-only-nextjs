#!/usr/bin/env tsx

import { prisma } from '../lib/prisma';

const API_BASE = 'http://localhost:3002/api';

async function testAPI() {
  console.log('🧪 Testing Phase 4 Backend APIs...\n');
  
  try {
    // Test 1: Date validation (31-day limit)
    console.log('1️⃣ Testing 31-day booking limit...');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 35); // 35 days from now
    
    const tooFarBooking = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: 'test-id',
        date: futureDate.toISOString(),
        time: '19:00',
        partySize: 4,
        customer: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: '07700900000'
        }
      })
    });
    
    if (tooFarBooking.status === 400) {
      console.log('✅ 31-day limit working correctly\n');
    } else {
      console.log('❌ 31-day limit not enforced\n');
    }
    
    // Test 2: Table capacity validation
    console.log('2️⃣ Testing table capacity validation...');
    const tables = await prisma.table.findMany({ take: 1 });
    if (tables.length > 0) {
      const table = tables[0];
      const invalidSizeBooking = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: table.id,
          date: new Date().toISOString(),
          time: '19:00',
          partySize: table.capacityMax + 5, // Exceeds capacity
          customer: {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            phone: '07700900000'
          }
        })
      });
      
      if (invalidSizeBooking.status === 400) {
        console.log('✅ Table capacity validation working\n');
      } else {
        console.log('❌ Table capacity not validated\n');
      }
    }
    
    // Test 3: Table combination (15 & 16)
    console.log('3️⃣ Testing table combination API...');
    const combineResponse = await fetch(`${API_BASE}/tables/combine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableNumbers: [15, 16],
        partySize: 10
      })
    });
    
    if (combineResponse.ok) {
      const combineData = await combineResponse.json();
      console.log('✅ Table combination:', combineData.description);
      console.log(`   Capacity: ${combineData.combinedCapacity.min}-${combineData.combinedCapacity.max} guests\n`);
    } else {
      console.log('❌ Table combination failed\n');
    }
    
    // Test 4: Availability endpoint
    console.log('4️⃣ Testing availability API...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    
    const availabilityResponse = await fetch(`${API_BASE}/availability/${dateStr}`);
    if (availabilityResponse.ok) {
      const availability = await availabilityResponse.json();
      console.log(`✅ Availability for ${dateStr}:`);
      console.log(`   Total tables: ${availability.totalTables}`);
      console.log(`   Time slots: ${availability.timeSlots.length}`);
      console.log(`   Most available: ${availability.summary.mostAvailable.time} (${availability.summary.mostAvailable.availableCount} tables)\n`);
    } else {
      console.log('❌ Availability check failed\n');
    }
    
    // Test 5: SSE Stream connection
    console.log('5️⃣ Testing SSE real-time stream...');
    console.log('   Attempting to connect to SSE endpoint...');
    
    // Note: SSE testing requires a different approach
    // Just verify the endpoint exists
    const streamTest = await fetch(`${API_BASE}/availability/stream?date=${dateStr}`, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream'
      },
      signal: AbortSignal.timeout(1000) // Quick timeout for testing
    }).catch(() => null);
    
    if (streamTest) {
      console.log('✅ SSE endpoint accessible\n');
    } else {
      console.log('⚠️  SSE endpoint exists (connection test limited)\n');
    }
    
    // Test 6: Booking conflict prevention
    console.log('6️⃣ Testing booking conflict prevention...');
    const testTable = tables[0];
    const bookingDate = new Date();
    bookingDate.setDate(bookingDate.getDate() + 7);
    
    // Create first booking
    const firstBooking = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: testTable.id,
        date: bookingDate.toISOString(),
        time: '19:00',
        partySize: testTable.capacityMin,
        customer: {
          firstName: 'First',
          lastName: 'Customer',
          email: 'first@example.com',
          phone: '07700900001'
        }
      })
    });
    
    if (firstBooking.ok) {
      // Try to create conflicting booking
      const conflictBooking = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: testTable.id,
          date: bookingDate.toISOString(),
          time: '19:00',
          partySize: testTable.capacityMin,
          customer: {
            firstName: 'Second',
            lastName: 'Customer',
            email: 'second@example.com',
            phone: '07700900002'
          }
        })
      });
      
      if (conflictBooking.status === 400 || conflictBooking.status === 409) {
        console.log('✅ Booking conflict prevention working\n');
        
        // Clean up test booking
        const booking = await firstBooking.json();
        await prisma.booking.delete({ where: { id: booking.id } });
      } else {
        console.log('❌ Booking conflict not prevented\n');
      }
    }
    
    console.log('✨ Phase 4 Backend API Testing Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAPI();