import { db } from '../lib/db';

async function testVenueObjects() {
  try {
    console.log('Testing venue objects...\n');

    // Count all venue objects
    const count = await db.venueObject.count();
    console.log(`Total venue objects: ${count}\n`);

    // Fetch all venue objects
    const venueObjects = await db.venueObject.findMany({
      orderBy: [
        { floor: 'asc' },
        { type: 'asc' }
      ]
    });

    // Group by floor
    const upstairs = venueObjects.filter(o => o.floor === 'UPSTAIRS');
    const downstairs = venueObjects.filter(o => o.floor === 'DOWNSTAIRS');

    console.log('UPSTAIRS Objects:');
    console.log('=================');
    upstairs.forEach(obj => {
      console.log(`- ${obj.type}: "${obj.description}" at (${obj.positionX}, ${obj.positionY}) size: ${obj.width}x${obj.height}`);
    });

    console.log('\nDOWNSTAIRS Objects:');
    console.log('===================');
    downstairs.forEach(obj => {
      console.log(`- ${obj.type}: "${obj.description}" at (${obj.positionX}, ${obj.positionY}) size: ${obj.width}x${obj.height}${obj.color ? ` color: ${obj.color}` : ''}`);
    });

    console.log('\nObject Type Distribution:');
    console.log('========================');
    const typeCounts = venueObjects.reduce((acc, obj) => {
      acc[obj.type] = (acc[obj.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`${type}: ${count}`);
    });

  } catch (error) {
    console.error('Error testing venue objects:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

testVenueObjects();