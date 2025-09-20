# Development Environment Setup & Deployment

This guide covers setting up both local development and staging/development server environments.

## Local Development Setup

### Prerequisites
- [ ] Node.js 20+ installed
- [ ] Docker Desktop installed and running
- [ ] Git configured
- [ ] VS Code or preferred IDE
- [ ] Stripe CLI (optional, for webhook testing)

### Initial Setup

#### 1. Clone Repository
```bash
git clone https://github.com/Jonboyweb/booking-system-only-nextjs.git
cd booking-system-only-nextjs
```

#### 2. Environment Configuration
```bash
# Copy development environment template
cp .env.development.example .env.local

# Edit with your settings
nano .env.local
```

Key settings to configure:
- Database credentials (can keep defaults for local)
- Stripe test keys (from Stripe dashboard)
- Email settings (MailHog is pre-configured)

#### 3. Start Development Services
```bash
# Start PostgreSQL, MailHog, and pgAdmin
docker-compose -f docker-compose.dev.yml up -d

# Verify services are running
docker ps

# Services will be available at:
# - PostgreSQL: localhost:5432
# - MailHog: http://localhost:8025
# - pgAdmin: http://localhost:5050
```

#### 4. Database Setup
```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database with test data
npx prisma db seed

# Create admin user
npx tsx scripts/seed-admin.ts
# Default: admin@localhost / admin123
```

#### 5. Start Development Server
```bash
# Start with hot reload
npm run dev

# Application available at http://localhost:3000
```

### Development Workflow

#### Daily Development Commands
```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d
npm run dev

# Database management
npm run db:studio          # Open Prisma Studio GUI
npm run db:migrate         # Create new migration
npm run db:check          # Test database connection

# Code quality
npm run lint              # Run linter
npm run build             # Test production build

# Testing
npx tsx scripts/test-email.ts test@example.com  # Test email
npx tsx scripts/test-booking-api.ts              # Test booking API
```

#### Working with Database

**Prisma Studio** (Visual Database Management):
```bash
npm run db:studio
# Opens at http://localhost:5555
```

**pgAdmin** (Advanced Database Management):
- URL: http://localhost:5050
- Login: admin@localhost.com / admin
- Add server:
  - Host: postgres (container name)
  - Port: 5432
  - Database: backroom_bookings_dev
  - Username: backroom_user
  - Password: development_password_2024

**Direct Database Access**:
```bash
# Connect to database
docker exec -it backroom-postgres-dev psql -U backroom_user -d backroom_bookings_dev

# Useful PostgreSQL commands:
\dt                    # List tables
\d+ bookings          # Describe bookings table
SELECT * FROM "Table"; # Query tables (note quotes for Pascal case)
\q                    # Quit
```

#### Testing Emails

All emails in development are captured by MailHog:
- Web UI: http://localhost:8025
- SMTP: localhost:1025

Test email sending:
```bash
npx tsx scripts/test-email.ts test@example.com
```

#### Testing Stripe Payments

1. Install Stripe CLI:
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux
curl -fsSL https://packages.stripe.dev/api/security/keypair | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee /etc/apt/sources.list.d/stripe.list
sudo apt update && sudo apt install stripe
```

2. Login and forward webhooks:
```bash
stripe login
stripe listen --forward-to localhost:3000/api/payment/webhook
```

3. Test payment flow:
```bash
# Trigger test events
stripe trigger payment_intent.succeeded

# Or use test cards in the UI:
# 4242 4242 4242 4242 - Success
# 4000 0000 0000 3220 - Requires authentication
# 4000 0000 0000 9995 - Decline
```

### Common Development Tasks

#### Creating New Features

1. **Database Schema Changes**:
```bash
# Edit prisma/schema.prisma
npx prisma migrate dev --name describe_your_change
npx prisma generate
```

2. **Adding New API Routes**:
- Create file in `app/api/your-route/route.ts`
- Implement GET, POST, PUT, DELETE handlers

3. **Creating Components**:
- Add to `components/` directory
- Follow existing naming conventions
- Use TypeScript interfaces

#### Debugging

1. **Server-side Debugging**:
```bash
# Start with Node.js inspector
node --inspect node_modules/.bin/next dev

