import { db } from '../lib/db';

async function testFloorPlan() {
  console.log('Testing Floor Plan functionality...\n');

  try {
    // 1. Test fetching all tables with positions
    console.log('1. Fetching all tables with positions:');
    const tables = await db.table.findMany({
      orderBy: [
        { floor: 'asc' },
        { tableNumber: 'asc' }
      ],
      select: {
        id: true,
        tableNumber: true,
        floor: true,
        positionX: true,
        positionY: true,
        width: true,
        height: true,
        isVip: true,
        isActive: true
      }
    });

    console.log(`Found ${tables.length} tables`);

    // Show sample of tables with positions
    tables.slice(0, 3).forEach(table => {
      console.log(`  Table ${table.tableNumber}: Position(${table.positionX}, ${table.positionY}), Size(${table.width}x${table.height})`);
    });

    // 2. Test updating a table position
    console.log('\n2. Testing table position update:');
    const testTable = tables[0];
    const newX = testTable.positionX + 10;
    const newY = testTable.positionY + 10;

    const updatedTable = await db.table.update({
      where: { id: testTable.id },
      data: {
        positionX: newX,
        positionY: newY
      }
    });

    console.log(`  Updated Table ${testTable.tableNumber}: New position(${updatedTable.positionX}, ${updatedTable.positionY})`);

    // Restore original position
    await db.table.update({
      where: { id: testTable.id },
      data: {
        positionX: testTable.positionX,
        positionY: testTable.positionY
      }
    });
    console.log('  Position restored');

    // 3. Test creating a new table
    console.log('\n3. Testing new table creation:');
    const maxTableNumber = Math.max(...tables.map(t => t.tableNumber));
    const newTableNumber = maxTableNumber + 1;

    const newTable = await db.table.create({
      data: {
        tableNumber: newTableNumber,
        floor: 'UPSTAIRS',
        capacityMin: 2,
        capacityMax: 4,
        description: 'Test Table',
        features: ['Test Feature'],
        isVip: false,
        isActive: true,
        positionX: 400,
        positionY: 400,
        width: 80,
        height: 60
      }
    });

    console.log(`  Created Table ${newTable.tableNumber} at position(${newTable.positionX}, ${newTable.positionY})`);

    // 4. Test deleting the test table
    console.log('\n4. Testing table deletion:');
    await db.table.delete({
      where: { id: newTable.id }
    });
    console.log(`  Deleted Table ${newTableNumber}`);

    // 5. Verify floor distribution
    console.log('\n5. Floor distribution:');
    const upstairsTables = tables.filter(t => t.floor === 'UPSTAIRS');
    const downstairsTables = tables.filter(t => t.floor === 'DOWNSTAIRS');
    console.log(`  Upstairs: ${upstairsTables.length} tables`);
    console.log(`  Downstairs: ${downstairsTables.length} tables`);

    // 6. Check VIP and active status
    console.log('\n6. Table status summary:');
    const vipTables = tables.filter(t => t.isVip);
    const activeTables = tables.filter(t => t.isActive);
    console.log(`  VIP Tables: ${vipTables.length}`);
    console.log(`  Active Tables: ${activeTables.length}`);
    console.log(`  Inactive Tables: ${tables.length - activeTables.length}`);

    console.log('\n✅ All floor plan tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.$disconnect();
  }
}

testFloorPlan();