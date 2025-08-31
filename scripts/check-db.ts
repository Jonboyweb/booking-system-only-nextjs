#!/usr/bin/env tsx

import { prisma } from '../lib/prisma';

async function checkDatabase() {
  console.log('🔍 Checking database status...\n');
  
  try {
    // Check connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Count records in each table
    const [
      tablesCount,
      customersCount,
      bookingsCount,
      drinkPackagesCount,
      spiritsCount,
      champagnesCount,
    ] = await Promise.all([
      prisma.table.count(),
      prisma.customer.count(),
      prisma.booking.count(),
      prisma.drinkPackage.count(),
      prisma.spirit.count(),
      prisma.champagne.count(),
    ]);
    
    // Get table details
    const tables = await prisma.table.findMany({
      orderBy: { tableNumber: 'asc' },
    });
    
    const upstairsTables = tables.filter(t => t.floor === 'UPSTAIRS');
    const downstairsTables = tables.filter(t => t.floor === 'DOWNSTAIRS');
    const vipTables = tables.filter(t => t.isVip);
    
    console.log('\n📊 Database Statistics:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Tables:          ${tablesCount} total`);
    console.log(`  ├─ Upstairs:   ${upstairsTables.length}`);
    console.log(`  ├─ Downstairs: ${downstairsTables.length}`);
    console.log(`  └─ VIP:        ${vipTables.length}`);
    console.log(`Customers:       ${customersCount}`);
    console.log(`Bookings:        ${bookingsCount}`);
    console.log(`Drink Packages:  ${drinkPackagesCount}`);
    console.log(`Spirits:         ${spiritsCount}`);
    console.log(`Champagnes:      ${champagnesCount}`);
    
    // Show VIP tables
    if (vipTables.length > 0) {
      console.log('\n🌟 VIP Tables:');
      vipTables.forEach(table => {
        console.log(`  Table ${table.tableNumber}: ${table.description} (Capacity: ${table.capacityMin}-${table.capacityMax})`);
      });
    }
    
    // Show combinable tables
    const combinableTables = tables.filter(t => t.canCombineWith.length > 0);
    if (combinableTables.length > 0) {
      console.log('\n🔗 Combinable Tables:');
      combinableTables.forEach(table => {
        console.log(`  Table ${table.tableNumber} can combine with: ${table.canCombineWith.join(', ')}`);
      });
    }
    
    console.log('\n✅ Database check complete!');
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();