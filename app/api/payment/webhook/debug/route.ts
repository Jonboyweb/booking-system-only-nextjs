import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Debug webhook endpoint to log all incoming webhook attempts
export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');
  
  console.log('\n🔔 WEBHOOK DEBUG - Incoming Request:');
  console.log('  Timestamp:', new Date().toISOString());
  console.log('  Signature present:', !!signature);
  console.log('  Signature (first 30 chars):', signature?.substring(0, 30) || 'None');
  console.log('  Body length:', body.length);
  console.log('  ENV webhook secret (first 20):', process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 20));
  
  try {
    const event = JSON.parse(body);
    console.log('  Event type:', event.type);
    console.log('  Event ID:', event.id);
    
    if (event.type === 'payment_intent.succeeded') {
      console.log('  Payment Intent ID:', event.data?.object?.id);
      console.log('  Metadata:', event.data?.object?.metadata);
    }
  } catch (e) {
    console.log('  Could not parse body as JSON');
  }
  
  console.log('---\n');
  
  return NextResponse.json({ received: true, debug: true });
}