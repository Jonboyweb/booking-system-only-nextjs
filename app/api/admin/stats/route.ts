import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { getAuthUser } from '@/src/middleware/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  // Check authentication
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Today's bookings
    const todayBookings = await prisma.booking.count({
      where: {
        bookingDate: {
          gte: startOfDay,
          lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    // This week's bookings
    const weekBookings = await prisma.booking.count({
      where: {
        bookingDate: {
          gte: startOfWeek
        }
      }
    });

    // This month's bookings
    const monthBookings = await prisma.booking.count({
      where: {
        bookingDate: {
          gte: startOfMonth
        }
      }
    });

    // Total revenue (confirmed bookings)
    const revenue = await prisma.booking.aggregate({
      where: {
        status: 'CONFIRMED',
        depositPaid: true
      },
      _sum: {
        depositAmount: true
      }
    });

    // Pending bookings
    const pendingBookings = await prisma.booking.count({
      where: { status: 'PENDING' }
    });

    // Confirmed bookings
    const confirmedBookings = await prisma.booking.count({
      where: { status: 'CONFIRMED' }
    });

    // Most popular table
    const popularTable = await prisma.booking.groupBy({
      by: ['tableId'],
      _count: {
        tableId: true
      },
      orderBy: {
        _count: {
          tableId: 'desc'
        }
      },
      take: 1
    });

    let popularTableName = 'N/A';
    if (popularTable.length > 0) {
      const table = await prisma.table.findUnique({
        where: { id: popularTable[0].tableId }
      });
      if (table) {
        popularTableName = `Table ${table.tableNumber}`;
      }
    }

    // Most popular package
    const popularPackage = await prisma.booking.groupBy({
      by: ['drinkPackageId'],
      where: {
        drinkPackageId: {
          not: null
        }
      },
      _count: {
        drinkPackageId: true
      },
      orderBy: {
        _count: {
          drinkPackageId: 'desc'
        }
      },
      take: 1
    });

    let popularPackageName = 'N/A';
    if (popularPackage.length > 0 && popularPackage[0].drinkPackageId) {
      const pkg = await prisma.drinkPackage.findUnique({
        where: { id: popularPackage[0].drinkPackageId }
      });
      if (pkg) {
        popularPackageName = pkg.name;
      }
    }

    return NextResponse.json({
      todayBookings,
      weekBookings,
      monthBookings,
      totalRevenue: Number(revenue._sum.depositAmount || 0),
      pendingBookings,
      confirmedBookings,
      popularTable: popularTableName,
      popularPackage: popularPackageName
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}