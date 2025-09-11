# Stripe Webhook Setup

## Local Development

For local development, Stripe webhooks need to be forwarded to your local server using the Stripe CLI.

### Prerequisites
- Stripe CLI installed (`stripe` command available)
- Development server running on port 3000

### Setup Steps

1. **Start the development server:**
   ```bash
   npm run dev
   ```
   Or with PM2:
   ```bash
   pm2 start ecosystem.config.js
   ```

2. **Start Stripe webhook forwarding:**
   ```bash
   stripe listen --forward-to localhost:3000/api/payment/webhook \
     --events payment_intent.succeeded,payment_intent.payment_failed,charge.refunded
   ```

3. **Verify the webhook secret:**
   The webhook secret shown in the terminal should match the `STRIPE_WEBHOOK_SECRET` in your `.env` file:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_f88184a96e17e43150d0c813820a242353f721973f8fcbc9606b20d17ae3310c
   ```

### Testing

1. Create a booking through the website
2. Use Stripe test card: `4242 4242 4242 4242`
3. The webhook should:
   - Update booking status to CONFIRMED
   - Mark deposit as paid
   - Send confirmation email
   - Create payment log

### Manual Payment Processing

If webhooks fail, you can manually process a payment:

```bash
npx tsx scripts/process-payment.ts
```

Edit the script to change the booking reference if needed.

### Troubleshooting

**Webhook not received:**
- Ensure Stripe CLI is running and forwarding to the correct port
- Check that the webhook secret in `.env` matches the one shown by Stripe CLI
- Verify the development server is running on the expected port

**Payment successful but booking not updated:**
- Check the booking has a valid `stripeIntentId`
- Verify the payment intent metadata contains the `bookingId`
- Check logs for any errors in the webhook handler

**Email not sent:**
- Verify SendGrid API key is valid
- Check SendGrid from email is verified
- Review email logs for specific errors

## Production Setup

For production, configure the webhook endpoint directly in your Stripe Dashboard:

1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `https://yourdomain.com/api/payment/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copy the signing secret and update your production environment variables

### Environment Variables

Ensure these are set in production:
- `STRIPE_SECRET_KEY` - Your live Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - The webhook signing secret from Stripe Dashboard
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Your live publishable key
- `SENDGRID_API_KEY` - Your SendGrid API key
- `SENDGRID_FROM_EMAIL` - Verified sender email