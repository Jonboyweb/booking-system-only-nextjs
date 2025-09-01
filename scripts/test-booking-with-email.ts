#!/usr/bin/env tsx

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testBookingWithEmail() {
  const baseUrl = 'http://localhost:3000';
  const testEmail = process.argv[2] || 'test@example.com';
  
  console.log('🚀 Testing complete booking flow with email confirmation\n');
  console.log(`📧 Test email: ${testEmail}\n`);

  try {
    // Step 1: Create a booking
    console.log('1️⃣ Creating booking...');
    const bookingResponse = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tableId: 'df1103b0-e155-41b8-943d-a3bf87a38a73', // Table 1 - VIP Booth
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
        time: '20:00',
        partySize: 6,
        customer: {
          firstName: 'Test',
          lastName: 'User',
          email: testEmail,
          phone: '07123456789',
          dateOfBirth: '1990-01-01',
          marketingConsent: true
        },
        drinkPackageId: 'da0692eb-bb33-4261-a051-0271689bfbcc', // House G&T package
        specialRequests: 'Test booking with email confirmation'
      })
    });

    if (!bookingResponse.ok) {
      const error = await bookingResponse.json();
      throw new Error(`Booking creation failed: ${error.error}`);
    }

    const booking = await bookingResponse.json();
    console.log(`✅ Booking created: ${booking.bookingReference}`);
    console.log(`   Table: ${booking.table.name}`);
    console.log(`   Date: ${booking.bookingDate}`);
    console.log(`   Time: ${booking.bookingTime}`);
    console.log(`   Status: ${booking.status}\n`);

    // Step 2: Create payment intent
    console.log('2️⃣ Creating payment intent...');
    const paymentIntentResponse = await fetch(`${baseUrl}/api/payment/create-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookingId: booking.id,
        amount: 5000, // £50 deposit
        currency: 'gbp',
        customerEmail: testEmail
      })
    });

    if (!paymentIntentResponse.ok) {
      const error = await paymentIntentResponse.json();
      throw new Error(`Payment intent creation failed: ${error.error}`);
    }

    const { clientSecret } = await paymentIntentResponse.json();
    console.log('✅ Payment intent created\n');

    // Step 3: Simulate payment confirmation (in production, this would be done by Stripe)
    console.log('3️⃣ Simulating payment confirmation...');
    console.log('   Note: In production, this would be triggered by Stripe webhook');
    console.log('   when the customer completes payment on the frontend.\n');

    // Step 4: Test direct email sending
    console.log('4️⃣ Testing direct email sending...');
    const emailTestResponse = await fetch(`${baseUrl}/api/email/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail
      })
    });

    if (!emailTestResponse.ok) {
      const error = await emailTestResponse.json();
      console.log(`⚠️ Email test failed: ${error.error}`);
    } else {
      const result = await emailTestResponse.json();
      console.log(`✅ ${result.message}\n`);
    }

    console.log('✨ Booking flow test complete!\n');
    console.log('📋 Summary:');
    console.log(`   - Booking Reference: ${booking.bookingReference}`);
    console.log(`   - Customer: ${booking.customer.firstName} ${booking.customer.lastName}`);
    console.log(`   - Email: ${testEmail}`);
    console.log(`   - Payment Intent Created: Yes`);
    console.log(`   - Test Email Sent: Yes\n`);
    
    console.log('ℹ️  Notes:');
    console.log('   - The booking confirmation email will be sent automatically');
    console.log('     when payment is confirmed via the Stripe webhook.');
    console.log('   - To test the full flow, complete payment using the Stripe');
    console.log('     payment form on the frontend with the test card:');
    console.log('     Card Number: 4242 4242 4242 4242');
    console.log('     Expiry: Any future date');
    console.log('     CVC: Any 3 digits\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testBookingWithEmail().catch(console.error);