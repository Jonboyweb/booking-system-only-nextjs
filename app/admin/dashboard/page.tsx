'use client';

import { useEffect, useState } from 'react';

interface DashboardStats {
  todayBookings: number;
  weekBookings: number;
  monthBookings: number;
  totalRevenue: number;
  pendingBookings: number;
  confirmedBookings: number;
  popularTable: string;
  popularPackage: string;
}

interface RecentBooking {
  id: string;
  bookingReference: string;
  customerName: string;
  tableName: string;
  bookingDate: string;
  bookingTime: string;
  partySize: number;
  status: string;
  depositPaid: boolean;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const statsRes = await fetch('/api/admin/stats');
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch recent bookings
      const bookingsRes = await fetch('/api/admin/bookings/recent');
      const bookingsData = await bookingsRes.json();
      setRecentBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-1">
          Welcome to The Backroom Leeds admin dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Bookings"
          value={stats?.todayBookings || 0}
          icon="📅"
          color="bg-blue-500"
        />
        <StatCard
          title="This Week"
          value={stats?.weekBookings || 0}
          icon="📊"
          color="bg-green-500"
        />
        <StatCard
          title="This Month"
          value={stats?.monthBookings || 0}
          icon="📈"
          color="bg-purple-500"
        />
        <StatCard
          title="Total Revenue"
          value={`£${stats?.totalRevenue || 0}`}
          icon="💰"
          color="bg-yellow-500"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats?.pendingBookings || 0}
              </p>
            </div>
            <span className="text-3xl">⏳</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-green-600">
                {stats?.confirmedBookings || 0}
              </p>
            </div>
            <span className="text-3xl">✅</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Popular Table</p>
              <p className="text-lg font-bold text-gray-800">
                {stats?.popularTable || 'N/A'}
              </p>
            </div>
            <span className="text-3xl">🏆</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Top Package</p>
              <p className="text-lg font-bold text-gray-800">
                {stats?.popularPackage || 'N/A'}
              </p>
            </div>
            <span className="text-3xl">🍾</span>
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Recent Bookings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Party
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentBookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {booking.bookingReference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.tableName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(booking.bookingDate).toLocaleDateString()} {booking.bookingTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.partySize}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <a 
                      href={`/admin/dashboard/bookings/${booking.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`${color} text-white rounded-full p-3`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    COMPLETED: 'bg-blue-100 text-blue-800',
    NO_SHOW: 'bg-gray-100 text-gray-800'
  };

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[status as keyof typeof colors]}`}>
      {status}
    </span>
  );
}