<?php
/**
 * Stripe Webhook Handler
 * URL: https://yourdomain.com/stripe_webhook.php
 */

// Load security helper FIRST
require_once __DIR__ . '/security.php';

// Apply rate limiting - 30 requests per minute per IP
SecurityHelper::checkRateLimit('stripe_webhook', 30, 60);

// Validate this is a legitimate webhook request
SecurityHelper::validateStripeWebhook();

// Load Stripe SDK (adjust path if needed)
require_once __DIR__ . '/vendor/autoload.php';

// Your Stripe webhook secret (get from Stripe Dashboard)
$webhook_secret = 'whsec_your_webhook_secret_here'; // CHANGE THIS!

// Set Stripe API key
\Stripe\Stripe::setApiKey('sk_live_your_stripe_secret_key'); // CHANGE THIS!

// Get the webhook payload and signature
$payload = file_get_contents('php://input');
$sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

try {
    // Verify webhook signature
    $event = \Stripe\Webhook::constructEvent(
        $payload,
        $sig_header,
        $webhook_secret
    );
    
} catch(\UnexpectedValueException $e) {
    // Invalid payload
    http_response_code(400);
    exit();
    
} catch(\Stripe\Exception\SignatureVerificationException $e) {
    // Invalid signature
    http_response_code(400);
    exit();
}

// Handle the event
try {
    switch ($event->type) {
        case 'payment_intent.succeeded':
            $paymentIntent = $event->data->object;
            handlePaymentSuccess($paymentIntent);
            break;
            
        case 'payment_intent.payment_failed':
            $paymentIntent = $event->data->object;
            handlePaymentFailure($paymentIntent);
            break;
            
        case 'checkout.session.completed':
            $session = $event->data->object;
            handleCheckoutComplete($session);
            break;
            
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
            $subscription = $event->data->object;
            handleSubscriptionChange($subscription);
            break;
            
        default:
            // Unexpected event type
            error_log('Unhandled Stripe event type: ' . $event->type);
    }
    
    // Return success response
    http_response_code(200);
    echo json_encode(['status' => 'success']);
    
} catch (Exception $e) {
    // Log error
    error_log('Stripe webhook error: ' . $e->getMessage());
    
    // Return error response
    http_response_code(500);
    echo json_encode(['error' => 'Webhook handler error']);
}

// ============= YOUR BUSINESS LOGIC FUNCTIONS =============

function handlePaymentSuccess($paymentIntent) {
    // Example: Update booking status in database
    $bookingId = $paymentIntent->metadata->booking_id ?? null;
    
    if ($bookingId) {
        // Update your database
        // $db->query("UPDATE bookings SET status = 'paid' WHERE id = ?", [$bookingId]);
        
        // Send confirmation email
        // sendBookingConfirmation($bookingId);
        
        error_log("Payment succeeded for booking: $bookingId");
    }
}

function handlePaymentFailure($paymentIntent) {
    // Handle failed payment
    $bookingId = $paymentIntent->metadata->booking_id ?? null;
    
    if ($bookingId) {
        // Update booking status
        // $db->query("UPDATE bookings SET status = 'payment_failed' WHERE id = ?", [$bookingId]);
        
        error_log("Payment failed for booking: $bookingId");
    }
}

function handleCheckoutComplete($session) {
    // Handle completed checkout session
    error_log("Checkout completed: " . $session->id);
    
    // Process the order
    // createOrderFromSession($session);
}

function handleSubscriptionChange($subscription) {
    // Handle subscription changes
    error_log("Subscription event: " . $subscription->id);
}
