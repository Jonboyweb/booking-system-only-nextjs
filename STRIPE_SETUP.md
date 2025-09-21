# Stripe Setup Instructions

## The Issue
Your payment flow is not working because the Stripe API keys in `.env` are placeholder values. You need to replace them with real Stripe test keys.

## Current Placeholder Values (NOT WORKING)
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_51234567890abcdefghijklmnopqrstuvwxyz"
STRIPE_SECRET_KEY="sk_test_51234567890abcdefghijklmnopqrstuvwxyz"
STRIPE_WEBHOOK_SECRET="whsec_1234567890abcdefghijklmnopqrstuvwxyz"
```

## How to Get Real Stripe Test Keys

### 1. Get Your Test API Keys
1. Go to https://dashboard.stripe.com (sign up if needed)
2. Make sure you're in **Test Mode** (toggle in the top-right)
3. Go to **Developers** → **API Keys**
4. Copy your test keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### 2. Update Your `.env` File
Replace the placeholder values with your real test keys:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your_real_pk_test_key_here"
STRIPE_SECRET_KEY="your_real_sk_test_key_here"
```

### 3. Set Up Webhook (Optional for local testing)
For local webhook testing with Stripe CLI:
```bash
# Install Stripe CLI (if not installed)
# Mac: brew install stripe/stripe-cli/stripe
# Windows: Download from https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/payment/webhook

# Copy the webhook signing secret that appears and update .env:
# STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 4. Restart Your Development Server
After updating the `.env` file:
```bash
# Stop the server (Ctrl+C)
# Start it again
npm run dev
```

## Test Card Numbers
Once you have real test keys, use these test cards:
- **Success**: 4242 4242 4242 4242
- **Requires authentication**: 4000 0000 0000 3220
- **Declined**: 4000 0000 0000 9995

Use any future date for expiry and any 3-digit CVC.

## Verification
After setting up real keys, the payment flow should work:
1. Create a booking
2. Get redirected to payment page
3. Enter test card details
4. Complete payment
5. See confirmation page

## Troubleshooting
If still not working after adding real keys:
1. Check browser console for errors (F12 → Console)
2. Check server logs in terminal
3. Verify keys start with `pk_test_` and `sk_test_`
4. Make sure you're using Test Mode keys, not Live keys