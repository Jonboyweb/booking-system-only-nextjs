import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil'
});

export interface RefundResult {
  success: boolean;
  refundId?: string;
  amount?: number;
  status?: string;
  error?: string;
  refundDate?: Date;
}

/**
 * Process a full or partial refund for a payment
 * @param paymentIntentId - The Stripe payment intent ID
 * @param amount - Optional amount in pence to refund (defaults to full refund)
 * @param reason - Reason for the refund
 * @returns RefundResult with success status and details
 */
export async function processRefund(
  paymentIntentId: string,
  amount?: number,
  reason: string = 'requested_by_customer'
): Promise<RefundResult> {
  try {
    console.log('processRefund called with:', { paymentIntentId, amount, reason });
    
    if (!paymentIntentId) {
      console.error('No payment intent ID provided');
      return {
        success: false,
        error: 'Payment intent ID is required'
      };
    }

    // Retrieve the payment intent to get charge information
    console.log('Retrieving payment intent:', paymentIntentId);
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (!paymentIntent) {
      console.error('Payment intent not found:', paymentIntentId);
      return {
        success: false,
        error: 'Payment intent not found'
      };
    }

    console.log('Payment intent status:', paymentIntent.status);
    if (paymentIntent.status !== 'succeeded') {
      console.error('Cannot refund - payment intent status:', paymentIntent.status);
      return {
        success: false,
        error: `Payment intent status is ${paymentIntent.status}, cannot refund`
      };
    }

    // Create the refund
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
      reason: reason as Stripe.RefundCreateParams.Reason
    };

    // If amount is specified, add it (in pence)
    if (amount) {
      refundParams.amount = amount;
      console.log('Creating refund with amount:', amount);
    } else {
      console.log('Creating full refund');
    }

    console.log('Refund params:', refundParams);
    const refund = await stripe.refunds.create(refundParams);
    console.log('Refund created successfully:', refund.id);

    return {
      success: true,
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status || undefined,
      refundDate: new Date()
    };
  } catch (error) {
    console.error('Stripe refund error - Full details:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      console.error('Stripe error details:', {
        type: error.type,
        code: error.code,
        message: error.message,
        statusCode: error.statusCode
      });
      return {
        success: false,
        error: error.message || 'Stripe refund failed'
      };
    }
    
    console.error('Non-Stripe error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process refund'
    };
  }
}

/**
 * Check the status of an existing refund
 * @param refundId - The Stripe refund ID
 * @returns Refund status information
 */
export async function checkRefundStatus(refundId: string): Promise<{
  success: boolean;
  status?: string;
  amount?: number;
  created?: Date;
  error?: string;
}> {
  try {
    const refund = await stripe.refunds.retrieve(refundId);
    
    return {
      success: true,
      status: refund.status || undefined,
      amount: refund.amount,
      created: new Date(refund.created * 1000)
    };
  } catch (error) {
    console.error('Error checking refund status:', error);
    return {
      success: false,
      error: 'Failed to check refund status'
    };
  }
}

/**
 * List all refunds for a payment intent
 * @param paymentIntentId - The Stripe payment intent ID
 * @returns Array of refunds
 */
export async function listRefunds(paymentIntentId: string): Promise<{
  success: boolean;
  refunds?: Array<{
    id: string;
    amount: number;
    status: string;
    created: Date;
    reason: string | null;
  }>;
  error?: string;
}> {
  try {
    const refunds = await stripe.refunds.list({
      payment_intent: paymentIntentId,
      limit: 100
    });
    
    return {
      success: true,
      refunds: refunds.data.map(refund => ({
        id: refund.id,
        amount: refund.amount,
        status: refund.status || 'unknown',
        created: new Date(refund.created * 1000),
        reason: refund.reason
      }))
    };
  } catch (error) {
    console.error('Error listing refunds:', error);
    return {
      success: false,
      error: 'Failed to list refunds'
    };
  }
}