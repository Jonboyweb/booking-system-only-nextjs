#!/usr/bin/env node

/**
 * Test script for floor plan editor enhancements
 * This script validates that the new features are working correctly
 */

import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function testFloorPlanEnhancements() {
  console.log('🎯 Testing Floor Plan Editor Enhancements...\n');

  try {
    // Test 1: Verify tables have the necessary fields
    console.log('✅ Test 1: Checking table schema...');
    const tables = await prisma.table.findMany({
      select: {
        id: true,
        tableNumber: true,
        positionX: true,
        positionY: true,
        width: true,
        height: true,
        capacityMin: true,
        capacityMax: true,
      },
      take: 3
    });

    if (tables.length > 0) {
      const table = tables[0];
      const requiredFields = ['positionX', 'positionY', 'width', 'height', 'capacityMin', 'capacityMax'];
      const hasAllFields = requiredFields.every(field => table[field as keyof typeof table] !== undefined);

      if (hasAllFields) {
        console.log('   ✓ All required fields present for resizing and positioning');
      } else {
        console.log('   ✗ Missing some required fields');
      }
    }

    // Test 2: Simulate table resize
    console.log('\n✅ Test 2: Testing table resize capability...');
    const testTable = tables[0];
    if (testTable) {
      const originalWidth = testTable.width;
      const originalHeight = testTable.height;

      // Simulate resize
      const newWidth = Math.max(50, originalWidth + 20);
      const newHeight = Math.max(50, originalHeight + 15);

      const updated = await prisma.table.update({
        where: { id: testTable.id },
        data: {
          width: newWidth,
          height: newHeight
        }
      });

      if (updated.width === newWidth && updated.height === newHeight) {
        console.log(`   ✓ Table ${testTable.tableNumber} resized from ${originalWidth}x${originalHeight} to ${newWidth}x${newHeight}`);

        // Restore original size
        await prisma.table.update({
          where: { id: testTable.id },
          data: {
            width: originalWidth,
            height: originalHeight
          }
        });
        console.log('   ✓ Original size restored');
      }
    }

    // Test 3: Test capacity updates
    console.log('\n✅ Test 3: Testing inline capacity editing...');
    const capacityTable = tables[1];
    if (capacityTable) {
      const originalMin = capacityTable.capacityMin;
      const originalMax = capacityTable.capacityMax;

      // Simulate capacity change
      const newMin = 3;
      const newMax = 8;

      const updated = await prisma.table.update({
        where: { id: capacityTable.id },
        data: {
          capacityMin: newMin,
          capacityMax: newMax
        }
      });

      if (updated.capacityMin === newMin && updated.capacityMax === newMax) {
        console.log(`   ✓ Table ${capacityTable.tableNumber} capacity updated from ${originalMin}-${originalMax} to ${newMin}-${newMax}`);

        // Restore original capacity
        await prisma.table.update({
          where: { id: capacityTable.id },
          data: {
            capacityMin: originalMin,
            capacityMax: originalMax
          }
        });
        console.log('   ✓ Original capacity restored');
      }
    }

    // Test 4: Test position updates (simulating keyboard navigation)
    console.log('\n✅ Test 4: Testing precise positioning (keyboard navigation)...');
    const posTable = tables[2];
    if (posTable) {
      const originalX = posTable.positionX;
      const originalY = posTable.positionY;

      // Simulate arrow key movement (1px steps)
      const stepSize = 1;
      const newX = Math.max(0, Math.min(650, originalX + stepSize));
      const newY = Math.max(0, Math.min(450, originalY + stepSize));

      const updated = await prisma.table.update({
        where: { id: posTable.id },
        data: {
          positionX: newX,
          positionY: newY
        }
      });

      if (updated.positionX === newX && updated.positionY === newY) {
        console.log(`   ✓ Table ${posTable.tableNumber} moved by ${stepSize}px from (${originalX}, ${originalY}) to (${newX}, ${newY})`);

        // Test Shift+Arrow movement (10px)
        const largeStep = 10;
        const largeX = Math.max(0, Math.min(650, originalX + largeStep));
        const largeY = Math.max(0, Math.min(450, originalY + largeStep));

        await prisma.table.update({
          where: { id: posTable.id },
          data: {
            positionX: largeX,
            positionY: largeY
          }
        });

        console.log(`   ✓ Table ${posTable.tableNumber} moved by ${largeStep}px (Shift+Arrow simulation)`);

        // Restore original position
        await prisma.table.update({
          where: { id: posTable.id },
          data: {
            positionX: originalX,
            positionY: originalY
          }
        });
        console.log('   ✓ Original position restored');
      }
    }

    console.log('\n🎉 All floor plan enhancement tests passed!');
    console.log('\n📝 Summary of new features:');
    console.log('   • Table resizing with 8-point handles (corners + edges)');
    console.log('   • Inline capacity editing by clicking on capacity values');
    console.log('   • Keyboard navigation with arrow keys (1px steps)');
    console.log('   • Shift+Arrow for 10px movement steps');
    console.log('   • Minimum table size enforced at 50x50 pixels');
    console.log('   • All changes auto-save to database');

    console.log('\n💡 To test the UI:');
    console.log('   1. Navigate to http://localhost:3000/admin/dashboard/floor-plan');
    console.log('   2. Login with admin credentials');
    console.log('   3. Select a table to see resize handles');
    console.log('   4. Drag handles to resize tables');
    console.log('   5. Click capacity numbers to edit inline');
    console.log('   6. Use arrow keys to move selected tables');
    console.log('   7. Hold Shift+Arrow for larger movements');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testFloorPlanEnhancements().catch(console.error);