'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewBookingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState<Array<{id: string; tableNumber: number; floor: string; capacityMin: number; capacityMax: number;}>>([]);
  const [packages, setPackages] = useState<Array<{id: string; name: string; price: number; description: string;}>>([]);
  
  const [formData, setFormData] = useState({
    // Customer details
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    marketingConsent: false,
    
    // Booking details
    bookingDate: '',
    bookingTime: '',
    partySize: 2,
    tableId: '',
    drinkPackageId: '',
    specialRequests: '',
    internalNotes: '',
    
    // Payment
    depositPaid: false,
    paymentMethod: 'manual'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch tables
      const tablesRes = await fetch('/api/tables');
      const tablesData = await tablesRes.json();
      setTables(tablesData);

      // Fetch packages
      const packagesRes = await fetch('/api/packages');
      const packagesData = await packagesRes.json();
      setPackages(packagesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create or find customer
      const customerRes = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          marketingConsent: formData.marketingConsent
        })
      });
      
      const customer = await customerRes.json();

      // Create booking
      const bookingRes = await fetch('/api/admin/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          tableId: formData.tableId,
          bookingDate: formData.bookingDate,
          bookingTime: formData.bookingTime,
          partySize: formData.partySize,
          drinkPackageId: formData.drinkPackageId || null,
          specialRequests: formData.specialRequests,
          internalNotes: formData.internalNotes,
          depositPaid: formData.depositPaid,
          status: formData.depositPaid ? 'CONFIRMED' : 'PENDING'
        })
      });

      if (bookingRes.ok) {
        // Booking created successfully, redirect
        router.push('/admin/dashboard/bookings');
      } else {
        throw new Error('Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New Booking</h1>
        <p className="text-gray-600 mt-1">Manually create a table booking</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Customer Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-prohibition-gold focus:border-prohibition-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-prohibition-gold focus:border-prohibition-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-prohibition-gold focus:border-prohibition-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-prohibition-gold focus:border-prohibition-gold"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.marketingConsent}
                onChange={(e) => setFormData({...formData, marketingConsent: e.target.checked})}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Customer consents to marketing communications</span>
            </label>
          </div>
        </div>

        {/* Booking Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Booking Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={formData.bookingDate}
                onChange={(e) => setFormData({...formData, bookingDate: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                max={new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-prohibition-gold focus:border-prohibition-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time *
              </label>
              <select
                required
                value={formData.bookingTime}
                onChange={(e) => setFormData({...formData, bookingTime: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-prohibition-gold focus:border-prohibition-gold"
              >
                <option value="">Select time</option>
                <option value="18:00">18:00</option>
                <option value="18:30">18:30</option>
                <option value="19:00">19:00</option>
                <option value="19:30">19:30</option>
                <option value="20:00">20:00</option>
                <option value="20:30">20:30</option>
                <option value="21:00">21:00</option>
                <option value="21:30">21:30</option>
                <option value="22:00">22:00</option>
                <option value="22:30">22:30</option>
                <option value="23:00">23:00</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Party Size *
              </label>
              <input
                type="number"
                required
                min="2"
                max="12"
                value={formData.partySize}
                onChange={(e) => setFormData({...formData, partySize: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-prohibition-gold focus:border-prohibition-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Table *
              </label>
              <select
                required
                value={formData.tableId}
                onChange={(e) => setFormData({...formData, tableId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-prohibition-gold focus:border-prohibition-gold"
              >
                <option value="">Select table</option>
                {tables.map(table => (
                  <option key={table.id} value={table.id}>
                    Table {table.tableNumber} - {table.floor} (Capacity: {table.capacityMin}-{table.capacityMax})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Drinks Package (Optional)
              </label>
              <select
                value={formData.drinkPackageId}
                onChange={(e) => setFormData({...formData, drinkPackageId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-prohibition-gold focus:border-prohibition-gold"
              >
                <option value="">No package</option>
                {packages.map(pkg => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} - £{pkg.price}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Requests
              </label>
              <textarea
                value={formData.specialRequests}
                onChange={(e) => setFormData({...formData, specialRequests: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-prohibition-gold focus:border-prohibition-gold"
                placeholder="Any special requests from the customer..."
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Internal Notes
              </label>
              <textarea
                value={formData.internalNotes}
                onChange={(e) => setFormData({...formData, internalNotes: e.target.value})}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-prohibition-gold focus:border-prohibition-gold"
                placeholder="Internal notes (not visible to customer)..."
              />
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Payment</h2>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.depositPaid}
              onChange={(e) => setFormData({...formData, depositPaid: e.target.checked})}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">£50 deposit has been paid (booking will be confirmed)</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/admin/dashboard/bookings')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-prohibition-gold text-prohibition-dark rounded-md hover:bg-prohibition-gold/90 transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Booking'}
          </button>
        </div>
      </form>
    </div>
  );
}