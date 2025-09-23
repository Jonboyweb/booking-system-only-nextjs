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
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'month';
    
    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    
    switch (range) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'quarter':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Revenue calculations
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const weekStart = new Date();
    weekStart.setDate(now.getDate() - 7);
    
    const monthStart = new Date();
    monthStart.setDate(now.getDate() - 30);

    const [todayRevenue, weekRevenue, monthRevenue, totalRevenue] = await Promise.all([
      db.booking.aggregate({
        where: {
          bookingDate: { gte: todayStart },
          status: 'CONFIRMED',
          depositPaid: true
        },
        _sum: { depositAmount: true }
      }),
      db.booking.aggregate({
        where: {
          bookingDate: { gte: weekStart },
          status: 'CONFIRMED',
          depositPaid: true
        },
        _sum: { depositAmount: true }
      }),
      db.booking.aggregate({
        where: {
          bookingDate: { gte: monthStart },
          status: 'CONFIRMED',
          depositPaid: true
        },
        _sum: { depositAmount: true }
      }),
      db.booking.aggregate({
        where: {
          status: 'CONFIRMED',
          depositPaid: true
        },
        _sum: { depositAmount: true }
      })
    ]);

    // Booking status counts
    const [total, confirmed, pending, cancelled, noShow] = await Promise.all([
      db.booking.count({ where: { bookingDate: { gte: startDate } } }),
      db.booking.count({ where: { bookingDate: { gte: startDate }, status: 'CONFIRMED' } }),
      db.booking.count({ where: { bookingDate: { gte: startDate }, status: 'PENDING' } }),
      db.booking.count({ where: { bookingDate: { gte: startDate }, status: 'CANCELLED' } }),
      db.booking.count({ where: { bookingDate: { gte: startDate }, status: 'NO_SHOW' } })
    ]);

    // Table performance
    const tableBookings = await db.booking.groupBy({
      by: ['tableId'],
      where: {
        bookingDate: { gte: startDate },
        status: 'CONFIRMED'
      },
      _count: { tableId: true },
      _sum: { depositAmount: true }
    });

    const tables = await Promise.all(
      tableBookings.map(async (tb) => {
        const table = await db.table.findUnique({
          where: { id: tb.tableId }
        });
        return {
          tableNumber: table?.tableNumber || 0,
          floor: table?.floor || '',
          bookingCount: tb._count.tableId,
          revenue: Number(tb._sum.depositAmount || 0)
        };
      })
    );

    // Package performance
    const packageBookings = await db.booking.groupBy({
      by: ['drinkPackageId'],
      where: {
        bookingDate: { gte: startDate },
        status: 'CONFIRMED',
        drinkPackageId: { not: null }
      },
      _count: { drinkPackageId: true }
    });

    const packages = await Promise.all(
      packageBookings.map(async (pb) => {
        if (!pb.drinkPackageId) return null;
        const pkg = await db.drinkPackage.findUnique({
          where: { id: pb.drinkPackageId }
        });
        return {
          name: pkg?.name || '',
          count: pb._count.drinkPackageId,
          revenue: Number(pkg?.price || 0) * pb._count.drinkPackageId
        };
      })
    );

    // Peak times
    const timeBookings = await db.booking.groupBy({
      by: ['bookingTime'],
      where: {
        bookingDate: { gte: startDate }
      },
      _count: { bookingTime: true },
      orderBy: {
        _count: { bookingTime: 'desc' }
      },
      take: 6
    });

    const peakTimes = timeBookings.map(tb => ({
      time: tb.bookingTime,
      count: tb._count.bookingTime
    }));

    // Daily bookings for chart
    const bookings = await db.booking.findMany({
      where: {
        bookingDate: { gte: startDate }
      },
      select: {
        bookingDate: true
      }
    });

    const dailyCounts = bookings.reduce((acc, booking) => {
      const date = booking.bookingDate.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dailyBookings = Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      revenue: {
        today: Number(todayRevenue._sum.depositAmount || 0),
        week: Number(weekRevenue._sum.depositAmount || 0),
        month: Number(monthRevenue._sum.depositAmount || 0),
        total: Number(totalRevenue._sum.depositAmount || 0)
      },
      bookings: {
        total,
        confirmed,
        pending,
        cancelled,
        noShow
      },
      tables: tables.sort((a, b) => b.revenue - a.revenue),
      packages: packages.filter(p => p !== null).sort((a, b) => b!.revenue - a!.revenue),
      peakTimes,
      dailyBookings
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}