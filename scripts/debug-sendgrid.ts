#!/usr/bin/env tsx

import * as dotenv from 'dotenv';
import * as path from 'path';
import sgMail from '@sendgrid/mail';

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function debugSendGrid() {
  console.log('=== SendGrid Debug Test ===\n');

  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@thebackroomleeds.com';
  const testEmail = process.argv[2] || 'test@example.com';

  console.log('Configuration:');
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 20)}...` : 'NOT SET');
  console.log('From Email:', fromEmail);
  console.log('Test Email:', testEmail);
  console.log('');

  if (!apiKey) {
    console.error('❌ SENDGRID_API_KEY is not set!');
    return;
  }

  // Set the API key
  sgMail.setApiKey(apiKey);

  // Prepare test message
  const msg = {
    to: testEmail,
    from: {
      email: fromEmail,
      name: 'The Backroom Leeds'
    },
    subject: 'SendGrid Test Email',
    text: 'This is a test email from The Backroom Leeds booking system.',
    html: '<p>This is a test email from The Backroom Leeds booking system.</p>'
  };

  console.log('Sending test email...\n');
  console.log('Message details:', JSON.stringify(msg, null, 2));
  console.log('');

  try {
    const response = await sgMail.send(msg);
    console.log('✅ Email sent successfully!');
    console.log('Response status:', response[0].statusCode);
    console.log('Response headers:', response[0].headers);
  } catch (error: any) {
    console.error('❌ Failed to send email!');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);

    if (error.response) {
      console.error('\nResponse details:');
      console.error('Status:', error.response.statusCode || error.code);
      console.error('Body:', JSON.stringify(error.response.body, null, 2));

      // Common error explanations
      console.log('\n=== Error Analysis ===');
      if (error.code === 403) {
        console.log('403 Forbidden - Possible causes:');
        console.log('1. Invalid API key');
        console.log('2. API key lacks necessary permissions');
        console.log('3. Sender email not verified in SendGrid');
        console.log('4. Account suspended or restricted');
        console.log('5. IP address not whitelisted (if IP restrictions enabled)');
      } else if (error.code === 401) {
        console.log('401 Unauthorized - The API key is invalid or missing');
      } else if (error.code === 400) {
        console.log('400 Bad Request - The request is malformed');
      }
    }
  }

  console.log('\n=== Additional Checks ===');
  console.log('1. Verify sender domain in SendGrid: https://app.sendgrid.com/settings/sender_auth');
  console.log('2. Check API key permissions: https://app.sendgrid.com/settings/api_keys');
  console.log('3. Verify account status: https://app.sendgrid.com/account/billing');
}

debugSendGrid().catch(console.error);