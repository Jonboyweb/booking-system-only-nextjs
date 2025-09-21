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
  return process.env.EMAIL_FROM || process.env.SENDGRID_FROM_EMAIL || 'noreply@thebackroomleeds.com';
}

interface BookingWithEmail extends Booking {
  email?: string;
  reference_number?: string;
  modification_reason?: string;
  [key: string]: unknown;
}

export async function sendBookingConfirmationEmail(booking: BookingWithEmail): Promise<boolean> {
  const email = booking.email;
  if (!email) {
    console.error('Cannot send email: No email address provided');
    return false;
  }

  try {
    const { subject, text, html } = generateBookingConfirmationEmail({
      ...booking,
      specialRequests: booking.specialRequests || undefined,
      depositAmount: Number(booking.depositAmount),
      stripeIntentId: booking.stripeIntentId || undefined
    });

    // Check if we should use MailHog for development
    if (process.env.EMAIL_PROVIDER === 'mailhog' || process.env.NODE_ENV === 'development') {
      const success = await sendViaMailHog(email, subject, text, html);
      if (success) {
        console.log(`Booking confirmation email sent via MailHog to ${email} for booking ${booking.reference_number || booking.bookingReference}`);
      }
      return success;
    }

    // Use SendGrid for production
    const apiKey = getApiKey();
    if (!apiKey) {
      console.error('Cannot send email: SENDGRID_API_KEY is not configured');
      return false;
    }

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
    console.log(`Booking confirmation email sent via SendGrid to ${email} for booking ${booking.reference_number || booking.bookingReference}`);
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
  // Check if we should use MailHog for development
  if (process.env.EMAIL_PROVIDER === 'mailhog' || process.env.NODE_ENV === 'development') {
    try {
      const subject = 'Test Email from The Backroom Leeds';
      const text = 'This is a test email from The Backroom Leeds booking system.';
      const html = `
        <div style="font-family: Georgia, serif; padding: 20px; background-color: #f5f2ed;">
          <h1 style="color: #2c1810;">Test Email</h1>
          <p style="color: #8b7355;">This is a test email from The Backroom Leeds booking system.</p>
          <p style="color: #8b7355;">If you received this email, the MailHog integration is working correctly.</p>
        </div>
      `;

      return await sendViaMailHog(to, subject, text, html);
    } catch (error) {
      console.error('Error sending test email via MailHog:', error);
      return false;
    }
  }

  // Use SendGrid for production
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
    console.log(`Test email sent to ${to} via SendGrid`);
    return true;
  } catch (error) {
    console.error('Error sending test email:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    return false;
  }
}

// Helper function to send email via MailHog for development
async function sendViaMailHog(to: string, subject: string, text: string, html: string): Promise<boolean> {
  const net = await import('net');
  const SMTP_HOST = process.env.SMTP_HOST || 'localhost';
  const SMTP_PORT = parseInt(process.env.SMTP_PORT || '1025');
  const FROM_EMAIL = process.env.EMAIL_FROM || 'bookings@backroom-dev.local';
  const FROM_NAME_LOCAL = process.env.EMAIL_FROM_NAME || FROM_NAME;

  return new Promise((resolve) => {
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const message = [
      `From: "${FROM_NAME_LOCAL}" <${FROM_EMAIL}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${Date.now()}@backroom-dev.local>`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      `Content-Type: text/plain; charset="UTF-8"`,
      `Content-Transfer-Encoding: 7bit`,
      '',
      text,
      '',
      `--${boundary}`,
      `Content-Type: text/html; charset="UTF-8"`,
      `Content-Transfer-Encoding: 7bit`,
      '',
      html,
      '',
      `--${boundary}--`,
      ''
    ].join('\r\n');

    const client = net.createConnection({ port: SMTP_PORT, host: SMTP_HOST }, () => {
      let step = 0;

      client.on('data', (data) => {
        const response = data.toString();

        if (step === 0 && response.includes('220')) {
          client.write('HELO localhost\r\n');
          step++;
        } else if (step === 1 && response.includes('250')) {
          client.write(`MAIL FROM:<${FROM_EMAIL}>\r\n`);
          step++;
        } else if (step === 2 && response.includes('250')) {
          client.write(`RCPT TO:<${to}>\r\n`);
          step++;
        } else if (step === 3 && response.includes('250')) {
          client.write('DATA\r\n');
          step++;
        } else if (step === 4 && response.includes('354')) {
          client.write(message + '\r\n.\r\n');
          step++;
        } else if (step === 5 && response.includes('250')) {
          client.write('QUIT\r\n');
          client.end();
          console.log(`Email sent via MailHog to ${to}`);
          resolve(true);
        }
      });
    });

    client.on('error', (err) => {
      console.error('MailHog SMTP error:', err);
      resolve(false);
    });

    client.setTimeout(10000, () => {
      client.destroy();
      console.error('MailHog SMTP timeout');
      resolve(false);
    });
  });
}