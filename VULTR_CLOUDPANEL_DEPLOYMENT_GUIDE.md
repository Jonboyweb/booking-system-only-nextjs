# Production Deployment Guide: Vultr VPS with CloudPanel & Docker PostgreSQL

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [VPS & CloudPanel Setup](#vps--cloudpanel-setup)
5. [Docker & PostgreSQL Setup](#docker--postgresql-setup)
6. [Cloudflare Configuration](#cloudflare-configuration)
7. [Application Deployment](#application-deployment)
8. [GitHub Webhook Auto-Deployment](#github-webhook-auto-deployment)
9. [Security Configuration](#security-configuration)
10. [Monitoring & Maintenance](#monitoring--maintenance)
11. [Troubleshooting](#troubleshooting)
12. [Quick Setup Checklist](#quick-setup-checklist)

## Overview

This guide covers deploying the booking system to a Vultr VPS using CloudPanel v2 for server management, Docker for PostgreSQL database, and Cloudflare for SSL/CDN without tunnels.

### Key Benefits
- **CloudPanel v2**: Easy GUI management, automated SSL, built-in monitoring
- **Docker PostgreSQL**: Isolated database environment, easy backups, consistent deployment
- **Cloudflare CDN**: DDoS protection, SSL certificates, global CDN
- **GitHub Webhooks**: Automatic deployment on push to main branch
- **PM2**: Process management with clustering and auto-restart

## Architecture

```
[GitHub Repository]
        ↓ (webhook on push)
[Cloudflare CDN/Proxy]
        ↓ (Origin CA Certificate)
[Vultr VPS Server]
   ├── CloudPanel (port 8443)
   ├── Node.js Application (port 3000)
   ├── Docker PostgreSQL (port 5432 - internal only)
   ├── Webhook Server (port 9001)
   └── PM2 Process Manager
```

## Prerequisites

- Vultr account with VPS provisioned
- Cloudflare account with domain configured
- GitHub repository access
- Basic knowledge of Linux commands

## VPS & CloudPanel Setup

### 1. Provision Vultr VPS

1. Log into Vultr dashboard
2. Deploy new server:
   - **Type**: Cloud Compute - Shared CPU
   - **Location**: Choose nearest to your target audience
   - **OS**: Ubuntu 22.04 LTS
   - **Plan**: Minimum 2 vCPU, 4GB RAM, 80GB SSD
   - **Additional Features**: Enable IPv6, Auto Backups (optional)

3. Note your server's IP address

### 2. Initial Server Setup

```bash
# SSH into your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Set timezone
timedatectl set-timezone America/New_York  # Change to your timezone

# Configure swap (recommended for 4GB RAM servers)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

# Set swappiness for better performance
echo 'vm.swappiness=10' >> /etc/sysctl.conf
sysctl -p
```

### 3. Install CloudPanel v2

```bash
# Download and run CloudPanel installer
curl -sS https://installer.cloudpanel.io/ce/v2/install.sh -o install.sh
bash install.sh

# The installer will:
# - Install NGINX, PHP, MySQL/MariaDB
# - Configure firewall
# - Set up CloudPanel interface
```

### 4. Access CloudPanel

1. Navigate to: `https://your-server-ip:8443`
2. Create admin account with strong password
3. Save credentials securely

### 5. Configure CloudPanel Settings

In CloudPanel admin area:

1. **Server Settings** → **Security**:
   - Enable Two-Factor Authentication
   - Set strong password policy

2. **Server Settings** → **SSH/FTP**:
   - Change SSH port (optional but recommended)
   - Disable password authentication (after setting up SSH keys)

## Docker & PostgreSQL Setup

### 1. Install Docker and Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Add cloudpanel user to docker group
usermod -aG docker cloudpanel

# Verify installation
docker --version
docker compose version
```

### 2. Create Docker Volumes Directory

```bash
# Create directory for Docker volumes
mkdir -p /home/cloudpanel/docker-volumes/postgres-data
chown -R cloudpanel:cloudpanel /home/cloudpanel/docker-volumes

# Create backup directory
mkdir -p /home/cloudpanel/backups/postgres
chown -R cloudpanel:cloudpanel /home/cloudpanel/backups
```

### 3. Set Up PostgreSQL with Docker

```bash
# Switch to cloudpanel user
su - cloudpanel

# Create project directory (will be replaced later with git clone)
mkdir -p ~/htdocs/booking.yourdomain.com
cd ~/htdocs/booking.yourdomain.com

# We'll deploy the docker-compose.prod.yml after cloning the repository
```

## Cloudflare Configuration

### 1. Add Domain to Cloudflare

1. Log into Cloudflare dashboard
2. Add your domain if not already added
3. Update nameservers at your domain registrar

### 2. Create Origin CA Certificate

1. In Cloudflare dashboard, go to **SSL/TLS** → **Origin Server**
2. Click **Create Certificate**
3. Configure:
   - Private key type: RSA (2048)
   - Hostnames: yourdomain.com, *.yourdomain.com
   - Certificate validity: 15 years
4. Copy both **Origin Certificate** and **Private Key**
5. Save them locally as `origin-cert.pem` and `private-key.pem`

### 3. Configure SSL Mode

1. Go to **SSL/TLS** → **Overview**
2. Set encryption mode to **Full (strict)**

### 4. Configure DNS Records

Add these DNS records (replace with your server IP):

```
Type    Name    Content             Proxy Status
A       @       your-server-ip      Proxied (orange cloud)
A       www     your-server-ip      Proxied (orange cloud)
A       booking your-server-ip      Proxied (orange cloud)
```

### 5. Set Up Firewall Rules

1. Go to **Security** → **WAF**
2. Create custom rule:
   - Name: "Block Direct IP Access"
   - Expression: `(http.host contains "your-server-ip")`
   - Action: Block

### 6. Configure Page Rules (Optional)

1. Go to **Rules** → **Page Rules**
2. Create rules for caching static assets:
   - URL: `*yourdomain.com/_next/static/*`
   - Settings: Cache Level: Cache Everything, Edge Cache TTL: 1 month

## Application Deployment

### 1. Create Node.js Site in CloudPanel

1. Log into CloudPanel
2. Click **+ Add Site**
3. Configure:
   - **Domain Name**: booking.yourdomain.com
   - **Site Type**: Node.js
   - **Node.js Version**: 20.x (or latest LTS)
   - **App Port**: 3000

### 2. Import Cloudflare Origin Certificate

1. In CloudPanel, go to your site → **SSL/TLS** → **Actions**
2. Click **Import Certificate**
3. Paste:
   - Private Key (from step 2.4)
   - Certificate (from step 2.4)
   - Certificate Chain (leave empty or use Cloudflare's root cert)
4. Click **Import and Install**

### 3. Configure Cloudflare IP Restrictions

1. In CloudPanel, go to your site → **Security**
2. Enable **"Allow traffic from Cloudflare only"**
3. This automatically updates Cloudflare IPs daily via cron job

### 4. Clone Repository

```bash
# Switch to cloudpanel user
su - cloudpanel
cd ~/htdocs/booking.yourdomain.com

# Remove default files
rm -rf *

# Clone your repository
git clone https://github.com/Jonboyweb/booking-system-only-nextjs.git .

# Set proper permissions
chmod 755 scripts/*.sh
```

### 5. Configure Environment Variables

```bash
# Copy production environment template
cp .env.production.example .env

# Edit environment variables
nano .env
```

Update with your production values:

```env
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://booking.yourdomain.com

# Database (Docker PostgreSQL)
DATABASE_URL="postgresql://backroom_user:your-secure-password@localhost:5432/backroom_bookings?schema=public"
DB_USER=backroom_user
DB_PASSWORD=your-secure-password
DB_NAME=backroom_bookings

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (SendGrid)
SENDGRID_API_KEY="SG...."
EMAIL_FROM="bookings@yourdomain.com"
EMAIL_FROM_NAME="Your Restaurant Name"

# JWT
JWT_SECRET="generate-very-long-random-string-here"

# GitHub Webhook
GITHUB_WEBHOOK_SECRET="generate-webhook-secret-here"
WEBHOOK_PORT=9001
```

### 6. Start PostgreSQL Database

```bash
# Start PostgreSQL with Docker Compose
docker compose -f docker-compose.prod.yml up -d

# Verify it's running
docker ps
docker compose -f docker-compose.prod.yml logs postgres
```

### 7. Install Dependencies and Build

```bash
# Install Node.js dependencies
npm ci --production=false

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed database (optional)
npx prisma db seed

# Build the Next.js application
npm run build

# Create necessary directories
mkdir -p logs backups
```

### 8. Start Application with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup systemd -u cloudpanel --hp /home/cloudpanel
# Copy and run the command it outputs
```

## GitHub Webhook Auto-Deployment

### 1. Start Webhook Server

```bash
# Start webhook server with PM2
pm2 start scripts/webhook-server.js --name webhook-server

# Save configuration
pm2 save
```

### 2. Configure GitHub Webhook

1. Go to your GitHub repository → **Settings** → **Webhooks**
2. Click **Add webhook**
3. Configure:
   - **Payload URL**: `https://booking.yourdomain.com/github-webhook`
   - **Content type**: `application/json`
   - **Secret**: Your `GITHUB_WEBHOOK_SECRET` from `.env`
   - **Events**: Just the push event
   - **Active**: ✓

### 3. Set Up Nginx Proxy for Webhook

```bash
# Create nginx configuration for webhook endpoint
sudo nano /etc/nginx/sites-available/webhook
```

Add this configuration:

```nginx
location /github-webhook {
    proxy_pass http://127.0.0.1:9001/webhook;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 4. Test Webhook

```bash
# Make a test commit
echo "<!-- Deployment test -->" >> README.md
git add README.md
git commit -m "Test auto-deployment"
git push origin main

# Monitor deployment
pm2 logs webhook-server
tail -f logs/deploy.log
```

## Security Configuration

### 1. Firewall Configuration

```bash
# Configure UFW firewall
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (use your custom port if changed)
ufw allow 22/tcp

# Allow CloudPanel
ufw allow 8443/tcp

# Allow HTTP and HTTPS (for Cloudflare)
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

### 2. Automatic Security Updates

```bash
# Install unattended-upgrades
apt install unattended-upgrades -y

# Configure automatic security updates
dpkg-reconfigure --priority=low unattended-upgrades
```

### 3. Fail2ban Installation

```bash
# Install fail2ban
apt install fail2ban -y

# Create local configuration
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit configuration
nano /etc/fail2ban/jail.local
# Set: bantime = 3600, findtime = 600, maxretry = 5

# Restart fail2ban
systemctl restart fail2ban
```

### 4. SSH Hardening

```bash
# Edit SSH configuration
nano /etc/ssh/sshd_config

# Recommended settings:
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
MaxSessions 2

# Restart SSH
systemctl restart sshd
```

## Monitoring & Maintenance

### 1. PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Check status
pm2 status

# View logs
pm2 logs

# Restart application
pm2 restart booking-system

# Reload with zero downtime
pm2 reload booking-system
```

### 2. Docker PostgreSQL Monitoring

```bash
# Check container status
docker ps

# View PostgreSQL logs
docker compose -f docker-compose.prod.yml logs -f postgres

# Access PostgreSQL shell
docker compose -f docker-compose.prod.yml exec postgres psql -U backroom_user -d backroom_bookings

# Check database size
docker compose -f docker-compose.prod.yml exec postgres psql -U backroom_user -d backroom_bookings -c "SELECT pg_database_size('backroom_bookings');"
```

### 3. Backup Configuration

Create automated backup script:

```bash
nano /home/cloudpanel/scripts/backup-postgres.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/cloudpanel/backups/postgres"
DATE=$(date +%Y%m%d-%H%M%S)
DB_NAME="backroom_bookings"
DB_USER="backroom_user"

# Create backup
docker compose -f /home/cloudpanel/htdocs/booking.yourdomain.com/docker-compose.prod.yml \
  exec -T postgres pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/backup-$DATE.sql.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup-*.sql.gz" -mtime +7 -delete

# Log backup completion
echo "[$(date)] Backup completed: backup-$DATE.sql.gz" >> $BACKUP_DIR/backup.log
```

```bash
# Make executable
chmod +x /home/cloudpanel/scripts/backup-postgres.sh

# Add to crontab (daily at 3 AM)
crontab -e
# Add: 0 3 * * * /home/cloudpanel/scripts/backup-postgres.sh
```

### 4. Log Rotation

```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/booking-system
```

```
/home/cloudpanel/htdocs/booking.yourdomain.com/logs/*.log {
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

### 5. CloudPanel Monitoring

- Access CloudPanel dashboard for resource monitoring
- Set up email alerts for high resource usage
- Review security logs regularly

## Troubleshooting

### Common Issues and Solutions

#### PostgreSQL Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check PostgreSQL logs
docker compose -f docker-compose.prod.yml logs postgres

# Test connection
docker compose -f docker-compose.prod.yml exec postgres pg_isready

# Restart PostgreSQL
docker compose -f docker-compose.prod.yml restart postgres
```

#### Application Not Starting

```bash
# Check PM2 logs
pm2 logs booking-system --lines 100

# Check Node.js version
node --version  # Should be 18+

# Rebuild application
npm run build
pm2 restart booking-system

# Check port availability
netstat -tulpn | grep 3000
```

#### Webhook Not Working

```bash
# Check webhook server logs
pm2 logs webhook-server

# Test webhook endpoint
curl -X POST https://booking.yourdomain.com/github-webhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: ping" \
  -d '{"zen": "test"}'

# Check GitHub webhook deliveries
# GitHub repo → Settings → Webhooks → Recent Deliveries
```

#### SSL Certificate Issues

```bash
# Verify certificate installation in CloudPanel
# Site → SSL/TLS → Check certificate status

# Test SSL configuration
curl -I https://booking.yourdomain.com

# Check Cloudflare SSL mode
# Should be "Full (strict)" in Cloudflare dashboard
```

#### Memory Issues

```bash
# Check memory usage
free -h
docker stats

# Adjust PM2 memory limits in ecosystem.config.js
pm2 restart booking-system --max-memory-restart 1G

# Check swap usage
swapon -s
```

## Quick Setup Checklist

### Pre-Deployment
- [ ] Vultr VPS provisioned (Ubuntu 22.04 LTS)
- [ ] Domain configured in Cloudflare
- [ ] GitHub repository accessible
- [ ] Stripe production keys ready
- [ ] SendGrid API key ready

### Server Setup
- [ ] CloudPanel v2 installed
- [ ] Docker and Docker Compose installed
- [ ] PostgreSQL running in Docker
- [ ] Firewall configured (UFW)
- [ ] SSH hardened
- [ ] Fail2ban installed

### CloudPanel Configuration
- [ ] Node.js site created
- [ ] Cloudflare Origin CA certificate imported
- [ ] "Allow traffic from Cloudflare only" enabled
- [ ] Two-factor authentication enabled

### Application Deployment
- [ ] Repository cloned
- [ ] Environment variables configured (.env)
- [ ] Dependencies installed (npm ci)
- [ ] Database migrated
- [ ] Application built (npm run build)
- [ ] PM2 process started
- [ ] PM2 startup configured

### Automation Setup
- [ ] Webhook server running
- [ ] GitHub webhook configured
- [ ] Auto-deployment tested
- [ ] Backup script created
- [ ] Cron jobs configured

### Security & Monitoring
- [ ] SSL working (Full strict mode)
- [ ] Firewall rules active
- [ ] Automatic updates enabled
- [ ] Log rotation configured
- [ ] Monitoring tools accessible

## Performance Optimization Tips

### 1. Cloudflare Optimization
- Enable Auto Minify (JavaScript, CSS, HTML)
- Set up Page Rules for static assets
- Enable Brotli compression
- Configure Browser Cache TTL

### 2. Database Optimization
- The docker-compose.prod.yml includes PostgreSQL tuning parameters
- Monitor slow queries with `pg_stat_statements`
- Add appropriate indexes based on query patterns

### 3. Application Optimization
- Use PM2 cluster mode for multiple CPU cores
- Enable Next.js production optimizations
- Implement proper caching strategies
- Use CDN for static assets

### 4. Server Optimization
- Adjust swap settings for better performance
- Configure NGINX caching
- Monitor and adjust Docker resource limits
- Use SSD storage for database volumes

## Support Resources

- **Vultr Documentation**: https://docs.vultr.com/
- **CloudPanel Documentation**: https://www.cloudpanel.io/docs/v2/
- **Docker Documentation**: https://docs.docker.com/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **PM2 Documentation**: https://pm2.keymetrics.io/docs/
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Cloudflare Documentation**: https://developers.cloudflare.com/

## Conclusion

This setup provides a robust, production-ready deployment with:

- ✅ Easy server management via CloudPanel GUI
- ✅ Isolated PostgreSQL database with Docker
- ✅ Cloudflare CDN and DDoS protection
- ✅ Automatic SSL certificates
- ✅ GitHub webhook auto-deployment
- ✅ PM2 process management
- ✅ Comprehensive security configuration
- ✅ Automated backups and monitoring

The combination of Vultr VPS, CloudPanel, Docker PostgreSQL, and Cloudflare creates a scalable, secure, and maintainable production environment for your booking system.