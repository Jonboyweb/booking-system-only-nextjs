# Cloudflare Configuration for Stripe Webhooks

## Problem
Cloudflare's security features are blocking Stripe webhook requests from reaching the application, preventing payment confirmations and email notifications from being processed.

## Solution Options

### Option 1: Create a WAF Exception (Recommended)

1. **Log into Cloudflare Dashboard**
2. Go to **Security → WAF**
3. Click **Create exception**
4. Configure the exception:
   - **Exception name**: "Stripe Webhooks"
   - **When incoming requests match**:
     - Field: "URI Path"
     - Operator: "equals"
     - Value: `/api/payment/webhook`
   - **Then**: Select "Skip" and check:
     - ✓ All managed rules
     - ✓ All rate limiting rules
     - ✓ User Agent Blocking
     - ✓ Browser Integrity Check
   - Click **Deploy**

### Option 2: Create a Page Rule

1. Go to **Rules → Page Rules**
2. Click **Create Page Rule**
3. Enter URL: `*br.door50a.co.uk/api/payment/webhook`
4. Add settings:
   - **Security Level**: Off
   - **Browser Integrity Check**: Off
   - **Always Use HTTPS**: On
5. Click **Save and Deploy**

### Option 3: Whitelist Stripe IPs (Most Secure)

1. Go to **Security → WAF → Tools**
2. Under **IP Access Rules**, add Stripe's webhook IP addresses:
   ```
   3.18.12.63/25
   3.130.192.231/25
   13.235.14.237/25
   13.235.122.149/25
   18.211.135.69/25
   35.154.171.200/29
   52.15.183.38/25
   54.88.130.119/25
   54.88.130.237/25
   54.187.174.169/25
   54.187.205.235/25
   54.187.216.72/25
   ```
3. Set action to **Allow**
4. Add note: "Stripe Webhook IPs"

### Option 4: Bypass Cache for Webhooks

1. Go to **Rules → Page Rules**
2. Create rule for `*br.door50a.co.uk/api/payment/webhook`
3. Set **Cache Level**: Bypass

## Additional Webhook Endpoints to Consider

If you have other webhook endpoints, apply the same rules to:
- `/api/payment/webhook/debug` (if using debug endpoint)
- Any future payment provider webhooks

## Testing After Configuration

After making these changes:

1. Make a test payment through your booking system
2. Check the Stripe Dashboard to verify the webhook was delivered successfully
3. Verify in your admin dashboard that the booking shows as "paid"
4. Confirm that the customer receives the confirmation email

## Troubleshooting

If webhooks still fail after configuration:

1. **Check Stripe Dashboard**
   - Go to Developers → Webhooks
   - Click on your endpoint
   - View "Webhook attempts" to see delivery status

2. **Verify Webhook Secret**
   - Ensure the `STRIPE_WEBHOOK_SECRET` in `.env` matches the one in Stripe Dashboard
   - Different secrets are needed for test vs live mode

3. **Check Application Logs**
   ```bash
   pm2 logs booking-system --lines 100
   ```

## Security Notes

- Option 3 (IP whitelisting) is the most secure as it only allows Stripe's servers
- Always keep HTTPS enabled for webhook endpoints
- Regularly review webhook logs for any suspicious activity
- Keep webhook secrets secure and rotate them periodically

## References

- [Stripe Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Cloudflare WAF Documentation](https://developers.cloudflare.com/waf/)
- [Stripe IP Addresses](https://stripe.com/docs/ips)

---
*Last updated: September 17, 2025*
*Created for: br.door50a.co.uk booking system*