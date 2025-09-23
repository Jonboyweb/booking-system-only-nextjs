import { db } from '../lib/db';


async function checkTable7Bookings() {
  console.log('Checking all Table 7 bookings for September 28, 2025...\n');
  
  try {
    // Get table 7
    const table7 = await db.table.findFirst({
      where: { tableNumber: 7 }
    });
    
    if (!table7) {
      console.error('Table 7 not found!');
      return;
    }
    
    // Get ALL bookings for table 7 on September 28
    const sept28Date = new Date('2025-09-28');
    
    const bookings = await db.booking.findMany({
      where: {
        tableId: table7.id,
        bookingDate: sept28Date
      },
      include: {
        customer: true,
        table: true
      },
      orderBy: {
        bookingTime: 'asc'
      }
    });
    
    console.log(`Found ${bookings.length} booking(s) for Table 7 on September 28, 2025:\n`);
    
    bookings.forEach(booking => {
      console.log(`Time: ${booking.bookingTime}`);
      console.log(`Status: ${booking.status}`);
      console.log(`Customer: ${booking.customer.firstName} ${booking.customer.lastName} (${booking.customer.email})`);
      console.log(`Party Size: ${booking.partySize}`);
      console.log(`Reference: ${booking.bookingReference}`);
      console.log(`Deposit Paid: ${booking.depositPaid}`);
      console.log(`Created: ${booking.createdAt}`);
      console.log('---');
    });
    
    // Check specifically for CONFIRMED bookings at 22:30
    const confirmedAt2230 = bookings.filter(b => 
      b.bookingTime === '22:30' && 
      b.status === 'CONFIRMED'
    );
    
    if (confirmedAt2230.length > 0) {
      console.log('\n⚠️  CONFIRMED booking exists at 22:30:');
      confirmedAt2230.forEach(b => {
        console.log(`  - ${b.bookingReference}: ${b.customer.email}`);
      });
    } else {
      console.log('\n✅ No CONFIRMED bookings at 22:30');
      
      const cancelledAt2230 = bookings.filter(b => 
        b.bookingTime === '22:30' && 
        b.status === 'CANCELLED'
      );
      
      if (cancelledAt2230.length > 0) {
        console.log('\n❌ CANCELLED bookings at 22:30:');
        cancelledAt2230.forEach(b => {
          console.log(`  - ${b.bookingReference}: ${b.customer.email} (cancelled)`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.$disconnect();
  }
}

checkTable7Bookings();