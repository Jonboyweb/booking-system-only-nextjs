# Production Deployment Guide

## Stripe Webhook Configuration

### Production Setup (No Stripe CLI Required)

#### 1. Configure Stripe Webhook Endpoint
1. Go to [Stripe Dashboard Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your production URL: `https://yourdomain.com/api/payment/webhook`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`

#### 2. Get Production Webhook Secret
- Stripe will provide a production webhook secret (starts with `whsec_`)
- This is a permanent secret for your production endpoint
- Add this to your production environment variables

#### 3. Production Environment Variables
Set these on your VPS/production server:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/backroom"

# Stripe (Production)
STRIPE_SECRET_KEY="sk_live_..."  # Use live key for production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."  # Use live key for production
STRIPE_WEBHOOK_SECRET="whsec_..."  # From webhook endpoint setup in Stripe Dashboard

# Email
SENDGRID_API_KEY="SG...."
SENDGRID_FROM_EMAIL="admin@backroomleeds.co.uk"

# Application
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
JWT_SECRET="your-secure-secret-key"  # Generate a strong secret for production
```

## Key Differences: Local vs Production

### Local Development
- **Webhook Forwarding**: Uses Stripe CLI to forward webhooks
- **Webhook Secret**: Temporary secret generated per CLI session
- **API Keys**: Test mode keys (`sk_test_...`, `pk_test_...`)
- **URL**: `http://localhost:3000`
- **Command**: `stripe listen --forward-to localhost:3000/api/payment/webhook`

### Production
- **Webhook Forwarding**: Direct webhook endpoint (no CLI needed)
- **Webhook Secret**: Permanent secret from Stripe Dashboard
- **API Keys**: Live mode keys (`sk_live_...`, `pk_live_...`) when ready
- **URL**: `https://yourdomain.com`
- **No CLI Required**: Stripe sends webhooks directly to your public URL

## Important Notes

1. **Stripe CLI is NOT needed in production** - it's only for local development testing
2. **Test with test keys first** - You can use test keys (`sk_test_...`) even in production for testing
3. **Switch to live keys** when ready to accept real payments
4. **Secure your webhook endpoint** - The webhook secret validates that requests come from Stripe
5. **HTTPS is required** for production webhook endpoints

## Deployment Steps

1. Deploy application to VPS
2. Set all environment variables
3. Configure Stripe webhook endpoint in Dashboard
4. Test with test keys first
5. Switch to live keys when ready for production

## Testing Production Webhooks

Before going live:
1. Deploy with test keys
2. Make test bookings
3. Verify webhook events in Stripe Dashboard
4. Check payment logs in admin dashboard
5. Confirm emails are being sent
6. Switch to live keys only after thorough testing