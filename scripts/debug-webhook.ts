#!/usr/bin/env tsx

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('🔍 Webhook Configuration Debug\n');

// Check environment variables
console.log('Environment Variables:');
console.log('  STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? 
  `Set (${process.env.STRIPE_WEBHOOK_SECRET.substring(0, 20)}...)` : 'NOT SET');
console.log('  STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'Set' : 'NOT SET');
console.log('  SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'Set' : 'NOT SET');
console.log('  SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL || 'NOT SET');

console.log('\n📝 Instructions to fix webhook issues:\n');
console.log('1. Make sure Stripe CLI is running:');
console.log('   stripe listen --forward-to localhost:3000/api/payment/webhook\n');
console.log('2. Copy the webhook secret from the CLI output that looks like:');
console.log('   "Your webhook signing secret is whsec_xxxxx"\n');
console.log('3. Update .env.local with the new secret:');
console.log('   STRIPE_WEBHOOK_SECRET="whsec_xxxxx"\n');
console.log('4. Restart your Next.js server:');
console.log('   npm run dev\n');
console.log('5. Make a test payment in the frontend\n');

console.log('Current webhook secret starts with:', 
  process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 20) || 'NOT SET');
console.log('\nIf this doesn\'t match what Stripe CLI shows, that\'s the problem!');