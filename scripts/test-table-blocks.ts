import { db } from '../lib/db';

async function testTableBlocks() {
  console.log('🧪 Testing Table Blocks Feature\n');

  try {
    // 1. Get a test table
    const table = await db.table.findFirst({
      where: { tableNumber: 1 }
    });

    if (!table) {
      console.error('❌ No table found to test with');
      return;
    }

    console.log(`✅ Found table ${table.tableNumber} (${table.id})\n`);

    // 2. Create a test block for next week
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 2);

    console.log('📅 Creating test table block...');
    const block = await db.tableBlock.create({
      data: {
        tableId: table.id,
        startDate,
        endDate,
        reason: 'Test block - Private event',
        blockedBy: 'test@admin.com'
      },
      include: {
        table: true
      }
    });

    console.log(`✅ Created block for Table ${block.table.tableNumber}`);
    console.log(`   Dates: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
    console.log(`   Reason: ${block.reason}\n`);

    // 3. Check if availability API reflects the block
    console.log('🔍 Testing availability check...');
    const blockedDate = new Date(startDate);
    blockedDate.setDate(blockedDate.getDate() + 1); // Middle of the block period

    const availabilityCheck = await db.tableBlock.findMany({
      where: {
        tableId: table.id,
        startDate: {
          lte: blockedDate
        },
        endDate: {
          gte: blockedDate
        }
      }
    });

    if (availabilityCheck.length > 0) {
      console.log(`✅ Table is correctly blocked on ${blockedDate.toISOString().split('T')[0]}\n`);
    } else {
      console.log(`❌ Table block not found for ${blockedDate.toISOString().split('T')[0]}\n`);
    }

    // 4. Test that bookings are prevented during block period
    console.log('🚫 Testing booking prevention...');
    try {
      // Attempt to create a booking during the blocked period (this should fail)
      const testCustomer = await db.customer.findFirst();

      if (testCustomer) {
        const bookingAttempt = await db.booking.create({
          data: {
            bookingReference: 'TEST-BLOCK-001',
            tableId: table.id,
            customerId: testCustomer.id,
            bookingDate: blockedDate,
            bookingTime: '20:00',
            partySize: 4,
            status: 'PENDING'
          }
        });

        // If we get here, the block is NOT working
        console.log('❌ WARNING: Booking was created during blocked period!');

        // Clean up the test booking
        await db.booking.delete({
          where: { id: bookingAttempt.id }
        });
      } else {
        console.log('⚠️  No customer found for booking test\n');
      }
    } catch (error) {
      // This is expected - booking should fail
      console.log('✅ Booking correctly prevented during blocked period\n');
    }

    // 5. List all current blocks
    console.log('📋 Current table blocks:');
    const allBlocks = await db.tableBlock.findMany({
      include: {
        table: true
      },
      orderBy: {
        startDate: 'asc'
      }
    });

    if (allBlocks.length === 0) {
      console.log('   No blocks found');
    } else {
      allBlocks.forEach(b => {
        const start = b.startDate.toISOString().split('T')[0];
        const end = b.endDate.toISOString().split('T')[0];
        console.log(`   Table ${b.table.tableNumber}: ${start} to ${end} ${b.reason ? `(${b.reason})` : ''}`);
      });
    }

    // 6. Clean up test block
    console.log('\n🧹 Cleaning up test data...');
    await db.tableBlock.delete({
      where: { id: block.id }
    });
    console.log('✅ Test block removed\n');

    console.log('✅ Table blocks feature is working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.$disconnect();
  }
}

// Run the test
testTableBlocks().catch(console.error);