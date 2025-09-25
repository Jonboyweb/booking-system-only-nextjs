#!/usr/bin/env npx tsx
import { db } from '../lib/db';

async function addTransparentColumn() {
  try {
    console.log('Adding isTransparent column to venue_objects table...');

    // Execute raw SQL to add the column
    await db.$executeRaw`
      ALTER TABLE venue_objects
      ADD COLUMN IF NOT EXISTS "isTransparent" BOOLEAN DEFAULT false
    `;

    console.log('✓ Column added successfully');

    // Verify by fetching one record
    const objects = await db.venueObject.findFirst();
    console.log('✓ Schema updated and verified');

  } catch (error: any) {
    // Check if column already exists
    if (error.message?.includes('column "isTransparent" of relation "venue_objects" already exists')) {
      console.log('✓ Column already exists');
    } else {
      console.error('Error adding column:', error);
      process.exit(1);
    }
  } finally {
    await db.$disconnect();
  }
}

addTransparentColumn();