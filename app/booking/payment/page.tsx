'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PaymentForm from '@/components/payment/PaymentForm';
import '@/lib/stripe';

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('bookingId');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingDetails, setBookingDetails] = useState<{bookingReference: string; customer: {email: string; firstName: string; lastName: string;}; table: {tableNumber: number; floor: string;}; bookingDate: string; bookingTime: string; partySize: number; depositAmount: number;} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setError('No booking ID provided');
      setLoading(false);
      return;
    }

    fetchPaymentIntent();
  }, [bookingId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPaymentIntent = async () => {
    try {
      // First get booking details
      const bookingResponse = await fetch(`/api/bookings?id=${bookingId}`);
      if (!bookingResponse.ok) {
        throw new Error('Failed to fetch booking details');
      }
      const booking = await bookingResponse.json();
      setBookingDetails(booking);

      // Create payment intent
      const response = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          customerEmail: booking.customer.email,
          customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const data = await response.json();
      
      if (data.alreadyPaid) {
        // Redirect to confirmation page if already paid
        router.push(`/booking/confirmation?reference=${booking.bookingReference}`);
        return;
      }

      setClientSecret(data.clientSecret);
    } catch (err) {
      console.error('Payment setup failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to setup payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    if (bookingDetails) {
      router.push(`/booking/confirmation?reference=${bookingDetails.bookingReference}`);
    }
  };

  const handlePaymentError = (error: string) => {
    setError(error);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Setting up payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Payment Setup Failed</h3>
          <p>{error}</p>
          <button
            onClick={() => router.push('/booking')}
            className="mt-4 text-red-600 underline hover:text-red-800"
          >
            Return to booking
          </button>
        </div>
      </div>
    );
  }

  if (!clientSecret || !bookingDetails) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Invalid Booking</h3>
          <p>Unable to process payment for this booking.</p>
          <button
            onClick={() => router.push('/booking')}
            className="mt-4 text-yellow-600 underline hover:text-yellow-800"
          >
            Return to booking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-zinc-900 text-amber-100 p-6 rounded-lg mb-6">
        <h2 className="text-2xl font-bold mb-4">Complete Your Booking</h2>
        <div className="space-y-2 text-sm">
          <p><span className="font-semibold">Table:</span> {bookingDetails.table.tableNumber}</p>
          <p><span className="font-semibold">Date:</span> {new Date(bookingDetails.bookingDate).toLocaleDateString()}</p>
          <p><span className="font-semibold">Time:</span> {bookingDetails.bookingTime}</p>
          <p><span className="font-semibold">Party Size:</span> {bookingDetails.partySize} guests</p>
          {bookingDetails.drinksPackage && (
            <p><span className="font-semibold">Package:</span> {bookingDetails.drinksPackage.name}</p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <PaymentForm
          bookingId={bookingId!}
          bookingReference={bookingDetails.bookingReference}
          customerEmail={bookingDetails.customer.email}
          customerName={`${bookingDetails.customer.firstName} ${bookingDetails.customer.lastName}`}
          clientSecret={clientSecret}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-amber-900 mb-2">Secure Your Table</h1>
        <p className="text-gray-600">Complete your booking with a secure deposit payment</p>
      </div>
      
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading payment details...</p>
          </div>
        </div>
      }>
        <PaymentContent />
      </Suspense>
    </div>
  );
}