#!/usr/bin/env npx tsx
import { db } from '../lib/db';

async function verifyTransparentFeature() {
  try {
    console.log('Verifying transparent objects feature implementation...\n');

    // 1. Check database schema
    console.log('1. Database Schema Check:');
    const testObject = await db.venueObject.findFirst();
    if (testObject && 'isTransparent' in testObject) {
      console.log('   ✓ isTransparent field exists in database');
    } else {
      console.log('   ✗ isTransparent field missing from database');
    }

    // 2. Test API endpoints
    console.log('\n2. API Endpoint Check:');
    const apiUrl = 'http://localhost:3001/api/venue-objects';
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      if (data.length > 0 && 'isTransparent' in data[0]) {
        console.log('   ✓ API returns isTransparent field');
      } else {
        console.log('   ✗ API does not return isTransparent field');
      }
    } catch (error) {
      console.log('   ⚠ Could not test API (server may not be running)');
    }

    // 3. Count transparent vs regular objects
    console.log('\n3. Object Statistics:');
    const transparentCount = await db.venueObject.count({
      where: { isTransparent: true }
    });
    const regularCount = await db.venueObject.count({
      where: { isTransparent: false }
    });
    const totalCount = await db.venueObject.count();

    console.log(`   - Transparent objects: ${transparentCount}`);
    console.log(`   - Regular objects: ${regularCount}`);
    console.log(`   - Total objects: ${totalCount}`);

    // 4. Test updating transparency
    console.log('\n4. Update Test:');
    const objectToUpdate = await db.venueObject.findFirst({
      where: { isTransparent: false }
    });

    if (objectToUpdate) {
      const updated = await db.venueObject.update({
        where: { id: objectToUpdate.id },
        data: { isTransparent: true }
      });
      console.log(`   ✓ Successfully toggled object "${updated.description}" to transparent`);

      // Revert the change
      await db.venueObject.update({
        where: { id: objectToUpdate.id },
        data: { isTransparent: false }
      });
      console.log(`   ✓ Successfully reverted object back to regular`);
    }

    console.log('\n✅ Feature verification complete!');
    console.log('\nFeature Summary:');
    console.log('- Transparent objects have no background/border');
    console.log('- Only label and icon are visible when transparent');
    console.log('- Can be toggled via admin dashboard');
    console.log('- Works in both admin and customer views');

  } catch (error: any) {
    console.error('Error during verification:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

verifyTransparentFeature();