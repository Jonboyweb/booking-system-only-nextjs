'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
// Define constants and helpers locally to avoid importing server-side code
const DEPOSIT_AMOUNT = 5000; // £50 in pence

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount / 100);
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentFormProps {
  bookingId: string;
  bookingReference: string;
  customerEmail: string;
  customerName: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function CheckoutForm({ 
  bookingReference,
  customerEmail,
  customerName,
  onSuccess, 
  onError 
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking/confirmation?reference=${bookingReference}`,
          payment_method_data: {
            billing_details: {
              email: customerEmail,
              name: customerName,
            },
          },
        },
      });

      if (error) {
        if (error.type === 'card_error' || error.type === 'validation_error') {
          setMessage(error.message || 'Payment failed');
          onError(error.message || 'Payment failed');
        } else {
          setMessage('An unexpected error occurred.');
          onError('An unexpected error occurred.');
        }
      } else {
        onSuccess();
      }
    } catch {
      setMessage('Payment processing failed. Please try again.');
      onError('Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
        <h3 className="font-semibold text-amber-900 mb-2">Deposit Required</h3>
        <p className="text-amber-800">
          A deposit of {formatAmount(DEPOSIT_AMOUNT)} is required to secure your booking.
        </p>
        <p className="text-sm text-amber-700 mt-2">
          Booking Reference: <span className="font-mono font-semibold">{bookingReference}</span>
        </p>
      </div>

      <PaymentElement 
        options={{
          layout: 'tabs',
          defaultValues: {
            billingDetails: {
              email: customerEmail,
              name: customerName,
            }
          }
        }}
      />

      {message && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={isProcessing || !stripe || !elements}
        className="w-full bg-amber-700 text-white py-3 px-6 rounded-lg font-semibold
                 hover:bg-amber-800 transition-colors disabled:bg-gray-400 
                 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          `Pay ${formatAmount(DEPOSIT_AMOUNT)} Deposit`
        )}
      </button>

      <p className="text-xs text-gray-600 text-center">
        Your payment is processed securely by Stripe. We never store your card details.
      </p>
    </form>
  );
}

export default function PaymentForm(props: PaymentFormProps & { clientSecret: string }) {
  const { clientSecret, ...formProps } = props;

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#b45309', // amber-700
      colorBackground: '#ffffff',
      colorText: '#1f2937',
      colorDanger: '#dc2626',
      fontFamily: 'system-ui, sans-serif',
      borderRadius: '8px',
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <Elements options={options} stripe={stripePromise}>
      <CheckoutForm {...formProps} />
    </Elements>
  );
}