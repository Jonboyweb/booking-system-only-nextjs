<?php
/**
 * Security Helper for Stripe Webhooks and General Protection
 * Place this file in your website root directory
 */

class SecurityHelper {
    private static $rateLimitDir = '/tmp/rate_limits/';
    private static $logFile = '/tmp/webhook_security.log';
    
    /**
     * Initialize rate limiting directory
     */
    public static function init() {
        if (!is_dir(self::$rateLimitDir)) {
            mkdir(self::$rateLimitDir, 0777, true);
        }
    }
    
    /**
     * Check rate limiting
     * @param string $identifier Unique identifier for this rate limit
     * @param int $maxAttempts Maximum attempts allowed
     * @param int $timeWindow Time window in seconds
     * @return bool
     */
    public static function checkRateLimit($identifier, $maxAttempts = 30, $timeWindow = 60) {
        self::init();
        
        // Get the real IP address
        $ip = self::getRealIpAddress();
        
        // Create unique key for this IP and identifier
        $key = md5($identifier . '_' . $ip);
        $file = self::$rateLimitDir . $key;
        
        // Load existing attempts
        $attempts = [];
        if (file_exists($file)) {
            $data = file_get_contents($file);
            $attempts = json_decode($data, true) ?: [];
        }
        
        // Clean old attempts outside the time window
        $cutoff = time() - $timeWindow;
        $attempts = array_filter($attempts, function($timestamp) use ($cutoff) {
            return $timestamp > $cutoff;
        });
        
        // Check if rate limit exceeded
        if (count($attempts) >= $maxAttempts) {
            self::logSecurity("Rate limit exceeded for $identifier from IP: $ip");
            
            // Send proper rate limit response
            http_response_code(429);
            header('Retry-After: ' . $timeWindow);
            die(json_encode([
                'error' => 'Rate limit exceeded',
                'message' => 'Too many requests. Please try again later.',
                'retry_after' => $timeWindow
            ]));
        }
        
        // Add current attempt
        $attempts[] = time();
        
        // Save updated attempts
        file_put_contents($file, json_encode($attempts), LOCK_EX);
        
        return true;
    }
    
    /**
     * Get real IP address (considering CloudFlare and proxies)
     */
    private static function getRealIpAddress() {
        // Check for CloudFlare IP
        if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
            return $_SERVER['HTTP_CF_CONNECTING_IP'];
        }
        
        // Check for proxy headers
        $headers = [
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'HTTP_CLIENT_IP',
        ];
        
        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ips = explode(',', $_SERVER[$header]);
                return trim($ips[0]);
            }
        }
        
        // Fall back to remote address
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }
    
    /**
     * Validate Stripe webhook request
     */
    public static function validateStripeWebhook() {
        $ip = self::getRealIpAddress();
        
        // Step 1: Check if it's a POST request
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            self::logSecurity("Non-POST request to webhook from IP: $ip");
            http_response_code(405);
            header('Allow: POST');
            die(json_encode(['error' => 'Method not allowed']));
        }
        
        // Step 2: Check for Stripe signature header
        if (!isset($_SERVER['HTTP_STRIPE_SIGNATURE'])) {
            self::logSecurity("Missing Stripe signature from IP: $ip");
            http_response_code(401);
            die(json_encode(['error' => 'Missing authentication signature']));
        }
        
        // Step 3: Verify content type
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (strpos($contentType, 'application/json') === false) {
            self::logSecurity("Invalid content type from IP: $ip");
            http_response_code(400);
            die(json_encode(['error' => 'Invalid content type']));
        }
        
        // Step 4: Check request size (Stripe webhooks are typically small)
        $contentLength = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
        if ($contentLength > 65536) { // 64KB max
            self::logSecurity("Oversized request from IP: $ip");
            http_response_code(413);
            die(json_encode(['error' => 'Request too large']));
        }
        
        // Step 5: Log successful validation
        self::logSecurity("Valid webhook request from IP: $ip", 'INFO');
        
        return true;
    }
    
    /**
     * Check if IP is from Stripe (optional extra security)
     */
    public static function isStripeIp() {
        $stripeIps = [
            '3.18.12.63',
            '3.130.192.231',
            '13.59.105.36',
            '13.235.14.237',
            '13.235.122.149',
            '18.211.135.69',
            '35.154.171.200',
            '52.15.183.38',
            '54.88.130.119',
            '54.88.130.237',
            '54.187.174.169',
            '54.187.205.235',
            '54.187.216.72'
        ];
        
        $clientIp = self::getRealIpAddress();
        return in_array($clientIp, $stripeIps);
    }
    
    /**
     * Log security events
     */
    private static function logSecurity($message, $level = 'WARNING') {
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[$timestamp] [$level] $message" . PHP_EOL;
        
        // Write to custom log file
        file_put_contents(self::$logFile, $logMessage, FILE_APPEND | LOCK_EX);
        
        // Also log to PHP error log
        error_log("WEBHOOK_SECURITY: $message");
    }
    
    /**
     * Clean up old rate limit files (run via cron)
     */
    public static function cleanupRateLimits() {
        $files = glob(self::$rateLimitDir . '*');
        $cleaned = 0;
        
        foreach ($files as $file) {
            // Remove files older than 1 hour
            if (filemtime($file) < time() - 3600) {
                unlink($file);
                $cleaned++;
            }
        }
        
        self::logSecurity("Cleaned up $cleaned old rate limit files", 'INFO');
        return $cleaned;
    }
    
    /**
     * Get security stats (useful for monitoring)
     */
    public static function getSecurityStats() {
        $stats = [
            'rate_limit_files' => count(glob(self::$rateLimitDir . '*')),
            'current_ip' => self::getRealIpAddress(),
            'is_stripe_ip' => self::isStripeIp(),
            'method' => $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN',
            'has_stripe_signature' => isset($_SERVER['HTTP_STRIPE_SIGNATURE'])
        ];
        
        return $stats;
    }
}
