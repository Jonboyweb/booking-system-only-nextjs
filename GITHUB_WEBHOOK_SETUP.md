# GitHub Webhook Auto-Deployment Setup

This guide explains how to set up automatic deployment from GitHub to your production server.

## Overview

The system uses GitHub webhooks to automatically deploy changes when you push to the `main` branch. Here's how it works:

1. You push code to the `main` branch on GitHub
2. GitHub sends a webhook to your server
3. The webhook server validates the request and triggers the deployment script
4. The deployment script pulls changes, builds, and restarts the application

## Components

### 1. Deployment Script (`scripts/deploy.sh`)
- Pulls latest changes from GitHub
- Installs dependencies if needed
- Builds the Next.js application
- Restarts the PM2 process
- Creates backups and handles rollbacks on failure

### 2. Webhook Server (`scripts/webhook-server.js`)
- Listens for GitHub webhook events on port 9001
- Validates webhook signatures for security
- Triggers deployment for pushes to main branch

### 3. PM2 Configuration (`ecosystem.config.js`)
- Manages both the main application and webhook server
- Ensures services restart automatically

## Local Server Setup

### 1. Start the Webhook Server

```bash
# Load environment variables and start webhook server
pm2 start ecosystem.config.js --only webhook-server

# Or start all services
pm2 start ecosystem.config.js

# Check status
pm2 status
```

### 2. Verify Webhook Server is Running

```bash
# Check health endpoint
curl http://localhost:9001/health

# Check PM2 logs
pm2 logs webhook-server
```

### 3. Configure Nginx (if using)

Add this to your Nginx configuration to proxy webhook requests:

```nginx
location /github-webhook {
    proxy_pass http://127.0.0.1:9001/webhook;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Important: Pass GitHub headers
    proxy_set_header X-Hub-Signature-256 $http_x_hub_signature_256;
    proxy_set_header X-GitHub-Event $http_x_github_event;
    proxy_set_header X-GitHub-Delivery $http_x_github_delivery;
    
    # Increase buffer size for webhook payloads
    proxy_buffers 8 32k;
    proxy_buffer_size 64k;
}
```

Then reload Nginx:
```bash
sudo nginx -s reload
```

## GitHub Configuration

### 1. Navigate to Repository Settings

1. Go to your repository: https://github.com/Jonboyweb/booking-system-only-nextjs
2. Click on **Settings** tab
3. In the left sidebar, click **Webhooks**
4. Click **Add webhook**

### 2. Configure the Webhook

Fill in the following details:

- **Payload URL**: 
  - If using Nginx: `http://YOUR_SERVER_IP/github-webhook`
  - If direct access: `http://YOUR_SERVER_IP:9001/webhook`
  - For testing with ngrok: `https://YOUR_NGROK_URL/webhook`

- **Content type**: `application/json`

- **Secret**: `13fb9528018911d45f6fdfe3ecbea53e0d98ebf04bfae08f76dc070cad43a627`
  (This is the value from your `.env` file's `GITHUB_WEBHOOK_SECRET`)

- **SSL verification**: Enable SSL verification (if using HTTPS)

- **Which events would you like to trigger this webhook?**
  - Select "Just the push event"

- **Active**: Check this box

### 3. Save the Webhook

Click **Add webhook** to save.

### 4. Test the Webhook

After saving, GitHub will send a ping event. Check if it was received:

1. In GitHub, click on your webhook
2. Go to the **Recent Deliveries** tab
3. You should see a delivery with a green checkmark
4. Click on it to see the request and response details

On your server, check the logs:
```bash
# Check webhook server logs
pm2 logs webhook-server --lines 50

# Check deployment logs
tail -f /home/cdev/booking-system-only-nextjs/logs/deploy.log
```

## Testing the Full Deployment

### 1. Make a Test Change

Create a small change in your repository:

```bash
# On your local machine
echo "<!-- Deployment test -->" >> README.md
git add README.md
git commit -m "Test automatic deployment"
git push origin main
```

### 2. Monitor the Deployment

On your server, watch the logs:

```bash
# Watch webhook logs
pm2 logs webhook-server --lines 100

# Watch deployment progress
tail -f logs/deploy.log

# Check application status
pm2 status
```

### 3. Verify Deployment Success

1. Check that the latest commit is deployed:
   ```bash
   git log -1 --oneline
   ```

2. Verify the application is running:
   ```bash
   pm2 status booking-system
   curl http://localhost:3000/api/health
   ```

## Troubleshooting

### Webhook Not Received

1. Check webhook server is running:
   ```bash
   pm2 status webhook-server
   ```

2. Check firewall allows port 9001 (if not using Nginx):
   ```bash
   sudo ufw status
   sudo ufw allow 9001  # If needed
   ```

3. Test locally:
   ```bash
   curl -X POST http://localhost:9001/webhook \
     -H "Content-Type: application/json" \
     -H "X-GitHub-Event: ping" \
     -d '{"zen": "test"}'
   ```

### Deployment Fails

1. Check deployment logs:
   ```bash
   tail -100 logs/deploy.log
   ```

2. Check for lock file:
   ```bash
   ls -la /tmp/booking-system-deploy.lock
   rm /tmp/booking-system-deploy.lock  # If stuck
   ```

3. Manually run deployment:
   ```bash
   ./scripts/deploy.sh
   ```

### Signature Validation Fails

1. Ensure the secret in `.env` matches GitHub webhook configuration
2. Check that environment variables are loaded:
   ```bash
   pm2 env webhook-server
   ```

## Security Considerations

1. **Always use webhook secret**: Never run without `GITHUB_WEBHOOK_SECRET`
2. **Restrict webhook server**: Only bind to localhost (127.0.0.1)
3. **Use HTTPS in production**: Set up SSL certificate with Let's Encrypt
4. **Limit GitHub IPs**: Optionally restrict to GitHub's IP ranges
5. **Monitor logs**: Regularly check webhook and deployment logs for suspicious activity

## Monitoring

### Set up PM2 Monitoring

```bash
# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
# Follow the instructions it provides

# Monitor all processes
pm2 monit
```

### Log Rotation

Set up log rotation to prevent logs from growing too large:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Manual Deployment

If you need to deploy manually:

```bash
cd /home/cdev/booking-system-only-nextjs
./scripts/deploy.sh
```

## Rollback

If a deployment fails, the script automatically attempts to rollback. To manually rollback:

```bash
cd /home/cdev/booking-system-only-nextjs

# Restore from backup
tar -xzf backups/backup-YYYYMMDD-HHMMSS.tar.gz

# Reset to previous commit
git reset --hard HEAD~1

# Restart application
pm2 restart booking-system
```

## Support

For issues with:
- **Deployment script**: Check `logs/deploy.log`
- **Webhook server**: Check `pm2 logs webhook-server`
- **Application**: Check `pm2 logs booking-system`
- **GitHub webhooks**: Check webhook deliveries in GitHub repository settings

---

**Note**: Remember to keep your webhook secret secure and never commit it to version control!