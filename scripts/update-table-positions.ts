import { db } from '../lib/db';

// Initial positions based on the existing FloorPlan component layout
const tablePositions: Record<number, { x: number; y: number; width: number; height: number }> = {
  // Upstairs tables
  10: { x: 50, y: 50, width: 120, height: 80 },
  2: { x: 200, y: 50, width: 100, height: 80 },
  3: { x: 350, y: 50, width: 100, height: 80 },
  4: { x: 500, y: 50, width: 100, height: 80 },
  5: { x: 50, y: 180, width: 100, height: 80 },
  6: { x: 200, y: 180, width: 100, height: 80 },
  7: { x: 350, y: 180, width: 100, height: 80 },
  8: { x: 500, y: 180, width: 100, height: 80 },
  9: { x: 50, y: 310, width: 120, height: 80 },
  1: { x: 450, y: 310, width: 150, height: 100 }, // VIP booth
  // Downstairs tables
  11: { x: 50, y: 50, width: 100, height: 80 },
  12: { x: 200, y: 50, width: 100, height: 80 },
  13: { x: 350, y: 50, width: 100, height: 80 },
  14: { x: 500, y: 50, width: 100, height: 80 },
  15: { x: 100, y: 180, width: 120, height: 80 },
  16: { x: 250, y: 180, width: 120, height: 80 },
};

async function updateTablePositions() {
  console.log('Updating table positions...');

  try {
    for (const [tableNumber, position] of Object.entries(tablePositions)) {
      await db.table.update({
        where: { tableNumber: parseInt(tableNumber) },
        data: {
          positionX: position.x,
          positionY: position.y,
          width: position.width,
          height: position.height
        }
      });
      console.log(`Updated table ${tableNumber} position`);
    }

    console.log('✅ All table positions updated successfully');
  } catch (error) {
    console.error('Error updating table positions:', error);
  } finally {
    await db.$disconnect();
  }
}

updateTablePositions();