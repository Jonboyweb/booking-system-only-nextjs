import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
});

// Fixed deposit amount in pence (£50)
export const DEPOSIT_AMOUNT = 5000;

// Helper to format amount for display
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount / 100);
}

// Helper to calculate refund amount based on cancellation timing
export function calculateRefundAmount(bookingDate: Date): number {
  const now = new Date();
  const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  // Full refund if cancelled more than 48 hours before
  if (hoursUntilBooking > 48) {
    return DEPOSIT_AMOUNT;
  }
  
  // No refund if cancelled less than 48 hours before
  return 0;
}