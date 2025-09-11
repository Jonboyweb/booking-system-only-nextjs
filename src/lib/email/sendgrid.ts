import sgMail from '@sendgrid/mail';
import { Booking } from '@/lib/generated/prisma';
import { generateBookingConfirmationEmail } from './templates/booking-confirmation';

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
  return process.env.SENDGRID_FROM_EMAIL || 'noreply@thebackroomleeds.com';
}

export async function sendBookingConfirmationEmail(booking: Booking & { email?: string; [key: string]: any }): Promise<boolean> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('Cannot send email: SENDGRID_API_KEY is not configured');
    return false;
  }

  const email = (booking as any).email;
  if (!email) {
    console.error('Cannot send email: No email address provided');
    return false;
  }

  try {
    const { subject, text, html } = generateBookingConfirmationEmail(booking);
    
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
    console.log(`Booking confirmation email sent to ${email} for booking ${(booking as any).reference_number || booking.bookingReference}`);
    return true;
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    return false;
  }
}

export async function sendTestEmail(to: string): Promise<boolean> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('Cannot send email: SENDGRID_API_KEY is not configured');
    return false;
  }

  try {
    const msg = {
      to,
      from: {
        email: getFromEmail(),
        name: FROM_NAME
      },
      subject: 'Test Email from The Backroom Leeds',
      text: 'This is a test email from The Backroom Leeds booking system.',
      html: `
        <div style="font-family: Georgia, serif; padding: 20px; background-color: #f5f2ed;">
          <h1 style="color: #2c1810;">Test Email</h1>
          <p style="color: #8b7355;">This is a test email from The Backroom Leeds booking system.</p>
          <p style="color: #8b7355;">If you received this email, the SendGrid integration is working correctly.</p>
        </div>
      `,
    };

    await sgMail.send(msg);
    console.log(`Test email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending test email:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    return false;
  }
}