# Email Module - The Backroom Leeds

## Overview
This module handles all email communications for The Backroom Leeds booking system using SendGrid.

## Features
- Booking confirmation emails with prohibition-themed HTML templates
- Test email functionality for system verification
- Automatic email sending on successful payment via Stripe webhook

## Setup

### Environment Variables
Add the following to your `.env.local`:

```env
# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=admin@backroomleeds.co.uk
```

### SendGrid Account Setup
1. Create a SendGrid account at https://sendgrid.com
2. Verify your sender email address
3. Generate an API key with "Mail Send" permissions
4. Add the API key to your environment variables

## Usage

### Sending Booking Confirmation
The booking confirmation email is automatically sent when:
1. A customer completes payment through Stripe
2. The Stripe webhook receives the `payment_intent.succeeded` event
3. The booking status is updated to `CONFIRMED`

### Manual Email Sending
```typescript
import { sendBookingConfirmationEmail } from '@/src/lib/email/sendgrid';

// Send confirmation email
const success = await sendBookingConfirmationEmail(booking);
```

### Testing Emails
```bash
# Test email functionality
npx tsx scripts/test-email.ts recipient@example.com

# Test complete booking flow with email
npx tsx scripts/test-booking-with-email.ts recipient@example.com

# Test via API endpoint
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## Email Templates

### Booking Confirmation
Location: `src/lib/email/templates/booking-confirmation.ts`

The confirmation email includes:
- Booking reference number
- Date and time of reservation
- Table details
- Party size
- Drinks package or custom bottle selections
- Payment confirmation
- Venue information
- Important policies

### Styling
- Prohibition-era themed design
- Georgia serif font
- Gold (#d4af37) and dark brown (#2c1810) color scheme
- Responsive HTML layout

## API Endpoints

### POST /api/email/test
Test email sending functionality.

Request:
```json
{
  "email": "recipient@example.com"
}
```

Response:
```json
{
  "message": "Test email sent successfully to recipient@example.com"
}
```

## Webhook Integration
The email system is integrated with the Stripe webhook at `/api/payment/webhook`:
1. Receives payment confirmation from Stripe
2. Updates booking status to CONFIRMED
3. Formats booking data for email template
4. Sends confirmation email to customer
5. Logs success/failure (doesn't fail the webhook on email error)

## Error Handling
- Missing API key: Logs error, returns false
- Missing email address: Logs error, returns false
- SendGrid API errors: Logs detailed error, returns false
- Webhook email failures: Logged but don't fail the payment process

## Testing Checklist
- [ ] SendGrid API key is configured
- [ ] From email address is verified in SendGrid
- [ ] Test email sends successfully
- [ ] Booking confirmation template renders correctly
- [ ] Stripe webhook triggers email on payment
- [ ] Email contains correct booking details
- [ ] HTML renders properly in email clients

## Troubleshooting

### Email not sending
1. Check SendGrid API key is set correctly
2. Verify sender email is authenticated in SendGrid
3. Check SendGrid dashboard for bounces/blocks
4. Review server logs for detailed error messages

### Template issues
1. Test with different email clients
2. Verify all booking data is properly formatted
3. Check for missing required fields

### Webhook not triggering emails
1. Verify webhook secret is configured
2. Check Stripe webhook endpoint is active
3. Review webhook logs in Stripe dashboard
4. Ensure booking includes customer email