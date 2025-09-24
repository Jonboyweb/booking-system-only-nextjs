'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Calendar, Clock, Users, MapPin, CreditCard } from 'lucide-react';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  // router is available if needed
  // const router = useRouter();
  const reference = searchParams.get('reference');
  const [booking, setBooking] = useState<{bookingReference: string; bookingDate: string; bookingTime: string; partySize: number; table: {tableNumber: number; floor: string; description?: string;}; customer: {firstName: string; lastName: string; email: string; phone: string;}; drinkPackage?: {name: string; price: number; description?: string;}; customOrder?: {totalPrice: number;}; depositAmount: number; depositPaid?: boolean; specialRequests?: string;} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) {
      setError('No booking reference provided');
      setLoading(false);
      return;
    }

    fetchBookingDetails();
  }, [reference]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchBookingDetails = async () => {
    try {
      const response = await fetch(`/api/bookings?reference=${reference}`);
      if (!response.ok) {
        throw new Error('Failed to fetch booking details');
      }
      const data = await response.json();
      setBooking(data.data || data); // Extract the booking from data.data if it exists
    } catch (err) {
      console.error('Failed to fetch booking:', err);
      setError('Unable to load booking details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading confirmation...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Unable to Load Booking</h3>
          <p>{error || 'Booking not found'}</p>
          <Link
            href="/booking"
            className="mt-4 inline-block text-red-600 underline hover:text-red-800"
          >
            Make a new booking
          </Link>
        </div>
      </div>
    );
  }

  const bookingDate = new Date(booking.bookingDate);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Success Banner */}
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-center mb-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-green-800 text-center mb-2">
          Booking Confirmed!
        </h2>
        <p className="text-green-700 text-center">
          Your table has been successfully reserved
        </p>
        <div className="mt-4 p-3 bg-white rounded-lg">
          <p className="text-center text-gray-800">
            Booking Reference: 
            <span className="font-mono font-bold text-lg ml-2">{booking.bookingReference}</span>
          </p>
        </div>
      </div>

      {/* Booking Details */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Booking Details</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <Calendar className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-semibold">
                {bookingDate.toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Time</p>
              <p className="font-semibold">{booking.bookingTime}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Table</p>
              <p className="font-semibold">
                Table {booking.table.tableNumber} - {booking.table.floor}
              </p>
              {booking.table.description && (
                <p className="text-sm text-gray-500">{booking.table.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Users className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Party Size</p>
              <p className="font-semibold">{booking.partySize} guests</p>
            </div>
          </div>

          {booking.depositPaid && (
            <div className="flex items-start space-x-3">
              <CreditCard className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Deposit</p>
                <p className="font-semibold text-green-600">£50.00 Paid</p>
              </div>
            </div>
          )}
        </div>

        {booking.drinkPackage && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600 mb-1">Drinks Package</p>
            <p className="font-semibold">{booking.drinkPackage.name}</p>
            <p className="text-sm text-gray-500">{booking.drinkPackage.description}</p>
          </div>
        )}

        {booking.specialRequests && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600 mb-1">Special Requests</p>
            <p className="text-gray-700">{booking.specialRequests}</p>
          </div>
        )}
      </div>

      {/* Customer Details */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Customer Details</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Name</p>
            <p className="font-semibold">{booking.customer.firstName} {booking.customer.lastName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-semibold">{booking.customer.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Phone</p>
            <p className="font-semibold">{booking.customer.phone}</p>
          </div>
        </div>
      </div>

      {/* Important Information */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-3 text-amber-900">Important Information</h3>
        <ul className="space-y-2 text-amber-800">
          <li className="flex items-start">
            <span className="text-amber-600 mr-2">•</span>
            A confirmation email has been sent to {booking.customer.email}
          </li>
          <li className="flex items-start">
            <span className="text-amber-600 mr-2">•</span>
            Please arrive within 15 minutes of your booking time
          </li>
          <li className="flex items-start">
            <span className="text-amber-600 mr-2">•</span>
            Tables are held for a maximum of 2 hours
          </li>
          <li className="flex items-start">
            <span className="text-amber-600 mr-2">•</span>
            Dress code: Smart casual (no sportswear)
          </li>
          <li className="flex items-start">
            <span className="text-amber-600 mr-2">•</span>
            For cancellations, please contact us at least 48 hours in advance for a full refund
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => window.print()}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
        >
          Print Confirmation
        </button>
        <Link
          href="/booking"
          className="px-6 py-3 bg-amber-700 text-white rounded-lg font-semibold hover:bg-amber-800 transition-colors text-center"
        >
          Make Another Booking
        </Link>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading confirmation...</p>
          </div>
        </div>
      }>
        <ConfirmationContent />
      </Suspense>
    </div>
  );
}