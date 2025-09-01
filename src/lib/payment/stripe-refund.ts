import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
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
    if (!paymentIntentId) {
      return {
        success: false,
        error: 'Payment intent ID is required'
      };
    }

    // Retrieve the payment intent to get charge information
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (!paymentIntent) {
      return {
        success: false,
        error: 'Payment intent not found'
      };
    }

    if (paymentIntent.status !== 'succeeded') {
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
    }

    const refund = await stripe.refunds.create(refundParams);

    return {
      success: true,
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status,
      refundDate: new Date()
    };
  } catch (error) {
    console.error('Stripe refund error:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return {
        success: false,
        error: error.message || 'Stripe refund failed'
      };
    }
    
    return {
      success: false,
      error: 'Failed to process refund'
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
      status: refund.status,
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