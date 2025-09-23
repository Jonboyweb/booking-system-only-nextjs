import { db } from '../lib/db';


async function testTableAvailability() {
  console.log('Testing Table 7 availability for September 28, 2025 at 22:30...\n');
  
  try {
    // Test date and time
    const testDate = new Date('2025-09-28');
    const testTime = '22:30';
    const tableNumber = 7;
    
    // 1. Check if table 7 exists
    const table7 = await db.table.findFirst({
      where: { tableNumber: tableNumber }
    });
    
    if (!table7) {
      console.error('❌ Table 7 not found in database!');
      return;
    }
    
    console.log('✅ Table 7 found:', {
      id: table7.id,
      tableNumber: table7.tableNumber,
      capacity: `${table7.capacityMin}-${table7.capacityMax}`
    });
    
    // 2. Check existing bookings for this date/time
    console.log('\n📅 Checking bookings for September 28, 2025 at 22:30...');
    
    const existingBookings = await db.booking.findMany({
      where: {
        bookingDate: testDate,
        bookingTime: testTime,
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      },
      include: {
        table: true,
        customer: true
      }
    });
    
    console.log(`\nFound ${existingBookings.length} booking(s) for this date/time:`);
    
    existingBookings.forEach(booking => {
      console.log(`- Table ${booking.table.tableNumber}: ${booking.customer.firstName} ${booking.customer.lastName} (${booking.status})`);
    });
    
    // 3. Check specifically for table 7
    const table7Booking = existingBookings.find(b => b.table.tableNumber === tableNumber);
    
    if (table7Booking) {
      console.log(`\n⚠️  Table 7 is BOOKED:`);
      console.log(`   - Booking ID: ${table7Booking.id}`);
      console.log(`   - Reference: ${table7Booking.bookingReference}`);
      console.log(`   - Customer: ${table7Booking.customer.firstName} ${table7Booking.customer.lastName}`);
      console.log(`   - Party Size: ${table7Booking.partySize}`);
      console.log(`   - Status: ${table7Booking.status}`);
    } else {
      console.log(`\n✅ Table 7 is AVAILABLE for this time slot`);
    }
    
    // 4. Test the availability API endpoint logic
    console.log('\n🔍 Testing availability check logic...');
    
    const bookedTableNumbers = existingBookings.map(booking => booking.table.tableNumber);
    console.log('Booked table numbers:', bookedTableNumbers.length > 0 ? bookedTableNumbers : 'None');
    
    // 5. Check all bookings for debugging
    console.log('\n📊 All bookings in database:');
    const allBookings = await db.booking.findMany({
      include: {
        table: true,
        customer: true
      },
      orderBy: {
        bookingDate: 'desc'
      },
      take: 10
    });
    
    allBookings.forEach(booking => {
      const date = booking.bookingDate.toISOString().split('T')[0];
      console.log(`- ${date} ${booking.bookingTime} | Table ${booking.table.tableNumber} | ${booking.customer.email} | ${booking.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error testing availability:', error);
  } finally {
    await db.$disconnect();
  }
}

testTableAvailability();