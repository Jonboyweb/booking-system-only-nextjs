'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface BookingDetail {
  id: string;
  bookingReference: string;
  status: string;
  bookingDate: string;
  bookingTime: string;
  partySize: number;
  depositAmount: number;
  depositPaid: boolean;
  stripePaymentId?: string;
  stripeIntentId?: string;
  paymentDate?: string;
  specialRequests?: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    marketingConsent: boolean;
  };
  table: {
    id: string;
    tableNumber: number;
    floor: string;
    capacityMin: number;
    capacityMax: number;
    description: string;
    features: string[];
    isVip: boolean;
  };
  drinkPackage?: {
    id: string;
    name: string;
    price: number;
    description: string;
  };
  spirits?: Array<{
    id: string;
    name: string;
    brand: string;
    category: string;
    quantity: number;
    price: number;
  }>;
  champagnes?: Array<{
    id: string;
    name: string;
    brand: string;
    quantity: number;
    price: number;
  }>;
}

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [internalNotes, setInternalNotes] = useState('');

  useEffect(() => {
    if (params?.id) {
      fetchBookingDetail(params.id as string);
    }
  }, [params?.id]);

  const fetchBookingDetail = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/bookings/${id}`);
      if (!response.ok) throw new Error('Failed to fetch booking');
      const data = await response.json();
      setBooking(data);
      setInternalNotes(data.internalNotes || '');
    } catch (error) {
      console.error('Error fetching booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!booking) return;
    
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchBookingDetail(booking.id);
      }
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  const handleNotesUpdate = async () => {
    if (!booking) return;
    
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internalNotes })
      });

      if (response.ok) {
        setEditMode(false);
        fetchBookingDetail(booking.id);
      }
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  };

  const handleRefund = async () => {
    if (!booking || !confirm('Are you sure you want to refund the deposit?')) return;
    
    alert('Refund functionality to be implemented with Stripe integration');
  };

  const handleResendEmail = async () => {
    if (!booking) return;
    
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}/resend-email`, {
        method: 'POST'
      });
      
      if (response.ok) {
        alert('Confirmation email has been resent');
      } else {
        alert('Failed to resend email');
      }
    } catch (error) {
      console.error('Error resending email:', error);
      alert('Error resending email');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading booking details...</div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Booking not found</p>
        <Link href="/admin/dashboard/bookings" className="text-indigo-600 hover:text-indigo-900 mt-4 inline-block">
          Back to Bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Booking {booking.bookingReference}
          </h1>
          <p className="text-gray-600 mt-1">
            Created {new Date(booking.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/admin/dashboard/bookings"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
          >
            Back to Bookings
          </Link>
        </div>
      </div>

      {/* Status and Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Booking Status
            </label>
            <select
              value={booking.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={`text-sm font-semibold rounded-full px-4 py-2 ${
                booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                booking.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}
            >
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="COMPLETED">Completed</option>
              <option value="NO_SHOW">No Show</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleResendEmail}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
            >
              Resend Email
            </button>
            {booking.depositPaid && booking.status !== 'CANCELLED' && (
              <button
                onClick={handleRefund}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
              >
                Refund Deposit
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Information */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">Booking Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-medium">
                  {new Date(booking.bookingDate).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Time</p>
                <p className="font-medium">{booking.bookingTime}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Party Size</p>
                <p className="font-medium">{booking.partySize} guests</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Table</p>
                <p className="font-medium">
                  Table {booking.table.tableNumber} - {booking.table.floor}
                  {booking.table.isVip && (
                    <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">VIP</span>
                  )}
                </p>
              </div>
            </div>
            
            {booking.table.features.length > 0 && (
              <div>
                <p className="text-sm text-gray-600">Table Features</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {booking.table.features.map((feature, index) => (
                    <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {booking.specialRequests && (
              <div>
                <p className="text-sm text-gray-600">Special Requests</p>
                <p className="mt-1 p-3 bg-gray-50 rounded text-sm">{booking.specialRequests}</p>
              </div>
            )}
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">Customer Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">
                  {booking.customer.firstName} {booking.customer.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{booking.customer.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{booking.customer.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Marketing Consent</p>
                <p className="font-medium">
                  {booking.customer.marketingConsent ? (
                    <span className="text-green-600">✓ Yes</span>
                  ) : (
                    <span className="text-gray-400">✗ No</span>
                  )}
                </p>
              </div>
            </div>
            <Link
              href={`/admin/dashboard/customers?search=${booking.customer.email}`}
              className="inline-block text-indigo-600 hover:text-indigo-900 text-sm"
            >
              View Customer History →
            </Link>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">Payment Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Deposit Amount</p>
                <p className="font-medium">£{booking.depositAmount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Status</p>
                <p className="font-medium">
                  {booking.depositPaid ? (
                    <span className="text-green-600">✓ Paid</span>
                  ) : (
                    <span className="text-red-600">✗ Unpaid</span>
                  )}
                </p>
              </div>
              {booking.paymentDate && (
                <div>
                  <p className="text-sm text-gray-600">Payment Date</p>
                  <p className="font-medium">
                    {new Date(booking.paymentDate).toLocaleString()}
                  </p>
                </div>
              )}
              {booking.stripePaymentId && (
                <div>
                  <p className="text-sm text-gray-600">Stripe Payment ID</p>
                  <p className="font-medium text-xs break-all">{booking.stripePaymentId}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Drinks Selection */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">Drinks Selection</h2>
          </div>
          <div className="p-6 space-y-4">
            {booking.drinkPackage ? (
              <div>
                <p className="text-sm text-gray-600">Package</p>
                <p className="font-medium">{booking.drinkPackage.name}</p>
                <p className="text-sm text-gray-500">£{booking.drinkPackage.price}</p>
                <p className="text-sm mt-2">{booking.drinkPackage.description}</p>
              </div>
            ) : (
              <div>
                {booking.spirits && booking.spirits.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Spirits</p>
                    <ul className="space-y-1">
                      {booking.spirits.map((spirit) => (
                        <li key={spirit.id} className="text-sm">
                          {spirit.quantity}x {spirit.brand} {spirit.name} - £{spirit.price}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {booking.champagnes && booking.champagnes.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Champagnes</p>
                    <ul className="space-y-1">
                      {booking.champagnes.map((champagne) => (
                        <li key={champagne.id} className="text-sm">
                          {champagne.quantity}x {champagne.brand} {champagne.name} - £{champagne.price}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(!booking.spirits || booking.spirits.length === 0) && 
                 (!booking.champagnes || booking.champagnes.length === 0) && (
                  <p className="text-sm text-gray-500">No drinks selected</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Internal Notes */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Internal Notes</h2>
          <button
            onClick={() => setEditMode(!editMode)}
            className="text-sm text-indigo-600 hover:text-indigo-900"
          >
            {editMode ? 'Cancel' : 'Edit'}
          </button>
        </div>
        <div className="p-6">
          {editMode ? (
            <div className="space-y-4">
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-prohibition-gold focus:border-prohibition-gold"
                placeholder="Add internal notes (not visible to customer)..."
              />
              <button
                onClick={handleNotesUpdate}
                className="px-4 py-2 bg-prohibition-gold text-prohibition-dark rounded-md hover:bg-prohibition-gold/90 transition"
              >
                Save Notes
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {booking.internalNotes || 'No internal notes'}
            </p>
          )}
        </div>
      </div>

      {/* Audit Trail */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <p>Created: {new Date(booking.createdAt).toLocaleString()}</p>
        <p>Last Updated: {new Date(booking.updatedAt).toLocaleString()}</p>
      </div>
    </div>
  );
}