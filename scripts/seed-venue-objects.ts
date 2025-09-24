import { db } from '../lib/db';

async function seedVenueObjects() {
  try {
    console.log('Seeding venue objects...');

    // Sample venue objects for UPSTAIRS
    const upstairsObjects = [
      {
        type: 'BAR' as const,
        description: 'Main Bar',
        floor: 'UPSTAIRS' as const,
        positionX: 50,
        positionY: 10,
        width: 250,
        height: 40,
      },
      {
        type: 'DJ_BOOTH' as const,
        description: 'DJ Station',
        floor: 'UPSTAIRS' as const,
        positionX: 525,
        positionY: 10,
        width: 100,
        height: 50,
      },
      {
        type: 'DANCE_FLOOR' as const,
        description: 'Dance Floor',
        floor: 'UPSTAIRS' as const,
        positionX: 225,
        positionY: 280,
        width: 200,
        height: 150,
      },
      {
        type: 'EXIT' as const,
        description: 'Fire Exit',
        floor: 'UPSTAIRS' as const,
        positionX: 10,
        positionY: 400,
        width: 30,
        height: 40,
      },
      {
        type: 'STAIRCASE' as const,
        description: 'To Downstairs',
        floor: 'UPSTAIRS' as const,
        positionX: 600,
        positionY: 380,
        width: 40,
        height: 60,
      },
      {
        type: 'TOILETS' as const,
        description: 'Restrooms',
        floor: 'UPSTAIRS' as const,
        positionX: 10,
        positionY: 100,
        width: 30,
        height: 60,
      },
    ];

    // Sample venue objects for DOWNSTAIRS
    const downstairsObjects = [
      {
        type: 'BAR' as const,
        description: 'Speakeasy Bar',
        floor: 'DOWNSTAIRS' as const,
        positionX: 50,
        positionY: 10,
        width: 200,
        height: 40,
      },
      {
        type: 'PARTITION' as const,
        description: 'VIP Section',
        floor: 'DOWNSTAIRS' as const,
        positionX: 400,
        positionY: 100,
        width: 5,
        height: 200,
      },
      {
        type: 'EXIT' as const,
        description: 'Emergency Exit',
        floor: 'DOWNSTAIRS' as const,
        positionX: 10,
        positionY: 400,
        width: 30,
        height: 40,
      },
      {
        type: 'STAIRCASE' as const,
        description: 'To Upstairs',
        floor: 'DOWNSTAIRS' as const,
        positionX: 600,
        positionY: 380,
        width: 40,
        height: 60,
      },
      {
        type: 'TOILETS' as const,
        description: 'Restrooms',
        floor: 'DOWNSTAIRS' as const,
        positionX: 10,
        positionY: 100,
        width: 30,
        height: 60,
      },
      {
        type: 'CUSTOM' as const,
        description: 'Photo Booth',
        floor: 'DOWNSTAIRS' as const,
        positionX: 550,
        positionY: 50,
        width: 80,
        height: 80,
        color: '#8B4513',
      },
    ];

    // Clear existing venue objects
    await db.venueObject.deleteMany();
    console.log('Cleared existing venue objects');

    // Create all venue objects
    const allObjects = [...upstairsObjects, ...downstairsObjects];

    for (const obj of allObjects) {
      await db.venueObject.create({
        data: obj
      });
      console.log(`Created ${obj.type}: ${obj.description} on ${obj.floor}`);
    }

    console.log(`Successfully created ${allObjects.length} venue objects`);

    // Verify creation
    const count = await db.venueObject.count();
    console.log(`Total venue objects in database: ${count}`);

  } catch (error) {
    console.error('Error seeding venue objects:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

seedVenueObjects();