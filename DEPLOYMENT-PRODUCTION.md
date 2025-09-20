# Production Deployment Checklist

This checklist ensures a safe and complete production deployment of the Backroom Leeds booking system.

## Pre-Deployment Checklist

### 1. Server Requirements
- [ ] Ubuntu 20.04+ or similar Linux distribution
- [ ] Node.js 20+ installed
- [ ] PM2 installed globally (`npm install -g pm2`)
- [ ] Docker and Docker Compose installed
- [ ] Minimum 2GB RAM (4GB recommended)
- [ ] 20GB+ available storage
- [ ] Firewall configured (only ports 80/443 exposed)

### 2. External Services Setup
- [ ] **Stripe Account**
  - [ ] Live API keys obtained
  - [ ] Webhook endpoint configured
  - [ ] Webhook secret obtained
  - [ ] Payment methods enabled
  - [ ] Business verification completed

- [ ] **SendGrid Account**
  - [ ] API key generated
  - [ ] Domain authentication completed
  - [ ] Sender identity verified
  - [ ] Email templates tested

- [ ] **Domain & SSL**
  - [ ] Domain pointed to server IP
  - [ ] Cloudflare proxy enabled
  - [ ] SSL certificate active
  - [ ] Force HTTPS enabled

### 3. Environment Variables
- [ ] Copy `.env.production.example` to `.env`
- [ ] Set `DATABASE_URL` with strong password
- [ ] Set `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- [ ] Add Stripe live keys
- [ ] Add SendGrid API key
- [ ] Generate strong `JWT_SECRET` (use `openssl rand -base64 64`)
- [ ] Set `NEXT_PUBLIC_APP_URL` to production URL
- [ ] Configure business-specific settings

## Initial Deployment Steps

### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Application Setup
```bash
# Clone repository
git clone https://github.com/Jonboyweb/booking-system-only-nextjs.git
cd booking-system-only-nextjs

# Create required directories
mkdir -p logs backups/postgres docker-volumes/postgres-data

# Configure environment
cp .env.production.example .env
nano .env  # Edit with your values
```

### 3. Database Setup
```bash
# Start PostgreSQL
docker-compose -f docker-compose.prod.yml up -d

# Verify database is running
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml exec postgres pg_isready

# Install dependencies
npm ci --production=false

# Setup Prisma
npx prisma generate
npx prisma migrate deploy

# Create admin user
npx tsx scripts/seed-admin.ts
```

### 4. Build & Launch
```bash
# Build production bundle
npm run build

# Start with PM2
pm2 start ecosystem.config.prod.js --env production

# Save PM2 configuration
pm2 save
pm2 startup systemd  # Follow the output instructions
```

### 5. Verification
- [ ] Check PM2 status: `pm2 status`
- [ ] Check logs: `pm2 logs booking-system`
- [ ] Test health endpoint: `curl http://localhost:3000/api/health`
- [ ] Access application in browser
- [ ] Test booking flow
- [ ] Verify email delivery
- [ ] Test payment processing

## Update Deployment Steps

### 1. Pre-Update Checks
- [ ] Notify team of maintenance window
- [ ] Review changes in git log
- [ ] Check current application health
- [ ] Verify backup system is working

### 2. Deploy Updates
```bash
# Navigate to project
cd /home/door50a-br/htdocs/br.door50a.co.uk  # Adjust path

# Pull latest code
git pull origin main

# Run deployment script
./scripts/deploy-prod.sh
```

The deployment script will:
- Create database backup
- Check service health
- Update dependencies if needed
- Run migrations if schema changed
- Build new production bundle
- Perform zero-downtime reload
- Run health checks

### 3. Post-Update Verification
- [ ] Check application status: `pm2 status`
- [ ] Review logs for errors: `pm2 logs booking-system --lines 100`
- [ ] Test critical user flows:
  - [ ] Homepage loads
  - [ ] Table availability shows correctly
  - [ ] Booking can be created
  - [ ] Payment processes successfully
  - [ ] Confirmation email received
  - [ ] Admin login works
  - [ ] Admin dashboard loads

### 4. Monitoring
```bash
# Real-time monitoring
pm2 monit

# Check resource usage
pm2 info booking-system

# Database status
docker-compose -f docker-compose.prod.yml ps

# View application logs
tail -f logs/pm2-out.log
```

## Rollback Procedure

If issues occur after deployment:

### 1. Quick Rollback
```bash
# Stop current process
pm2 stop booking-system

# Revert to previous commit
git log --oneline -n 5  # Find previous stable commit
git reset --hard <commit-hash>

# Rebuild
npm ci --production=false
npm run build

# Restart
pm2 restart booking-system
```

### 2. Database Rollback
```bash
# List available backups
ls -la backups/postgres/

# Restore from backup
docker-compose -f docker-compose.prod.yml exec -T postgres \
  psql -U backroom_user backroom_bookings < backups/postgres/db-backup-YYYYMMDD-HHMMSS.sql.gz
```

## Security Checklist

### Pre-Deployment
- [ ] All secrets are strong and unique
- [ ] `.env` file has restricted permissions (chmod 600)
- [ ] Database password is complex
- [ ] JWT secret is at least 64 characters
- [ ] No sensitive data in git history

### Post-Deployment
- [ ] Remove any test data
- [ ] Verify firewall rules
- [ ] Check file permissions
- [ ] Enable application monitoring
- [ ] Set up log rotation
- [ ] Configure automated backups

## Maintenance Tasks

### Daily
- [ ] Check application health
- [ ] Review error logs
- [ ] Monitor disk space

### Weekly
- [ ] Review performance metrics
- [ ] Check backup integrity
- [ ] Update dependencies if needed
- [ ] Review security advisories

### Monthly
- [ ] Full system backup
- [ ] Performance optimization review
- [ ] Security audit
- [ ] Database maintenance (VACUUM, ANALYZE)

## Emergency Contacts

Document your team's emergency contacts here:

- **System Administrator**: [Name] - [Phone] - [Email]
- **Developer Lead**: [Name] - [Phone] - [Email]
- **Stripe Support**: https://support.stripe.com
- **SendGrid Support**: https://support.sendgrid.com
- **Hosting Provider**: [Contact Info]

## Additional Notes

### Deployment Script Options
```bash
# Skip backup (faster deployment)
./scripts/deploy-prod.sh --skip-backup

# Force deployment even if no changes
./scripts/deploy-prod.sh --force

# Both options
./scripts/deploy-prod.sh --skip-backup --force
```

### PM2 Commands Reference
```bash
pm2 status              # View all processes
pm2 restart booking-system  # Restart application
pm2 reload booking-system   # Zero-downtime reload
pm2 logs booking-system     # View logs
pm2 monit                   # Interactive monitoring
pm2 info booking-system     # Detailed process info
pm2 save                    # Save current process list
```

### Docker Commands Reference
```bash
docker-compose -f docker-compose.prod.yml ps      # View containers
docker-compose -f docker-compose.prod.yml logs -f # View logs
docker-compose -f docker-compose.prod.yml restart # Restart services
docker-compose -f docker-compose.prod.yml down    # Stop all services
docker-compose -f docker-compose.prod.yml up -d   # Start all services
```

## Sign-off

- [ ] Deployment completed successfully
- [ ] All verification steps passed
- [ ] Documentation updated
- [ ] Team notified of completion

**Deployed by**: ________________________
**Date**: ________________________
**Version/Commit**: ________________________