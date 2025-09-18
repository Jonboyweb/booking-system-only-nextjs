#!/usr/bin/env node

/**
 * GitHub Webhook Server for Automatic Deployment
 * Receives webhook events from GitHub and triggers deployment script
 */

const express = require('express');
const crypto = require('crypto');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Configuration
const PORT = process.env.WEBHOOK_PORT || 9001;
const SECRET = process.env.GITHUB_WEBHOOK_SECRET;
const DEPLOY_SCRIPT = path.join(__dirname, 'deploy-prod.sh');
const LOG_FILE = path.join(__dirname, '..', 'logs', 'webhook.log');

// Ensure logs directory exists
const logsDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Initialize Express app
const app = express();

// Middleware to capture raw body for signature verification
app.use(express.json({
    verify: (req, res, buf, encoding) => {
        req.rawBody = buf.toString(encoding || 'utf8');
    }
}));

// Logging function
function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;
    
    console.log(logMessage.trim());
    fs.appendFileSync(LOG_FILE, logMessage);
}

// Function to verify GitHub webhook signature
function verifySignature(payload, signature) {
    if (!SECRET) {
        log('WARNING: No webhook secret configured. Skipping signature verification.', 'WARN');
        return true;
    }
    
    if (!signature) {
        log('No signature provided in request', 'ERROR');
        return false;
    }
    
    const hmac = crypto.createHmac('sha256', SECRET);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');
    
    // Use timing-safe comparison
    if (signature.length !== digest.length) {
        return false;
    }
    
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(digest)
    );
}

// Function to execute deployment script
function executeDeploy(commitInfo) {
    log(`Starting deployment for commit: ${commitInfo.id} by ${commitInfo.author}`);
    
    exec(DEPLOY_SCRIPT, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) {
            log(`Deployment failed: ${error.message}`, 'ERROR');
            if (stderr) {
                log(`Deployment stderr: ${stderr}`, 'ERROR');
            }
            return;
        }
        
        if (stdout) {
            log(`Deployment output: ${stdout}`);
        }
        
        log(`Deployment completed successfully for commit ${commitInfo.id}`);
    });
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'github-webhook-server',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// GitHub webhook endpoint
app.post('/webhook', (req, res) => {
    const signature = req.headers['x-hub-signature-256'];
    const event = req.headers['x-github-event'];
    const delivery = req.headers['x-github-delivery'];
    
    log(`Received webhook: Event=${event}, Delivery=${delivery}`);
    
    // Verify signature
    if (!verifySignature(req.rawBody, signature)) {
        log('Invalid signature', 'ERROR');
        return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Handle different event types
    if (event === 'ping') {
        log('Received ping event from GitHub');
        return res.json({ message: 'Pong!' });
    }
    
    if (event === 'push') {
        const payload = req.body;
        
        // Only deploy for main branch
        if (payload.ref !== 'refs/heads/main') {
            log(`Ignoring push to non-main branch: ${payload.ref}`);
            return res.json({ message: 'Ignored: not main branch' });
        }
        
        // Don't deploy if commits are empty (e.g., branch deletion)
        if (!payload.commits || payload.commits.length === 0) {
            log('Ignoring push with no commits');
            return res.json({ message: 'Ignored: no commits' });
        }
        
        // Extract commit information
        const latestCommit = payload.head_commit || payload.commits[0];
        const commitInfo = {
            id: latestCommit.id.substring(0, 7),
            message: latestCommit.message,
            author: latestCommit.author.name,
            timestamp: latestCommit.timestamp
        };
        
        log(`Push to main branch detected: ${commitInfo.message}`);
        
        // Respond immediately to GitHub
        res.json({ message: 'Deployment triggered' });
        
        // Execute deployment asynchronously
        setTimeout(() => executeDeploy(commitInfo), 1000);
        
        return;
    }
    
    // Ignore other events
    log(`Ignoring event: ${event}`);
    res.json({ message: `Event ${event} ignored` });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
    log(`Server error: ${err.message}`, 'ERROR');
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '127.0.0.1', () => {
    log(`GitHub webhook server started on port ${PORT}`);
    log(`Webhook endpoint: http://127.0.0.1:${PORT}/webhook`);
    log(`Health check: http://127.0.0.1:${PORT}/health`);

    if (!SECRET) {
        log('WARNING: Running without webhook secret. Set GITHUB_WEBHOOK_SECRET for production.', 'WARN');
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    log('Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    log('Received SIGINT, shutting down gracefully...');
    process.exit(0);
});