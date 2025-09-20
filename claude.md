# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Prohibition-themed nightclub table booking system built with Next.js 15, featuring interactive floor plans, real-time availability, Stripe payments, and comprehensive admin dashboard.

## Development Commands

```bash
# Development
npm run dev                # Start dev server on port 3000
npm run build             # Build for production
npm run start             # Start production server
npm run lint              # Run Next.js linter

# Database
npm run db:check          # Check database connection
npm run db:studio         # Open Prisma Studio GUI
npm run db:migrate        # Run Prisma migrations
npm run db:seed           # Seed database with initial data

# Docker (PostgreSQL)
docker-compose up -d      # Start PostgreSQL container
docker-compose down       # Stop containers
docker-compose logs -f    # View container logs

# Admin Setup
npx tsx scripts/seed-admin.ts     # Create default admin (admin@backroomleeds.co.uk / admin123)
npx tsx scripts/create-admin.ts   # Create custom admin user

# Testing Scripts
npx tsx scripts/test-email.ts <email>                    # Test SendGrid email
npx tsx scripts/simulate-payment.ts <booking-ref>        # Simulate Stripe payment
npx tsx scripts/resend-email.ts <booking-ref>           # Resend confirmation email
npx tsx scripts/test-booking-modification.ts            # Test booking modifications
npx tsx scripts/test-refund.ts                         # Test Stripe refunds
npx tsx scripts/create-paid-booking.ts                 # Create test paid booking

# Stripe Webhook (local development)
stripe listen --forward-to localhost:3000/api/payment/webhook
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15.5.2, React 19, TypeScript 5.9
- **Styling**: Tailwind CSS with custom prohibition theme colors
- **Database**: PostgreSQL via Docker, Prisma ORM
- **Payments**: Stripe Payment Intents API for £50 deposits
- **Email**: SendGrid for transactional emails
- **Auth**: JWT with bcrypt (Edge Runtime compatible)
- **Real-time**: Server-Sent Events (SSE) for availability updates

### Key Directories
- `/app` - Next.js App Router pages and API routes
  - `/api` - Backend API endpoints
  - `/admin` - Admin dashboard pages
  - `/booking` - Customer booking flow
- `/components` - Reusable React components
- `/lib` - Utilities, database client, validation
  - `/generated/prisma` - Prisma client output
- `/prisma` - Database schema and migrations
- `/public/floor-plans` - SVG/PNG venue layouts
- `/scripts` - Development and testing utilities
- `/types` - TypeScript type definitions

### Database Models (Prisma)
- **Table**: 16 tables across 2 floors with VIP status and combination logic
- **Booking**: Reservations with status tracking and payment info
- **Customer**: Guest profiles with contact details
- **DrinkPackage**: 8 pre-configured packages (£40-£580)
- **Spirits**: 31 spirits across 7 categories
- **Champagnes**: 8 premium selections (£85-£250)
- **CustomOrders**: Flexible bottle selection
- **AdminUsers**: Staff access with role-based permissions
- **PaymentLog**: Audit trail for all payment events
- **BookingModification**: History of booking changes and refunds

## Key Implementation Details

### Booking Business Rules
- Tables can be booked up to 31 days in advance
- Party sizes: 2-12 guests (Tables 15 & 16 can combine for 7-12)
- Booking slots are 2 hours (18:00-20:00, 20:00-22:00, 22:00-00:00)
- £50 deposit required via Stripe
- 48-hour refund policy enforced

### API Endpoints Pattern
- `/api/tables` - Table information
- `/api/availability[/date]` - Real-time availability checking
- `/api/availability/stream` - SSE for live updates
- `/api/bookings` - Booking CRUD operations
- `/api/payment/create-intent` - Stripe payment initiation
- `/api/payment/webhook` - Stripe webhook handler
- `/api/admin/*` - Protected admin endpoints

### Theme Configuration
Located in `tailwind.config.ts`:
- **Colors**: gold (#D4AF37), burgundy (#722F37), charcoal (#1A1A1A)
- **Fonts**: Bebas Neue, Poiret One, Playfair Display, Crimson Text
- **Custom classes**: speakeasy-green, speakeasy-charcoal, speakeasy-cream

### Authentication
- Admin routes protected by middleware (`/middleware.ts`)
- JWT tokens stored in httpOnly cookies
- Edge Runtime compatible (no Node.js crypto)
- Default admin: admin@backroomleeds.co.uk / admin123

### Email System
- SendGrid integration for transactional emails
- Prohibition-themed HTML templates with plain text fallback
- Automatic confirmation on successful payment
- Modification and refund notification emails

### Payment Flow
1. Customer selects booking details
2. Stripe Payment Intent created for £50 deposit
3. Payment processed via Stripe Elements
4. Webhook confirms payment and updates booking status
5. Confirmation email sent automatically
6. Refunds available through admin dashboard (managers/admins only)

## Environment Variables Required

```env
DATABASE_URL="postgresql://user:password@localhost:5432/backroom"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
SENDGRID_API_KEY="SG...."
SENDGRID_FROM_EMAIL="admin@backroomleeds.co.uk"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
JWT_SECRET="your-secret-key"
```

## Production Deployment

### VPS Requirements
- Ubuntu 20.04+ or similar Linux distribution
- Node.js 20+ and npm
- PM2 process manager (`npm install -g pm2`)
- Docker and Docker Compose for PostgreSQL
- Nginx for reverse proxy (optional, if using CloudPanel)
- 2GB+ RAM minimum, 4GB+ recommended
- 20GB+ storage

### Initial Production Setup

1. **Server Preparation**
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt install docker-compose -y
```

2. **Clone and Configure Application**
```bash
# Clone repository
git clone https://github.com/Jonboyweb/booking-system-only-nextjs.git
cd booking-system-only-nextjs

# Copy and configure environment variables
cp .env.production.example .env
nano .env  # Add your production values (see Environment Variables section)

# Create necessary directories
mkdir -p logs backups/postgres docker-volumes/postgres-data
```

3. **Database Setup**
```bash
# Start PostgreSQL with Docker
docker-compose -f docker-compose.prod.yml up -d

# Wait for database to be ready
docker-compose -f docker-compose.prod.yml exec postgres pg_isready

# Install dependencies
npm ci --production=false

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed initial admin user
npx tsx scripts/seed-admin.ts
```

4. **Build and Start Application**
```bash
# Build production bundle
npm run build

# Start with PM2
pm2 start ecosystem.config.prod.js --env production

# Save PM2 process list
pm2 save

# Generate startup script
pm2 startup systemd
# Follow the instructions printed to enable auto-start on boot
```

5. **Verify Deployment**
```bash
# Check application status
pm2 status

# View logs
pm2 logs booking-system --lines 50

# Test application endpoint
curl http://localhost:3000/api/health
```

### Manual Updates (Production)

For security reasons, this project uses manual deployment without GitHub webhooks:

```bash
# Navigate to project directory
cd /home/door50a-br/htdocs/br.door50a.co.uk  # Adjust path as needed

# Pull latest changes
git pull origin main

# Run production deployment script
./scripts/deploy-prod.sh
```

The `deploy-prod.sh` script automatically:
- Creates database and build backups
- Checks Docker/PostgreSQL health
- Installs/updates dependencies if needed
- Runs database migrations if schema changed
- Rebuilds the application
- Performs zero-downtime PM2 reload
- Runs health checks
- Provides rollback on failure

### Production PM2 Configuration

**Production** (`ecosystem.config.prod.js`):
- App name: `booking-system`
- Instances: 1 (Next.js handles internal workers)
- Mode: Fork mode
- Port: 3000
- Auto-restart: Enabled
- Memory limit: 1GB
- Logs: `./logs/pm2-*.log`
- Graceful reload with 5s timeout

### Production Environment Variables

Copy `.env.production.example` to `.env` and configure:

```env
# Database (must match docker-compose.prod.yml)
DATABASE_URL="postgresql://backroom_user:STRONG_PASSWORD@localhost:5432/backroom_bookings"
DB_USER=backroom_user
DB_PASSWORD=STRONG_PASSWORD
DB_NAME=backroom_bookings

# Stripe (get from https://dashboard.stripe.com)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# SendGrid (get from https://app.sendgrid.com)
SENDGRID_API_KEY="SG...."
EMAIL_FROM="admin@backroomleeds.co.uk"
EMAIL_FROM_NAME="The Backroom Leeds"

# Application
NEXT_PUBLIC_APP_URL="https://br.door50a.co.uk"
JWT_SECRET="$(openssl rand -base64 64)"  # Generate this!
NODE_ENV="production"

# Business Settings
RESTAURANT_NAME="The Backroom Leeds"
RESTAURANT_PHONE="+441234567890"
RESTAURANT_ADDRESS="123 Main St, Leeds"
TIMEZONE="Europe/London"
```

### Security Considerations

1. **Cloudflare Proxy**: Keep enabled for DDoS protection and SSL
2. **Firewall**: Only expose ports 80/443, keep database internal
3. **Secrets**: Never commit `.env` files, use strong JWT secrets
4. **Updates**: Regularly update dependencies with `npm audit`
5. **Backups**: Automated database backups in `/backups/`
6. **Manual Deployment**: No webhook exposure for enhanced security

### Production Monitoring

```bash
# PM2 monitoring
pm2 status                          # View process status
pm2 monit                          # Interactive monitoring
pm2 logs booking-system --lines 100  # View recent logs
pm2 info booking-system            # Detailed process info

# Database monitoring
docker-compose -f docker-compose.prod.yml ps     # Container status
docker-compose -f docker-compose.prod.yml logs -f postgres  # Database logs

# Application health
curl http://localhost:3000/api/health  # Health check endpoint

# Resource usage
pm2 describe booking-system | grep -E "memory|cpu"  # PM2 metrics
docker stats backroom-postgres-prod  # Database resources
```

### Backup & Recovery

```bash
# Manual database backup
./scripts/backup-postgres.sh

# Restore database from backup
docker-compose -f docker-compose.prod.yml exec -T postgres \
  psql -U backroom_user backroom_bookings < backups/postgres/backup.sql

# Application rollback
git log --oneline -n 5  # View recent commits
git reset --hard <commit-hash>  # Rollback to specific commit
npm ci --production=false && npm run build
pm2 reload booking-system
```

## Development Environment

### Local Development Setup

1. **Prerequisites**
- Node.js 20+
- Docker Desktop
- Git
- VS Code (recommended)

2. **Initial Setup**
```bash
# Clone repository
git clone https://github.com/Jonboyweb/booking-system-only-nextjs.git
cd booking-system-only-nextjs

# Copy development environment variables
cp .env.development.example .env.local
nano .env.local  # Configure for local development

# Install dependencies
npm install

# Start PostgreSQL (development mode)
docker-compose -f docker-compose.dev.yml up -d

# Setup database
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npx tsx scripts/seed-admin.ts

# Start development server
npm run dev
```

3. **Development Commands**
```bash
# Start dev server with hot reload
npm run dev

# Open Prisma Studio (database GUI)
npm run db:studio

# Run database migrations
npm run db:migrate

# Check database connection
npm run db:check

# Run linter
npm run lint

# Build for testing
npm run build
npm run start  # Test production build locally
```

### Development Deployment

For staging/development servers:

```bash
# Navigate to development directory
cd /home/cdev/booking-system-only-nextjs  # Adjust path

# Pull latest changes
git pull origin main  # or development branch

# Run development deployment
./scripts/deploy-dev.sh
```

The `deploy-dev.sh` script:
- Skips production optimizations
- Uses development Docker configuration
- Enables debug logging
- Faster rebuild times
- No backup creation (optional)

### Development PM2 Configuration

**Development** (`ecosystem.config.dev.js`):
- Single instance
- Development environment variables
- Verbose logging
- File watching enabled (optional)
- Port: 3000 or 3001

### Testing Stripe Webhooks Locally

```bash
# Install Stripe CLI
curl -fsSL https://packages.stripe.dev/api/security/keypair | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee /etc/apt/sources.list.d/stripe.list
sudo apt update && sudo apt install stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/payment/webhook

# In another terminal, trigger test events
stripe trigger payment_intent.succeeded
```

### Development Tips

1. **Hot Reload**: Next.js dev server automatically reloads on file changes
2. **Database GUI**: Use `npm run db:studio` for visual database management
3. **Email Testing**: Use SendGrid sandbox mode or MailHog for local testing
4. **Stripe Testing**: Use test mode keys and test card numbers
5. **Debug Mode**: Set `LOG_LEVEL=debug` in `.env.local`

## Troubleshooting

### Common Issues and Solutions

1. **Database Connection Failed**
```bash
# Check Docker container
docker ps | grep postgres
# Restart if needed
docker-compose -f docker-compose.prod.yml restart postgres
# Check logs
docker-compose -f docker-compose.prod.yml logs postgres
```

2. **Build Failures**
```bash
# Clear Next.js cache
rm -rf .next
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm ci --production=false
# Rebuild
npm run build
```

3. **PM2 Process Not Starting**
```bash
# Check PM2 logs
pm2 logs booking-system --err
# Delete and restart
pm2 delete booking-system
pm2 start ecosystem.config.prod.js --env production
```

4. **Port Already in Use**
```bash
# Find process using port 3000
sudo lsof -i :3000
# Kill the process
sudo kill -9 <PID>
```

5. **Prisma Migration Issues**
```bash
# Reset database (CAUTION: Data loss!)
npx prisma migrate reset
# Or manually fix
npx prisma migrate status
npx prisma migrate resolve --applied <migration_name>
```

6. **Stripe Webhook Failures**
- Verify webhook secret matches dashboard
- Check webhook endpoint URL
- Ensure proper SSL certificate
- Review Stripe dashboard webhook logs

7. **Email Not Sending**
- Verify SendGrid API key
- Check sender domain verification
- Review SendGrid activity feed
- Test with `npx tsx scripts/test-email.ts`

## Current Development Status

Project is production-ready and actively deployed. Manual deployment process is in place for enhanced security (no GitHub webhooks).

- **Production**: Port 3000 (Next.js) + Port 5432 (PostgreSQL via Docker)
- **Development**: Same ports, simplified configuration
- **Deployment**: Manual via SSH and deployment scripts
- **Process Manager**: PM2 for production stability