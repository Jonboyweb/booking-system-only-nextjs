import * as dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config();

async function testStripeConnection() {
  console.log('========================================');
  console.log('     Stripe Integration Test');
  console.log('========================================\n');

  // Check environment variables
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  console.log('Environment Check:');
  console.log(`  Publishable Key: ${publishableKey ? '✅ Set' : '❌ Missing'} ${publishableKey?.substring(0, 20)}...`);
  console.log(`  Secret Key: ${secretKey ? '✅ Set' : '❌ Missing'} ${secretKey?.substring(0, 20)}...`);
  console.log(`  Webhook Secret: ${webhookSecret ? '✅ Set' : '❌ Missing'}`);
  console.log(`  Payments Enabled: ${process.env.ENABLE_STRIPE_PAYMENTS}\n`);

  if (!secretKey) {
    console.error('❌ STRIPE_SECRET_KEY is not set in .env');
    process.exit(1);
  }

  if (!publishableKey) {
    console.error('❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set in .env');
    process.exit(1);
  }

  // Validate key format
  if (!publishableKey.startsWith('pk_test_')) {
    console.error('❌ Publishable key should start with "pk_test_" for test mode');
    process.exit(1);
  }

  if (!secretKey.startsWith('sk_test_')) {
    console.error('❌ Secret key should start with "sk_test_" for test mode');
    process.exit(1);
  }

  console.log('Key Format: ✅ Valid test keys\n');

  // Test Stripe connection
  try {
    console.log('Testing Stripe API connection...');
    const stripe = new Stripe(secretKey, {
      apiVersion: '2025-08-27.basil',
      typescript: true,
    });

    // Try to retrieve account information
    const account = await stripe.accounts.retrieve();
    console.log('✅ Successfully connected to Stripe!');
    console.log(`  Account: ${account.id}`);
    console.log(`  Country: ${account.country}`);
    console.log(`  Default Currency: ${account.default_currency?.toUpperCase()}\n`);

    // Test creating a payment intent
    console.log('Testing Payment Intent creation...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 5000, // £50 in pence
      currency: 'gbp',
      metadata: {
        test: 'true',
        purpose: 'integration_test',
      },
      description: 'Test payment intent from integration script',
    });

    console.log('✅ Payment Intent created successfully!');
    console.log(`  ID: ${paymentIntent.id}`);
    console.log(`  Amount: £${(paymentIntent.amount / 100).toFixed(2)}`);
    console.log(`  Status: ${paymentIntent.status}`);
    console.log(`  Client Secret: ${paymentIntent.client_secret?.substring(0, 30)}...`);

    // Cancel the test payment intent
    await stripe.paymentIntents.cancel(paymentIntent.id);
    console.log('  (Test intent cancelled)\n');

    console.log('========================================');
    console.log('✅ Stripe integration is working correctly!');
    console.log('========================================\n');

    console.log('Next steps:');
    console.log('1. Try making a booking at http://localhost:3000/booking');
    console.log('2. Use test card: 4242 4242 4242 4242');
    console.log('3. Check browser console for any client-side errors\n');

  } catch (error) {
    console.error('\n❌ Stripe API Error:', error instanceof Error ? error.message : error);

    if (error instanceof Error && error.message.includes('Invalid API Key')) {
      console.error('\nYour Stripe keys appear to be invalid.');
      console.error('Please ensure you:');
      console.error('1. Copied the complete key from Stripe Dashboard');
      console.error('2. Are using TEST keys (not LIVE keys)');
      console.error('3. Have the correct keys in the right variables');
    }

    process.exit(1);
  }
}

testStripeConnection().catch(console.error);