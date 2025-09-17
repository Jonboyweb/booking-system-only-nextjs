// Test Stripe webhook with actual Stripe test event
const Stripe = require('stripe');
require('dotenv').config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
});

async function testWebhook() {
  console.log('Testing Stripe webhook configuration...');

  // First, let's check if we can retrieve recent payment intents
  try {
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 5,
    });

    console.log('\n📋 Recent Payment Intents:');
    paymentIntents.data.forEach(pi => {
      console.log(`- ${pi.id}: ${pi.status} - ${pi.amount/100} GBP - Created: ${new Date(pi.created * 1000).toISOString()}`);
      if (pi.metadata.bookingId) {
        console.log(`  Booking ID: ${pi.metadata.bookingId}`);
      }
    });

    // Try to manually trigger webhook for the most recent succeeded payment
    const succeededIntent = paymentIntents.data.find(pi => pi.status === 'succeeded');
    if (succeededIntent) {
      console.log('\n✅ Found succeeded payment intent:', succeededIntent.id);
      console.log('Metadata:', succeededIntent.metadata);

      // Now let's check the webhook endpoint configuration
      console.log('\n🔍 Checking webhook endpoint configuration...');
      console.log('Webhook Secret present:', !!process.env.STRIPE_WEBHOOK_SECRET);
      console.log('Secret starts with:', process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10));

      // Simulate what the webhook handler would do
      if (succeededIntent.metadata.bookingId) {
        console.log('\n📝 This payment should update booking:', succeededIntent.metadata.bookingId);
        console.log('Payment details:');
        console.log('- Amount:', succeededIntent.amount / 100, 'GBP');
        console.log('- Customer email:', succeededIntent.receipt_email);
        console.log('- Booking reference:', succeededIntent.metadata.bookingReference);
      }
    } else {
      console.log('\n⚠️ No succeeded payment intents found in recent history');
    }

    // Check webhook endpoints configured in Stripe
    console.log('\n🌐 Checking Stripe webhook endpoints...');
    const webhookEndpoints = await stripe.webhookEndpoints.list({
      limit: 10,
    });

    webhookEndpoints.data.forEach(endpoint => {
      console.log(`\nEndpoint: ${endpoint.url}`);
      console.log(`Status: ${endpoint.status}`);
      console.log(`Events: ${endpoint.enabled_events.join(', ')}`);
      console.log(`API Version: ${endpoint.api_version}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    if (error.raw) {
      console.error('Raw error:', error.raw);
    }
  }
}

testWebhook();