import { z } from 'zod';

// Stripe payment intent creation schema
export const createPaymentIntentSchema = z.object({
  bookingReference: z.string()
    .min(9, 'Invalid booking reference')
    .max(20, 'Invalid booking reference')
    .regex(/^BR-[A-Z0-9]+$/, 'Invalid booking reference format'),

  amount: z.number()
    .int('Amount must be an integer (in pence)')
    .min(5000, 'Minimum deposit is £50')
    .max(100000, 'Maximum amount is £1000'),

  currency: z.literal('gbp'),

  metadata: z.object({
    bookingReference: z.string(),
    customerEmail: z.string().email().optional(),
    customerName: z.string().optional(),
  }).optional(),
}).strict();

// Payment confirmation schema (from Stripe webhook)
export const paymentConfirmationSchema = z.object({
  paymentIntentId: z.string()
    .regex(/^pi_[a-zA-Z0-9]+$/, 'Invalid payment intent ID format'),

  status: z.enum(['succeeded', 'processing', 'requires_payment_method', 'canceled']),

  amount: z.number()
    .int('Amount must be an integer')
    .positive('Amount must be positive'),

  bookingReference: z.string()
    .regex(/^BR-[A-Z0-9]+$/, 'Invalid booking reference format')
    .optional(),
});

// Stripe webhook event schema
export const stripeWebhookEventSchema = z.object({
  id: z.string().min(1),
  object: z.literal('event'),
  type: z.string().min(1),
  created: z.number().positive(),
  data: z.object({
    object: z.record(z.string(), z.any()),
  }),
});

// Refund request schema
export const createRefundSchema = z.object({
  paymentIntentId: z.string()
    .regex(/^pi_[a-zA-Z0-9]+$/, 'Invalid payment intent ID format'),

  amount: z.number()
    .int('Amount must be an integer (in pence)')
    .min(100, 'Minimum refund is £1')
    .max(100000, 'Maximum refund is £1000')
    .optional(), // Optional - if not provided, full refund

  reason: z.enum([
    'duplicate',
    'fraudulent',
    'requested_by_customer',
    'expired_uncaptured_charge'
  ]).optional(),

  metadata: z.object({
    bookingReference: z.string().optional(),
    adminUserId: z.number().optional(),
    refundReason: z.string().max(500).optional(),
  }).optional(),
}).strict();

// Payment method validation
export const paymentMethodSchema = z.object({
  type: z.enum(['card', 'bank_transfer']),

  card: z.object({
    number: z.string()
      .regex(/^\d{13,19}$/, 'Invalid card number'),

    exp_month: z.number()
      .int()
      .min(1, 'Invalid expiry month')
      .max(12, 'Invalid expiry month'),

    exp_year: z.number()
      .int()
      .min(new Date().getFullYear(), 'Card has expired')
      .max(new Date().getFullYear() + 50, 'Invalid expiry year'),

    cvc: z.string()
      .regex(/^\d{3,4}$/, 'Invalid CVC'),

    name: z.string()
      .min(2, 'Cardholder name is required')
      .max(100, 'Cardholder name too long')
      .regex(/^[a-zA-Z\s'-]+$/, 'Invalid characters in cardholder name'),
  }).optional(),
});

// Helper function to validate Stripe signature
export function validateStripeSignature(
  payload: string,
  signature: string | null
): boolean {
  if (!signature) return false;

  // This is a placeholder - actual implementation would use Stripe's webhook signature verification
  // In real implementation, use stripe.webhooks.constructEvent()
  return true;
}

// Type exports
export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;
export type PaymentConfirmationInput = z.infer<typeof paymentConfirmationSchema>;
export type CreateRefundInput = z.infer<typeof createRefundSchema>;
export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>;
export type StripeWebhookEvent = z.infer<typeof stripeWebhookEventSchema>;