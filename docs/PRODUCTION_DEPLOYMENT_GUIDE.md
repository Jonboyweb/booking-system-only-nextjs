# Production Deployment Guide: VPS with CloudPanel & Cloudflare Tunnels

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [VPS & CloudPanel Setup](#vps--cloudpanel-setup)
4. [Cloudflare Tunnels Configuration](#cloudflare-tunnels-configuration)
5. [Application Deployment](#application-deployment)
6. [Automatic Deployment via GitHub Webhooks](#automatic-deployment-via-github-webhooks)
7. [Security Considerations](#security-considerations)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)

## Overview

This guide covers deploying the booking system to a production VPS using CloudPanel for server management and Cloudflare Tunnels for secure public access without exposing server ports.

### Benefits of This Setup

- **CloudPanel**: Easy server management with GUI, automatic SSL, built-in monitoring
- **Cloudflare Tunnels**: No exposed ports, DDoS protection, automatic SSL, no port forwarding
- **GitHub Webhooks**: Automatic deployment on push to main branch
- **PM2**: Process management with auto-restart and clustering capabilities

## Architecture

```
[GitHub Repository]
        ↓ (webhook on push)
[Cloudflare Network]
        ↓ (tunnel)
[Your VPS Server]
   ├── CloudPanel (port 8443)
   ├── Cloudflare Tunnel (cloudflared)
   ├── Node.js Application (port 3000)
   ├── Webhook Server (port 9001)
   ├── PostgreSQL Database (port 5432)
   └── PM2 Process Manager
```

## VPS & CloudPanel Setup

### 1. VPS Requirements

- **Minimum Specs**: 2 vCPU, 4GB RAM, 40GB SSD
- **Recommended OS**: Ubuntu 22.04 LTS
- **Providers**: DigitalOcean, Linode, Vultr, Hetzner

### 2. Install CloudPanel

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Install CloudPanel (v2)
curl -sS https://installer.cloudpanel.io/ce/v2/install.sh | sudo bash
```

### 3. CloudPanel Initial Configuration

1. Access CloudPanel at: `https://your-vps-ip:8443`
2. Create admin account
3. Add your domain in CloudPanel
4. Create a Node.js site:
   - Site Type: Node.js
   - Node Version: 18.x or higher
   - Domain: your-domain.com
   - App Port: 3000

### 4. Configure CloudPanel Node.js Site

In CloudPanel's Node.js settings:

```yaml
Root Directory: /home/cloudpanel/htdocs/your-domain.com
App File: npm start
Node Version: 18
Port: 3000
```

### 5. Install Additional Requirements

```bash
# SSH as cloudpanel user
sudo su - cloudpanel
cd ~/htdocs/your-domain.com

# Install PM2 globally
npm install -g pm2

# Install PostgreSQL if not already installed
sudo apt install postgresql postgresql-contrib -y

# Create database and user
sudo -u postgres psql
CREATE DATABASE backroom_bookings;
CREATE USER backroom_user WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE backroom_bookings TO backroom_user;
\q
```

## Cloudflare Tunnels Configuration

### 1. Prerequisites

- Cloudflare account (free tier is sufficient)
- Domain added to Cloudflare (or use Cloudflare's provided subdomain)

### 2. Install Cloudflare Tunnel on VPS

```bash
# Add Cloudflare GPG key
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-archive-keyring.gpg >/dev/null

# Add repository
echo "deb [signed-by=/usr/share/keyrings/cloudflare-archive-keyring.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflared.list

# Install cloudflared
sudo apt update
sudo apt install cloudflared -y
```

### 3. Authenticate Cloudflare Tunnel

```bash
# Login to Cloudflare
cloudflared tunnel login

# This will open a browser window for authentication
# Copy the cert.pem file location (usually ~/.cloudflared/cert.pem)
```

### 4. Create a Tunnel

```bash
# Create a tunnel
cloudflared tunnel create booking-system-tunnel

# Note the Tunnel ID that's returned
# You'll see something like: Created tunnel booking-system-tunnel with id <TUNNEL_ID>
```

### 5. Configure Tunnel Routes

Create configuration file:

```bash
nano ~/.cloudflared/config.yml
```

Add this configuration:

```yaml
tunnel: <YOUR_TUNNEL_ID>
credentials-file: /home/cloudpanel/.cloudflared/<TUNNEL_ID>.json

ingress:
  # Main application
  - hostname: booking.your-domain.com
    service: http://localhost:3000
    originRequest:
      noTLSVerify: true
      
  # Webhook endpoint
  - hostname: webhooks.your-domain.com
    service: http://localhost:9001
    originRequest:
      noTLSVerify: true
      
  # Or use path-based routing
  - hostname: your-domain.com
    path: /github-webhook/*
    service: http://localhost:9001
    originRequest:
      noTLSVerify: true
      
  - hostname: your-domain.com
    service: http://localhost:3000
    originRequest:
      noTLSVerify: true
      
  # Catch-all
  - service: http_status:404
```

### 6. Create DNS Routes

```bash
# Route your domain through the tunnel
cloudflared tunnel route dns booking-system-tunnel booking.your-domain.com
cloudflared tunnel route dns booking-system-tunnel webhooks.your-domain.com
```

### 7. Run Tunnel as a Service

```bash
# Install as systemd service
sudo cloudflared service install

# Start the service
sudo systemctl start cloudflared
sudo systemctl enable cloudflared

# Check status
sudo systemctl status cloudflared
```

## Application Deployment

### 1. Clone Repository

```bash
# As cloudpanel user
sudo su - cloudpanel
cd ~/htdocs/your-domain.com

# Clone your repository
git clone https://github.com/Jonboyweb/booking-system-only-nextjs.git .
```

### 2. Environment Configuration

```bash
# Copy and configure environment variables
cp .env.example .env
nano .env
```

Update `.env` with production values:

```env
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://booking.your-domain.com

# Database (use CloudPanel's database or your PostgreSQL)
DATABASE_URL="postgresql://backroom_user:your-password@localhost:5432/backroom_bookings?schema=public"

# Stripe (use production keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# GitHub Webhook
GITHUB_WEBHOOK_SECRET="your-generated-secret"
WEBHOOK_PORT=9001

# Email (SendGrid)
SENDGRID_API_KEY="SG...."
EMAIL_FROM="bookings@your-domain.com"
EMAIL_FROM_NAME="Your Restaurant Name"

# JWT Secret
JWT_SECRET="your-very-long-random-string"
```

### 3. Install Dependencies and Build

```bash
# Install dependencies
npm ci --production=false

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Build the application
npm run build

# Create necessary directories
mkdir -p logs backups
```

### 4. PM2 Configuration for Production

Update `ecosystem.config.js` for production:

```javascript
module.exports = {
  apps: [
    {
      name: 'booking-system',
      script: 'npm',
      args: 'start',
      cwd: '/home/cloudpanel/htdocs/your-domain.com',
      instances: 2, // Use 2 instances for load balancing
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'webhook-server',
      script: './scripts/webhook-server.js',
      cwd: '/home/cloudpanel/htdocs/your-domain.com',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        WEBHOOK_PORT: 9001
      },
      error_file: './logs/webhook-error.log',
      out_file: './logs/webhook-out.log',
      log_file: './logs/webhook-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
```

### 5. Start Services with PM2

```bash
# Start all services
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd -u cloudpanel --hp /home/cloudpanel
# Follow the command it outputs
```

## Automatic Deployment via GitHub Webhooks

### 1. Update Deployment Script for Production

Edit `scripts/deploy.sh`:

```bash
#!/bin/bash

# Production deployment configuration
DEPLOY_DIR="/home/cloudpanel/htdocs/your-domain.com"
LOG_DIR="$DEPLOY_DIR/logs"
DEPLOY_LOG="$LOG_DIR/deploy.log"
LOCK_FILE="/tmp/booking-system-deploy.lock"
BACKUP_DIR="$DEPLOY_DIR/backups"
PM2_APP_NAME="booking-system"

# ... rest of the script remains the same
```

### 2. Configure GitHub Webhook

1. Go to your GitHub repository settings
2. Navigate to Webhooks → Add webhook
3. Configure:
   - **Payload URL**: 
     - If using subdomain: `https://webhooks.your-domain.com/webhook`
     - If using path: `https://your-domain.com/github-webhook/webhook`
   - **Content type**: `application/json`
   - **Secret**: Your `GITHUB_WEBHOOK_SECRET` from `.env`
   - **Events**: Just the push event
   - **Active**: ✓

### 3. Test Webhook

```bash
# Check webhook server logs
pm2 logs webhook-server

# Make a test commit
echo "<!-- Deployment test -->" >> README.md
git add README.md
git commit -m "Test automatic deployment"
git push origin main

# Monitor deployment
tail -f logs/deploy.log
```

## Security Considerations

### 1. CloudPanel Security

```bash
# Change CloudPanel default port
nano /etc/cloudpanel/cloudpanel.conf
# Change port from 8443 to custom port

# Enable 2FA in CloudPanel admin panel
```

### 2. Firewall Configuration

```bash
# Only allow necessary ports
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (change 22 to your custom SSH port)
sudo ufw allow 22/tcp

# Allow CloudPanel
sudo ufw allow 8443/tcp

# NO NEED to allow 3000 or 9001 - Cloudflare Tunnel handles this!

# Enable firewall
sudo ufw enable
```

### 3. Database Security

```bash
# Secure PostgreSQL
sudo nano /etc/postgresql/14/main/postgresql.conf
# Set: listen_addresses = 'localhost'

# Use strong passwords
ALTER USER backroom_user WITH PASSWORD 'very-strong-password-here';

# Regular backups
crontab -e
# Add: 0 3 * * * pg_dump backroom_bookings > /home/cloudpanel/backups/db-$(date +\%Y\%m\%d).sql
```

### 4. Application Security

- Use production Stripe keys
- Set strong JWT secret
- Enable CORS properly
- Set secure cookie options
- Use environment variables for all secrets
- Regular security updates

### 5. Cloudflare Security Features

Enable in Cloudflare dashboard:
- **WAF (Web Application Firewall)**
- **DDoS Protection**
- **Bot Fight Mode**
- **Rate Limiting**
- **Page Rules** for caching
- **SSL/TLS**: Full (strict)

## Monitoring & Maintenance

### 1. PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Check status
pm2 status

# View logs
pm2 logs

# PM2 Plus (optional - free for 2 servers)
pm2 link <secret> <public>
```

### 2. CloudPanel Monitoring

- Built-in resource monitoring
- Email alerts for high resource usage
- Automatic log rotation

### 3. Log Rotation

```bash
# Install logrotate configuration
sudo nano /etc/logrotate.d/booking-system
```

Add:
```
/home/cloudpanel/htdocs/your-domain.com/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 cloudpanel cloudpanel
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 4. Backup Strategy

```bash
# Create backup script
nano ~/scripts/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/cloudpanel/backups"
DATE=$(date +%Y%m%d-%H%M%S)

# Backup database
pg_dump backroom_bookings > $BACKUP_DIR/db-$DATE.sql

# Backup uploads/files if any
tar -czf $BACKUP_DIR/files-$DATE.tar.gz /path/to/uploads

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

# Optional: Sync to external storage
# rclone sync $BACKUP_DIR remote:backups/
```

```bash
# Add to crontab
crontab -e
# Add: 0 3 * * * /home/cloudpanel/scripts/backup.sh
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Tunnel Not Working
```bash
# Check tunnel status
sudo systemctl status cloudflared

# View tunnel logs
sudo journalctl -u cloudflared -f

# Restart tunnel
sudo systemctl restart cloudflared

# Verify tunnel
cloudflared tunnel list
```

#### 2. Application Not Starting
```bash
# Check PM2 logs
pm2 logs booking-system

# Check Node.js version
node --version  # Should be 18+

# Rebuild application
npm run build
pm2 restart booking-system
```

#### 3. Database Connection Issues
```bash
# Test database connection
psql -U backroom_user -d backroom_bookings -h localhost

# Check PostgreSQL status
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

#### 4. Webhook Not Triggering
```bash
# Check webhook server
pm2 logs webhook-server

# Test webhook manually
curl -X POST https://webhooks.your-domain.com/webhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: ping" \
  -d '{"zen": "test"}'

# Check GitHub webhook deliveries
# Go to GitHub repo → Settings → Webhooks → Recent Deliveries
```

#### 5. Memory Issues
```bash
# Check memory usage
free -h
pm2 status

# Restart with memory limits
pm2 delete all
pm2 start ecosystem.config.js

# CloudPanel memory optimization
# CloudPanel → Server → Settings → PHP Settings → Adjust memory limits
```

### Performance Optimization

#### 1. Enable Caching
```javascript
// In next.config.js
module.exports = {
  // ... other config
  headers: async () => [
    {
      source: '/_next/static/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
};
```

#### 2. Cloudflare Page Rules
- Cache static assets
- Bypass cache for API routes
- Enable Auto Minify

#### 3. Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_customers_email ON customers(email);
```

## Quick Setup Checklist

- [ ] VPS provisioned with Ubuntu 22.04
- [ ] CloudPanel installed and configured
- [ ] PostgreSQL database created
- [ ] Node.js 18+ installed
- [ ] PM2 installed globally
- [ ] Repository cloned
- [ ] Environment variables configured
- [ ] Dependencies installed (`npm ci`)
- [ ] Database migrated (`npx prisma migrate deploy`)
- [ ] Application built (`npm run build`)
- [ ] Cloudflare account ready
- [ ] Cloudflared installed
- [ ] Tunnel created and configured
- [ ] DNS routes configured
- [ ] PM2 services started
- [ ] GitHub webhook configured
- [ ] SSL certificates active
- [ ] Firewall configured
- [ ] Backups scheduled
- [ ] Monitoring enabled

## Support Resources

- **CloudPanel Documentation**: https://www.cloudpanel.io/docs/
- **Cloudflare Tunnels**: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- **PM2 Documentation**: https://pm2.keymetrics.io/docs/
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Next.js Deployment**: https://nextjs.org/docs/deployment

## Conclusion

This setup provides:
- ✅ Secure access without exposed ports
- ✅ Automatic SSL certificates
- ✅ DDoS protection via Cloudflare
- ✅ Easy server management with CloudPanel
- ✅ Automatic deployments via GitHub
- ✅ Process management with PM2
- ✅ Scalable architecture

The combination of CloudPanel for server management and Cloudflare Tunnels for secure access creates a robust, production-ready deployment that's both secure and easy to maintain.