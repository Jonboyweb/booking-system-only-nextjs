import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tableNumbers, date, time, partySize } = body;
    
    if (!tableNumbers || tableNumbers.length !== 2) {
      return NextResponse.json(
        { error: 'Exactly two table numbers required' },
        { status: 400 }
      );
    }
    
    // Get the tables
    const tables = await prisma.table.findMany({
      where: {
        tableNumber: {
          in: tableNumbers
        }
      }
    });
    
    if (tables.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid table numbers' },
        { status: 404 }
      );
    }
    
    const [table1, table2] = tables;
    
    // Check if tables can be combined
    const canCombine = 
      table1.canCombineWith.includes(table2.tableNumber) &&
      table2.canCombineWith.includes(table1.tableNumber);
    
    if (!canCombine) {
      return NextResponse.json(
        { error: 'These tables cannot be combined' },
        { status: 400 }
      );
    }
    
    // Check combined capacity
    const combinedMinCapacity = Math.min(table1.capacityMin, table2.capacityMin);
    const combinedMaxCapacity = table1.capacityMax + table2.capacityMax;
    
    if (partySize && (partySize < combinedMinCapacity || partySize > combinedMaxCapacity)) {
      return NextResponse.json(
        { error: `Combined tables support ${combinedMinCapacity}-${combinedMaxCapacity} guests` },
        { status: 400 }
      );
    }
    
    // Check availability if date and time provided
    if (date && time) {
      const bookingDate = new Date(date);
      const bookings = await prisma.booking.findMany({
        where: {
          bookingDate,
          bookingTime: time,
          status: {
            in: ['PENDING', 'CONFIRMED']
          },
          tableId: {
            in: tables.map(t => t.id)
          }
        }
      });
      
      if (bookings.length > 0) {
        return NextResponse.json(
          { error: 'One or both tables are already booked for this time' },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json({
      canCombine: true,
      tables: tables.map(t => ({
        id: t.id,
        tableNumber: t.tableNumber,
        floor: t.floor,
        description: t.description
      })),
      combinedCapacity: {
        min: combinedMinCapacity,
        max: combinedMaxCapacity
      },
      description: `Combined tables ${table1.tableNumber} & ${table2.tableNumber}`
    });
  } catch (error) {
    console.error('Table combination check failed:', error);
    return NextResponse.json(
      { error: 'Failed to check table combination' },
      { status: 500 }
    );
  }
}