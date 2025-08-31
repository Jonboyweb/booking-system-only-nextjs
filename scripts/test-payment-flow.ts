#!/usr/bin/env tsx

const API_BASE = 'http://localhost:3000/api';

async function testPaymentFlow() {
  console.log('🧪 Testing Payment Flow\n');
  
  try {
    // Step 1: Create a test booking
    console.log('1️⃣ Creating a test booking...');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Use a random time to avoid conflicts
    const hours = 19 + Math.floor(Math.random() * 4); // Random hour between 19-22
    const minutes = Math.random() > 0.5 ? '00' : '30';
    const time = `${hours}:${minutes}`;
    
    const bookingData = {
      tableId: 'test-table-id', // You'll need to get a real table ID from your database
      date: tomorrow.toISOString().split('T')[0],
      time,
      partySize: 4,
      customer: {
        firstName: 'Test',
        lastName: 'Customer',
        email: 'test@example.com',
        phone: '07123456789'
      },
      specialRequests: 'Test booking for payment flow'
    };
    
    // First, get a real table ID
    console.log('   Fetching available tables...');
    const tablesResponse = await fetch(`${API_BASE}/tables`);
    const tables = await tablesResponse.json();
    
    if (!tables || tables.length === 0) {
      throw new Error('No tables found in database');
    }
    
    bookingData.tableId = tables[0].id;
    console.log(`   Using table: ${tables[0].tableNumber}`);
    
    // Create the booking
    const bookingResponse = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    
    if (!bookingResponse.ok) {
      const error = await bookingResponse.text();
      throw new Error(`Failed to create booking: ${error}`);
    }
    
    const booking = await bookingResponse.json();
    console.log(`   ✅ Booking created: ${booking.bookingReference}`);
    console.log(`   Booking ID: ${booking.id}\n`);
    
    // Step 2: Create a payment intent
    console.log('2️⃣ Creating payment intent...');
    
    const paymentIntentResponse = await fetch(`${API_BASE}/payment/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: booking.id,
        customerEmail: booking.customer.email,
        customerName: `${booking.customer.firstName} ${booking.customer.lastName}`
      })
    });
    
    if (!paymentIntentResponse.ok) {
      const error = await paymentIntentResponse.text();
      throw new Error(`Failed to create payment intent: ${error}`);
    }
    
    const paymentIntent = await paymentIntentResponse.json();
    console.log(`   ✅ Payment intent created`);
    console.log(`   Client Secret: ${paymentIntent.clientSecret?.substring(0, 30)}...`);
    console.log(`   Amount: £${(paymentIntent.amount / 100).toFixed(2)}\n`);
    
    // Step 3: Verify booking can be fetched by ID
    console.log('3️⃣ Verifying booking can be fetched...');
    
    const fetchBookingResponse = await fetch(`${API_BASE}/bookings?id=${booking.id}`);
    if (!fetchBookingResponse.ok) {
      throw new Error('Failed to fetch booking by ID');
    }
    
    const fetchedBooking = await fetchBookingResponse.json();
    console.log(`   ✅ Booking fetched successfully`);
    console.log(`   Status: ${fetchedBooking.status}`);
    console.log(`   Deposit Paid: ${fetchedBooking.depositPaid}`);
    console.log(`   Stripe Intent ID: ${fetchedBooking.stripeIntentId}\n`);
    
    // Step 4: Test webhook endpoint exists
    console.log('4️⃣ Testing webhook endpoint...');
    
    const webhookResponse = await fetch(`${API_BASE}/payment/webhook`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'stripe-signature': 'test-signature'
      },
      body: JSON.stringify({ type: 'test' })
    });
    
    // We expect this to fail with invalid signature, but endpoint should exist
    if (webhookResponse.status === 404) {
      throw new Error('Webhook endpoint not found');
    }
    
    console.log(`   ✅ Webhook endpoint exists (status: ${webhookResponse.status})\n`);
    
    // Summary
    console.log('✨ Payment Flow Test Complete!\n');
    console.log('Summary:');
    console.log('--------');
    console.log(`📋 Booking Reference: ${booking.bookingReference}`);
    console.log(`🆔 Booking ID: ${booking.id}`);
    console.log(`💳 Payment Intent Created: Yes`);
    console.log(`🔗 Webhook Endpoint: Active`);
    console.log(`📧 Customer Email: ${booking.customer.email}`);
    console.log('\n🎯 Next Steps:');
    console.log('1. Navigate to: http://localhost:3000/booking/payment?bookingId=' + booking.id);
    console.log('2. Use Stripe test card: 4242 4242 4242 4242');
    console.log('3. Any future expiry date and CVC');
    console.log('4. Complete the payment');
    console.log('5. You should be redirected to the confirmation page');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testPaymentFlow().catch(console.error);