'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const navItems = [
    { href: '/admin/dashboard', label: 'Overview', icon: '📊' },
    { href: '/admin/dashboard/bookings', label: 'Bookings', icon: '📅' },
    { href: '/admin/dashboard/tables', label: 'Tables', icon: '🪑' },
    { href: '/admin/dashboard/customers', label: 'Customers', icon: '👥' },
    { href: '/admin/dashboard/analytics', label: 'Analytics', icon: '📈' },
    { href: '/admin/dashboard/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-prohibition-dark transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="p-4 border-b border-prohibition-gold/20">
          <h1 className={`font-bebas text-prohibition-gold text-2xl tracking-wider ${!sidebarOpen && 'hidden'}`}>
            BACKROOM ADMIN
          </h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-prohibition-gold hover:text-prohibition-gold/80 mt-2"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md transition ${
                    pathname === item.href
                      ? 'bg-prohibition-gold/20 text-prohibition-gold'
                      : 'text-prohibition-cream hover:bg-prohibition-gold/10 hover:text-prohibition-gold'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Menu */}
        <div className="p-4 border-t border-prohibition-gold/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 text-prohibition-cream hover:text-prohibition-gold transition"
          >
            <span>🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">
              The Backroom Leeds - Admin Dashboard
            </h2>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}