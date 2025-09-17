#!/usr/bin/env tsx

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { PrismaClient } from '../lib/generated/prisma';
import sgMail from '@sendgrid/mail';
import { generateRefundConfirmationEmail } from '../src/lib/email/templates/refund-confirmation';

const prisma = new PrismaClient();

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

const FROM_NAME = 'The Backroom Leeds';

async function testRefundEmail() {
  console.log('=== Testing Refund Email ===\n');

  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('❌ SENDGRID_API_KEY is not configured');
    return;
  }

  console.log('Configuration:');
  console.log('API Key:', apiKey.substring(0, 20) + '...');
  console.log('From Email:', getFromEmail());
  console.log('');

  // Get test email from command line or use default
  const testEmail = process.argv[2] || 'test@example.com';

  // Create mock data for refund email
  const mockData = {
    booking: {
      bookingReference: 'BR-TEST123',
      reference_number: 'BR-TEST123',
      name: 'John Smith',
      email: testEmail,
      table_name: 'Table 15 - VIP Booth',
      date: '2025-02-14',
      bookingDate: new Date('2025-02-14'),
      time: '20:00',
      bookingTime: '20:00',
      partySize: 4,
      party_size: 4,
      depositAmount: 50,
      drinks_package: 'Premium Package - £45 per person',
      custom_spirits: 'Grey Goose Vodka\nHendricks Gin',
      custom_champagnes: 'Moët & Chandon Brut\nVeuve Clicquot',
      specialRequests: 'Birthday celebration'
    },
    refundAmount: 50,
    refundId: 'ref_TEST123456',
    reason: 'Customer request',
    refundDate: new Date()
  };

  try {
    // Generate email content
    const { subject, text, html } = generateRefundConfirmationEmail(mockData);

    console.log('Email Subject:', subject);
    console.log('Sending to:', testEmail);
    console.log('');

    // Send email
    const msg = {
      to: testEmail,
      from: {
        email: getFromEmail(),
        name: FROM_NAME
      },
      subject,
      text,
      html,
    };

    const response = await sgMail.send(msg);
    console.log('✅ Refund email sent successfully!');
    console.log('Response status:', response[0].statusCode);
    console.log('Message ID:', response[0].headers['x-message-id']);

  } catch (error: any) {
    console.error('❌ Failed to send refund email!');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.body, null, 2));
    }
  }

  await prisma.$disconnect();
}

// Run the test
testRefundEmail().catch(console.error);