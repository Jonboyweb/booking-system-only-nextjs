import sgMail from '@sendgrid/mail';
import { generateRefundConfirmationEmail } from './templates/refund-confirmation';

const FROM_NAME = 'The Backroom Leeds';

// Helper function to get and validate API key
function getApiKey(): string | undefined {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (apiKey) {
    sgMail.setApiKey(apiKey);
  }
  return apiKey;
}

// Helper function to get from email
function getFromEmail(): string {
  return process.env.EMAIL_FROM || process.env.SENDGRID_FROM_EMAIL || 'noreply@thebackroomleeds.com';
}

interface RefundEmailData {
  booking: {
    email?: string;
    name?: string;
    phone?: string;
    reference_number?: string;
    bookingReference?: string;
    table_name?: string;
    date?: string;
    time?: string;
    booking_time?: string;
    party_size?: number;
    partySize?: number;
    drinks_package?: string | null;
    drinkPackage?: { name: string } | null;
    specialRequests?: string | null;
    depositAmount?: number;
    stripeIntentId?: string | null;
    [key: string]: unknown;
  };
  refundAmount: number;
  refundId?: string;
  reason?: string;
  refundDate?: Date;
}

export async function sendRefundConfirmationEmail(data: RefundEmailData): Promise<boolean> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('Cannot send refund email: SENDGRID_API_KEY is not configured');
    return false;
  }

  const email = data.booking.email;
  if (!email) {
    console.error('Cannot send refund email: No email address provided');
    return false;
  }

  try {
    // Generate email content using the template
    const { subject, text, html } = generateRefundConfirmationEmail({
      booking: {
        ...data.booking,
        reference_number: data.booking.reference_number || data.booking.bookingReference,
        deposit_amount: data.booking.depositAmount
      },
      refundAmount: data.refundAmount,
      refundId: data.refundId || `REF-${Date.now()}`,
      reason: data.reason || 'Customer request',
      refundDate: data.refundDate || new Date()
    });

    const msg = {
      to: email,
      from: {
        email: getFromEmail(),
        name: FROM_NAME
      },
      subject,
      text,
      html,
    };

    await sgMail.send(msg);
    console.log(`Refund confirmation email sent to ${email} for booking ${data.booking.reference_number || data.booking.bookingReference}`);
    return true;
  } catch (error) {
    console.error('Error sending refund confirmation email:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    return false;
  }
}