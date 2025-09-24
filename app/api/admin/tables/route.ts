import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/src/middleware/auth';

export async function GET(request: NextRequest) {
  // Check authentication
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tables = await db.table.findMany({
      orderBy: [
        { floor: 'asc' },
        { tableNumber: 'asc' }
      ]
    });

    return NextResponse.json(tables);
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tables' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Check authentication
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only admins can create tables
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.tableNumber || !body.floor || !body.capacityMin || !body.capacityMax || !body.description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if table number already exists
    const existing = await db.table.findUnique({
      where: { tableNumber: body.tableNumber }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Table number already exists' },
        { status: 400 }
      );
    }

    const newTable = await db.table.create({
      data: {
        tableNumber: body.tableNumber,
        floor: body.floor,
        capacityMin: body.capacityMin,
        capacityMax: body.capacityMax,
        description: body.description,
        features: body.features || [],
        isVip: body.isVip || false,
        canCombineWith: body.canCombineWith || [],
        isActive: body.isActive !== undefined ? body.isActive : true,
        positionX: body.positionX || 50,
        positionY: body.positionY || 50,
        width: body.width || 100,
        height: body.height || 80
      }
    });

    return NextResponse.json(newTable);
  } catch (error) {
    console.error('Error creating table:', error);
    return NextResponse.json(
      { error: 'Failed to create table' },
      { status: 500 }
    );
  }
}

// Bulk update for saving all positions at once
export async function PUT(request: NextRequest) {
  // Check authentication
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { tables } = await request.json();

    if (!Array.isArray(tables)) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    // Update all tables in a transaction
    const updates = await db.$transaction(
      tables.map(table =>
        db.table.update({
          where: { id: table.id },
          data: {
            positionX: table.positionX,
            positionY: table.positionY,
            width: table.width,
            height: table.height,
            updatedAt: new Date()
          }
        })
      )
    );

    return NextResponse.json({ success: true, updated: updates.length });
  } catch (error) {
    console.error('Error updating tables:', error);
    return NextResponse.json(
      { error: 'Failed to update tables' },
      { status: 500 }
    );
  }
}