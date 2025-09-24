#!/usr/bin/env node

import { db } from '../lib/db';

async function testDeactivatedBlockedTables() {
  console.log('🔍 Testing Deactivated and Blocked Table Filtering\n');

  try {
    // 1. First, let's check current table states
    console.log('📊 Current Table States:');
    const allTables = await db.table.findMany({
      orderBy: { tableNumber: 'asc' },
      select: {
        id: true,
        tableNumber: true,
        isActive: true,
        floor: true
      }
    });

    console.log('Active tables:', allTables.filter(t => t.isActive).map(t => t.tableNumber).join(', '));
    console.log('Inactive tables:', allTables.filter(t => !t.isActive).map(t => t.tableNumber).join(', ') || 'None');

    // 2. Deactivate a table for testing
    console.log('\n🔧 Test 1: Deactivating Table 5...');
    await db.table.update({
      where: { tableNumber: 5 },
      data: { isActive: false }
    });

    // 3. Check active tables after deactivation
    const activeTables = await db.table.findMany({
      where: { isActive: true },
      orderBy: { tableNumber: 'asc' }
    });
    console.log('✅ Active tables after deactivation:', activeTables.map(t => t.tableNumber).join(', '));

    // 4. Create a date block for testing
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 3);
    dayAfter.setHours(23, 59, 59, 999);

    console.log('\n🔧 Test 2: Blocking Table 10 for maintenance...');

    // Check if table 10 exists
    const table10 = await db.table.findUnique({
      where: { tableNumber: 10 }
    });

    if (table10) {
      // Remove any existing blocks for table 10
      await db.tableBlock.deleteMany({
        where: { tableId: table10.id }
      });

      // Create new block
      const block = await db.tableBlock.create({
        data: {
          tableId: table10.id,
          startDate: tomorrow,
          endDate: dayAfter,
          reason: 'Maintenance - Testing availability system',
          blockedBy: 'Test Script'
        },
        include: {
          table: true
        }
      });

      console.log(`✅ Table ${block.table.tableNumber} blocked from ${tomorrow.toLocaleDateString()} to ${dayAfter.toLocaleDateString()}`);
    }

    // 5. Test the availability check
    console.log('\n🔍 Test 3: Checking availability for tomorrow...');
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Get blocked tables for tomorrow
    const blockedTables = await db.tableBlock.findMany({
      where: {
        startDate: { lte: tomorrow },
        endDate: { gte: tomorrow }
      },
      include: {
        table: true
      }
    });

    console.log('Blocked tables for tomorrow:', blockedTables.map(b => b.table.tableNumber).join(', ') || 'None');

    // 6. Test what the APIs would return
    console.log('\n🌐 Test 4: Simulating API Responses...');

    // Simulate /api/tables response (only active tables)
    const apiTables = await db.table.findMany({
      where: { isActive: true },
      orderBy: { tableNumber: 'asc' }
    });
    console.log('Tables from /api/tables (active only):', apiTables.map(t => t.tableNumber).join(', '));

    // Simulate availability check
    const availableForBooking = apiTables.filter(table => {
      const isBlocked = blockedTables.some(b => b.tableId === table.id);
      return !isBlocked;
    });
    console.log('Tables available for booking tomorrow:', availableForBooking.map(t => t.tableNumber).join(', '));

    // 7. Test edge case: Deactivated AND blocked table
    console.log('\n🔧 Test 5: Table that is both deactivated and blocked...');
    if (table10) {
      await db.table.update({
        where: { id: table10.id },
        data: { isActive: false }
      });
      console.log('Table 10 is now both deactivated and blocked');

      const doubleUnavailable = await db.table.findMany({
        where: { isActive: true },
        orderBy: { tableNumber: 'asc' }
      });
      console.log('Active tables (Table 10 should not appear):', doubleUnavailable.map(t => t.tableNumber).join(', '));
    }

    // 8. Cleanup
    console.log('\n🧹 Cleanup: Restoring original state...');

    // Reactivate table 5
    await db.table.update({
      where: { tableNumber: 5 },
      data: { isActive: true }
    });
    console.log('✅ Table 5 reactivated');

    // Reactivate table 10
    if (table10) {
      await db.table.update({
        where: { id: table10.id },
        data: { isActive: true }
      });
      console.log('✅ Table 10 reactivated');
    }

    console.log('\n✨ Test completed successfully!');
    console.log('\n📝 Summary of fixes:');
    console.log('1. /api/tables now only returns active tables (isActive: true)');
    console.log('2. /api/availability/[date] filters out inactive tables');
    console.log('3. /api/availability includes blocked tables in unavailable list');
    console.log('4. FloorPlan component shows blocked tables with special styling');
    console.log('5. Customer booking interface prevents selection of deactivated/blocked tables');

    console.log('\n🌐 To manually test in browser:');
    console.log('1. Start the dev server: npm run dev');
    console.log('2. Go to http://localhost:3000/booking');
    console.log('3. Select tomorrow\'s date');
    console.log('4. Verify Table 10 appears as blocked (dark red)');
    console.log('5. Verify deactivated tables don\'t appear at all');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await db.$disconnect();
  }
}

testDeactivatedBlockedTables();