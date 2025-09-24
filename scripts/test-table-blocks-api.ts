import { db } from '../lib/db';

async function testTableBlocksAPI() {
  console.log('🧪 Testing Table Blocks API Feature\n');

  const baseUrl = 'http://localhost:3000';

  try {
    // 1. Get a test table
    const table = await db.table.findFirst({
      where: { tableNumber: 2 }
    });

    if (!table) {
      console.error('❌ No table found to test with');
      return;
    }

    console.log(`✅ Found table ${table.tableNumber} (${table.id})\n`);

    // 2. Create a test admin user or get existing
    let adminUser = await db.adminUser.findFirst({
      where: { email: 'admin@backroomleeds.co.uk' }
    });

    if (!adminUser) {
      console.log('❌ No admin user found. Please run: npx tsx scripts/seed-admin.ts');
      return;
    }

    // 3. Create a test block for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    console.log('📅 Creating test table block via database...');
    const block = await db.tableBlock.create({
      data: {
        tableId: table.id,
        startDate: tomorrow,
        endDate: dayAfter,
        reason: 'API Test - Maintenance',
        blockedBy: adminUser.email
      },
      include: {
        table: true
      }
    });

    console.log(`✅ Created block for Table ${block.table.tableNumber}`);
    console.log(`   Dates: ${tomorrow.toISOString().split('T')[0]} to ${dayAfter.toISOString().split('T')[0]}`);
    console.log(`   Reason: ${block.reason}\n`);

    // 4. Test availability API
    console.log('🔍 Testing availability API...');
    const availUrl = `${baseUrl}/api/availability/${tomorrow.toISOString().split('T')[0]}`;
    console.log(`   Fetching: ${availUrl}`);

    try {
      const availResponse = await fetch(availUrl);
      const availData = await availResponse.json();

      if (availData.totalBlocked > 0) {
        console.log(`✅ Availability API shows ${availData.totalBlocked} blocked table(s)`);
        console.log(`   Blocked tables:`, availData.tableBlocks);
      } else {
        console.log('❌ Availability API does not show blocked tables');
      }
    } catch (error) {
      console.log('⚠️  Could not test availability API (is the server running?)');
    }

    // 5. Test booking prevention via API
    console.log('\n🚫 Testing booking prevention via API...');
    const bookingData = {
      tableId: table.id,
      date: tomorrow.toISOString().split('T')[0],
      timeSlot: '20:00',
      partySize: 4,
      customer: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '07700900000'
      },
      drinkPackageId: null,
      specialRequests: 'Testing table blocks'
    };

    try {
      const bookingResponse = await fetch(`${baseUrl}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      const result = await bookingResponse.json();

      if (!bookingResponse.ok) {
        if (result.error && result.error.includes('not available')) {
          console.log(`✅ Booking correctly rejected: "${result.error}"`);
        } else {
          console.log(`⚠️  Booking rejected but with unexpected error: "${result.error}"`);
        }
      } else {
        console.log('❌ WARNING: Booking was accepted during blocked period!');
        // Clean up if booking was created
        if (result.data?.id) {
          await db.booking.delete({ where: { id: result.data.id } });
        }
      }
    } catch (error) {
      console.log('⚠️  Could not test booking API (is the server running?)');
    }

    // 6. Clean up test block
    console.log('\n🧹 Cleaning up test data...');
    await db.tableBlock.delete({
      where: { id: block.id }
    });
    console.log('✅ Test block removed\n');

    console.log('✅ Table blocks API feature testing complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.$disconnect();
  }
}

// Run the test
testTableBlocksAPI().catch(console.error);