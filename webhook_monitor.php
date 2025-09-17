<?php
/**
 * Webhook Security Monitor
 * Run this to check security status
 */

require_once __DIR__ . '/security.php';

// Get security stats
$stats = SecurityHelper::getSecurityStats();

echo "=== Webhook Security Status ===\n";
echo "Current IP: " . $stats['current_ip'] . "\n";
echo "Is Stripe IP: " . ($stats['is_stripe_ip'] ? 'Yes' : 'No') . "\n";
echo "Active rate limit trackers: " . $stats['rate_limit_files'] . "\n";
echo "Request method: " . $stats['method'] . "\n";
echo "Has Stripe signature: " . ($stats['has_stripe_signature'] ? 'Yes' : 'No') . "\n";

// Clean up old files
$cleaned = SecurityHelper::cleanupRateLimits();
echo "\nCleaned up $cleaned old rate limit files\n";

// Show recent log entries
echo "\n=== Recent Security Events ===\n";
if (file_exists('/tmp/webhook_security.log')) {
    $lines = array_slice(file('/tmp/webhook_security.log'), -10);
    foreach ($lines as $line) {
        echo $line;
    }
} else {
    echo "No security events logged yet.\n";
}
