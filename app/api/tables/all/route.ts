import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    // Get ALL tables (including inactive) for display purposes
    const allTables = await db.table.findMany({
      orderBy: {
        tableNumber: 'asc'
      }
    });

    // If date is provided, also get blocked tables for that date
    let blockedTableIds: string[] = [];
    if (date) {
      const bookingDate = new Date(date);
      const tableBlocks = await db.tableBlock.findMany({
        where: {
          startDate: {
            lte: bookingDate
          },
          endDate: {
            gte: bookingDate
          }
        }
      });
      blockedTableIds = tableBlocks.map(tb => tb.tableId);
    }

    // Add availability status to each table
    const tablesWithStatus = allTables.map(table => ({
      ...table,
      isAvailable: table.isActive && !blockedTableIds.includes(table.id),
      isBlocked: blockedTableIds.includes(table.id)
    }));

    return NextResponse.json(tablesWithStatus);
  } catch (error) {
    console.error('Error fetching all tables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tables' },
      { status: 500 }
    );
  }
}