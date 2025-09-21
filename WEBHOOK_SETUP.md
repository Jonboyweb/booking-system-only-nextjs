# Stripe Webhook Setup for Automatic Emails

## The Issue
Your booking confirmation emails aren't being sent automatically because Stripe can't send webhooks to your localhost directly. When a payment completes on Stripe's servers, it needs to notify your app, but it can't reach `localhost:3000`.

## Solution: Use Stripe CLI to Forward Webhooks

### 1. Install Stripe CLI

**Mac (using Homebrew):**
```bash
brew install stripe/stripe-cli/stripe
```

**Linux:**
```bash
# Download the latest linux tar.gz file from GitHub
curl -L https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_x86_64.tar.gz -o stripe.tar.gz
tar -xvf stripe.tar.gz
sudo mv stripe /usr/local/bin
```

**Windows:**
Download from: https://github.com/stripe/stripe-cli/releases/latest

### 2. Login to Stripe
```bash
stripe login
```

### 3. Forward Webhooks to Your Local Server
Run this command in a new terminal:
```bash
stripe listen --forward-to localhost:3000/api/payment/webhook
```

You'll see output like:
```
Ready! You are using Stripe API Version [2024-xx-xx]. Your webhook signing secret is whsec_xxxxxxxxxxxxx (^C to quit)
```

### 4. Update Your Webhook Secret
Copy the webhook signing secret (starts with `whsec_`) and update your `.env` file:
```env
STRIPE_WEBHOOK_SECRET="whsec_your_actual_secret_here"
```

### 5. Restart Your Dev Server
```bash
# Stop the server (Ctrl+C) and start again
npm run dev
```

## How It Works
1. When you make a payment, Stripe processes it
2. Stripe sends a webhook to the CLI
3. The CLI forwards it to your local server at `/api/payment/webhook`
4. Your webhook endpoint updates the booking and sends the confirmation email

## Testing
1. Keep the `stripe listen` command running in a terminal
2. Make a test booking and payment
3. You should see:
   - Webhook events in the Stripe CLI terminal
   - Confirmation email in MailHog at http://localhost:8025

## Manual Email Sending (Backup)
If you need to manually send a confirmation email for any booking:
```bash
npx tsx scripts/send-booking-email.ts
```
This will send an email for the most recent booking.

## Production Setup
In production, you'll configure the webhook endpoint directly in Stripe Dashboard:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/payment/webhook`
3. Select events: `payment_intent.succeeded`, `charge.refunded`
4. Copy the signing secret to your production environment variables