# Connect debugger to localhost:9229
```

2. **Client-side Debugging**:
- Use browser DevTools
- React Developer Tools extension
- Next.js error overlay

3. **Database Queries**:
```bash
# Enable Prisma query logging in .env.local
PRISMA_LOG_LEVEL="query,info,warn,error"
```

## Development Server Deployment

For staging/development servers (not local):

### Prerequisites
- [ ] Development server with SSH access
- [ ] Node.js 20+ installed on server
- [ ] Docker installed on server
- [ ] PM2 installed (optional)
- [ ] Git access configured

### Initial Setup on Development Server

#### 1. Server Preparation
```bash
# SSH into server
ssh user@dev-server

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (optional)
sudo npm install -g pm2

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
```

#### 2. Clone and Configure
```bash
# Clone repository
git clone https://github.com/Jonboyweb/booking-system-only-nextjs.git
cd booking-system-only-nextjs

# Setup environment
cp .env.development.example .env
nano .env  # Configure for development server

# Create directories
mkdir -p logs backups
```

#### 3. Start Services
```bash
# Start PostgreSQL and other services
docker-compose -f docker-compose.dev.yml up -d

# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npx tsx scripts/seed-admin.ts

# Build application
npm run build
```

#### 4. Launch Application

**Option A: Using PM2**
```bash
pm2 start ecosystem.config.dev.js
pm2 save
pm2 startup  # Follow instructions
```

**Option B: Using npm**
```bash
# In a screen/tmux session
npm run start
```

### Updating Development Server

Use the development deployment script:

```bash
cd /path/to/booking-system-only-nextjs
git pull origin main  # or your development branch
./scripts/deploy-dev.sh
```

Script options:
- `--skip-tests` - Skip running tests
- `--reset-db` - Reset and reseed database
- `--help` - Show help message

Example:
```bash
# Quick update without tests
./scripts/deploy-dev.sh --skip-tests

# Fresh start with clean database
./scripts/deploy-dev.sh --reset-db
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

#### Database Connection Failed
```bash
# Check Docker containers
docker ps

# Restart PostgreSQL
docker-compose -f docker-compose.dev.yml restart postgres

# Check logs
docker-compose -f docker-compose.dev.yml logs postgres
```

#### Build Failures
```bash
# Clear caches
rm -rf .next node_modules
npm install
npm run build
```

#### Prisma Issues
```bash
# Regenerate client
npx prisma generate

# Reset database
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```

### Getting Help

#### Logs and Debugging
```bash
# Application logs (if using PM2)
pm2 logs booking-system-dev

# Docker logs
docker-compose -f docker-compose.dev.yml logs -f

# Next.js debug mode
DEBUG=* npm run dev
```

#### Database Inspection
```bash
# Prisma Studio
npm run db:studio

# pgAdmin
http://localhost:5050

# Direct SQL
docker exec -it backroom-postgres-dev psql -U backroom_user -d backroom_bookings_dev
```

## Development Best Practices

### Code Quality
- [ ] Run linter before committing: `npm run lint`
- [ ] Test production build locally: `npm run build`
- [ ] Write TypeScript types for all components
- [ ] Follow existing code patterns

### Database
- [ ] Always create migrations for schema changes
- [ ] Test migrations on development before production
- [ ] Keep seed data up to date
- [ ] Document any manual database changes

### Testing
- [ ] Test all user flows after changes
- [ ] Verify email sending with MailHog
- [ ] Test payment flows with Stripe test mode
- [ ] Check mobile responsiveness

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "feat: describe your change"

# Push to GitHub
git push origin feature/your-feature

# Create pull request on GitHub
```

### Security in Development
- [ ] Never commit real API keys
- [ ] Use different passwords than production
- [ ] Keep development data anonymous
- [ ] Regularly update dependencies

## Quick Reference

### Environment Variables
```bash
# Development defaults
NODE_ENV=development
DATABASE_URL=postgresql://backroom_user:development_password_2024@localhost:5432/backroom_bookings_dev
JWT_SECRET=development-secret-key
```

### Service URLs
- **Application**: http://localhost:3000
- **Prisma Studio**: http://localhost:5555
- **pgAdmin**: http://localhost:5050
- **MailHog**: http://localhost:8025

### Useful Scripts
```bash
npm run dev              # Start development server
npm run build           # Build production bundle
npm run start           # Start production server
npm run lint            # Run linter
npm run db:studio       # Open Prisma Studio
npm run db:migrate      # Run migrations
npm run db:check        # Check database connection
```

### Docker Commands
```bash
docker-compose -f docker-compose.dev.yml up -d     # Start services
docker-compose -f docker-compose.dev.yml down      # Stop services
docker-compose -f docker-compose.dev.yml logs -f   # View logs
docker-compose -f docker-compose.dev.yml ps        # Check status
```

## Notes

- Development environment includes optional tools (pgAdmin, MailHog)
- All emails are captured locally in MailHog
- Database is isolated from production
- Use test Stripe keys for payment testing
- PM2 configuration uses port 3001 to avoid conflicts