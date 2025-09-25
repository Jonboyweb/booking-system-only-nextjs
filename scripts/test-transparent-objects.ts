#!/usr/bin/env npx tsx
import { db } from '../lib/db';

async function testTransparentObjects() {
  try {
    console.log('Testing transparent venue objects feature...\n');

    // Create a test transparent object
    const transparentObject = await db.venueObject.create({
      data: {
        type: 'BAR',
        description: 'Transparent Bar',
        floor: 'UPSTAIRS',
        positionX: 200,
        positionY: 100,
        width: 120,
        height: 60,
        isTransparent: true
      }
    });

    console.log('✓ Created transparent object:', transparentObject);

    // Create a regular (non-transparent) object for comparison
    const regularObject = await db.venueObject.create({
      data: {
        type: 'DJ_BOOTH',
        description: 'Regular DJ Booth',
        floor: 'UPSTAIRS',
        positionX: 400,
        positionY: 100,
        width: 100,
        height: 80,
        isTransparent: false
      }
    });

    console.log('✓ Created regular object:', regularObject);

    // Fetch all venue objects to verify
    const allObjects = await db.venueObject.findMany({
      where: { floor: 'UPSTAIRS' },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log('\nRecent venue objects on UPSTAIRS floor:');
    allObjects.forEach(obj => {
      console.log(`  - ${obj.description}: isTransparent=${obj.isTransparent}`);
    });

    console.log('\n✅ Test completed successfully!');
    console.log('\nYou can now:');
    console.log('1. Visit http://localhost:3001/admin/dashboard/floor-plan to see the objects in the admin view');
    console.log('2. Visit http://localhost:3001/booking to see them in the customer view');
    console.log('3. Edit the objects to toggle transparency on/off');

  } catch (error: any) {
    console.error('Error testing transparent objects:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

testTransparentObjects();