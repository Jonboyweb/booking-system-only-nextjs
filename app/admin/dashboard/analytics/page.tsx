'use client';

import { useEffect, useState } from 'react';

interface Analytics {
  revenue: {
    today: number;
    week: number;
    month: number;
    total: number;
  };
  bookings: {
    total: number;
    confirmed: number;
    pending: number;
    cancelled: number;
    noShow: number;
  };
  tables: Array<{
    tableNumber: number;
    floor: string;
    bookingCount: number;
    revenue: number;
  }>;
  packages: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
  peakTimes: Array<{
    time: string;
    count: number;
  }>;
  dailyBookings: Array<{
    date: string;
    count: number;
  }>;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/admin/analytics?range=${dateRange}`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="text-center py-8">No analytics data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600 mt-1">Business insights and performance metrics</p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-prohibition-gold focus:border-prohibition-gold"
        >
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="quarter">Last 90 Days</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Today's Revenue"
          value={`£${analytics.revenue.today}`}
          change="+12%"
          positive={true}
        />
        <StatCard
          title="This Week"
          value={`£${analytics.revenue.week}`}
          change="+8%"
          positive={true}
        />
        <StatCard
          title="This Month"
          value={`£${analytics.revenue.month}`}
          change="+15%"
          positive={true}
        />
        <StatCard
          title="Total Revenue"
          value={`£${analytics.revenue.total}`}
          change="+22%"
          positive={true}
        />
      </div>

      {/* Booking Status Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Booking Status Distribution</h2>
        <div className="grid grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{analytics.bookings.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{analytics.bookings.confirmed}</div>
            <div className="text-sm text-gray-600">Confirmed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{analytics.bookings.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{analytics.bookings.cancelled}</div>
            <div className="text-sm text-gray-600">Cancelled</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-600">{analytics.bookings.noShow}</div>
            <div className="text-sm text-gray-600">No Show</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table Performance */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">Table Performance</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {analytics.tables.slice(0, 5).map((table) => (
                <div key={table.tableNumber} className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">Table {table.tableNumber}</span>
                    <span className="text-sm text-gray-500 ml-2">({table.floor})</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">£{table.revenue}</div>
                    <div className="text-xs text-gray-500">{table.bookingCount} bookings</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Popular Packages */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">Popular Packages</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {analytics.packages.slice(0, 5).map((pkg) => (
                <div key={pkg.name} className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{pkg.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">£{pkg.revenue}</div>
                    <div className="text-xs text-gray-500">{pkg.count} orders</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Peak Times */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Peak Booking Times</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-6 gap-4">
            {analytics.peakTimes.map((time) => (
              <div key={time.time} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{time.count}</div>
                <div className="text-sm text-gray-600">{time.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Bookings Chart (simplified) */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Daily Bookings Trend</h2>
        </div>
        <div className="p-6">
          <div className="flex items-end justify-between h-40 space-x-2">
            {analytics.dailyBookings.slice(-14).map((day, index) => {
              const maxCount = Math.max(...analytics.dailyBookings.map(d => d.count));
              const height = (day.count / maxCount) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-prohibition-gold rounded-t"
                    style={{ height: `${height}%` }}
                    title={`${day.date}: ${day.count} bookings`}
                  />
                  <div className="text-xs text-gray-500 mt-1 rotate-45 origin-left">
                    {new Date(day.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, positive }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`text-sm font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>
          {change}
        </div>
      </div>
    </div>
  );
}