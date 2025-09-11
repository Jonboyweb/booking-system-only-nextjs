import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil'
});

async function checkPaymentIntent() {
  const intentId = 'pi_3S6Ipd2cvKVqmxJp00U8XBM2';
  
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(intentId);
    
    console.log('Payment Intent Details:');
    console.log('-------------------');
    console.log('ID:', paymentIntent.id);
    console.log('Status:', paymentIntent.status);
    console.log('Amount:', paymentIntent.amount / 100, 'GBP');
    console.log('Created:', new Date(paymentIntent.created * 1000).toLocaleString());
    console.log('Receipt Email:', paymentIntent.receipt_email);
    console.log('\nMetadata:');
    console.log(JSON.stringify(paymentIntent.metadata, null, 2));
    
    // Charges are not directly available on PaymentIntent in newer API versions
    // Need to list charges separately if needed
    if (paymentIntent.latest_charge) {
      console.log('\nLatest Charge ID:', paymentIntent.latest_charge);
    }
    
    // Check for events related to this payment intent
    console.log('\nChecking recent webhook events...');
    const events = await stripe.events.list({
      limit: 100,
      types: ['payment_intent.succeeded', 'payment_intent.payment_failed'],
    });
    
    const relatedEvents = events.data.filter(event => {
      const pi = event.data.object as any;
      return pi.id === intentId;
    });
    
    if (relatedEvents.length > 0) {
      console.log('\nRelated webhook events:');
      relatedEvents.forEach(event => {
        console.log(`- ${event.type} at ${new Date(event.created * 1000).toLocaleString()}`);
        console.log(`  Livemode: ${event.livemode}`);
      });
    } else {
      console.log('No webhook events found for this payment intent');
    }
    
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
  }
}

checkPaymentIntent();