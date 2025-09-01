import { NextResponse } from 'next/server';
import { sendTestEmail } from '../../../../src/lib/email/sendgrid';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    const success = await sendTestEmail(email);

    if (success) {
      return NextResponse.json(
        { message: `Test email sent successfully to ${email}` },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to send test email. Please check server logs.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Test email API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}