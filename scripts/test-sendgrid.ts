#!/usr/bin/env tsx

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env (not .env.local)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { sendBookingConfirmationEmail, sendTestEmail } from '../src/lib/email/sendgrid';

async function testEmails() {
  console.log('Testing SendGrid email functionality...\n');
  console.log('Environment check:');
  console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? `Set (${process.env.SENDGRID_API_KEY.substring(0, 10)}...)` : 'Not set');
  console.log('SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL || 'Not set (will use default)');
  console.log('');

  // Get test email from command line or use default
  const testEmailAddress = process.argv[2] || 'test@example.com';

  // Test 1: Send a simple test email
  console.log('1. Sending test email...');

  try {
    const testResult = await sendTestEmail(testEmailAddress);
    if (testResult) {
      console.log(`✅ Test email sent successfully to ${testEmailAddress}`);
    } else {
      console.log(`❌ Failed to send test email to ${testEmailAddress}`);
    }
  } catch (error) {
    console.error('Error during test email:', error);
  }

  // Test 2: Send a booking confirmation email
  console.log('\n2. Sending booking confirmation email...');

  const mockBooking: any = {
    id: 'test-booking-id',
    bookingReference: 'BR-TEST123',
    reference_number: 'BR-TEST123',
    tableId: 'table-1',
    table_name: 'Table 15 - VIP Booth (Upstairs)',
    customerId: 'customer-1',
    name: 'John Smith',
    email: testEmailAddress,
    phone: '07123456789',
    bookingDate: new Date('2025-02-14'),
    date: '2025-02-14',
    bookingTime: '20:00',
    time: '20:00',
    partySize: 4,
    party_size: 4,
    status: 'CONFIRMED',
    depositAmount: 50,
    depositPaid: true,
    stripePaymentId: 'pi_test_123456789',
    drinks_package: 'Premium Package - £45 per person',
    specialRequests: 'Birthday celebration - please have champagne ready',
    custom_spirits: 'Grey Goose Vodka (£180)\nHendricks Gin (£160)',
    custom_champagnes: 'Moët & Chandon Brut (£95)\nVeuve Clicquot Yellow Label (£110)',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    const confirmationResult = await sendBookingConfirmationEmail(mockBooking);
    if (confirmationResult) {
      console.log(`✅ Booking confirmation email sent successfully to ${testEmailAddress}`);
    } else {
      console.log(`❌ Failed to send booking confirmation email to ${testEmailAddress}`);
    }
  } catch (error) {
    console.error('Error during booking confirmation email:', error);
  }

  console.log('\n✨ Email testing complete!');
}

// Run the test
testEmails().catch(console.error);