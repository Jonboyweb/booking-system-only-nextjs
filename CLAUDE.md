# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Prohibition-themed nightclub table booking system for The Backroom Leeds. Built with Next.js 15 App Router, featuring interactive floor plans, real-time availability, Stripe payments, and comprehensive admin dashboard.

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
docker-compose up -d      # Start PostgreSQL container
docker-compose down       # Stop containers

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

# PM2 Production Commands
npm run pm2:start         # Start with PM2
npm run pm2:restart       # Restart application
npm run pm2:logs         # View PM2 logs

# Local Testing with MailHog
docker-compose up -d          # Starts PostgreSQL and MailHog
# Access MailHog UI at http://localhost:8025

# Test email sending
npx tsx scripts/test-mailhog.ts

# Stripe Webhook (local development)
stripe listen --forward-to localhost:3000/api/payment/webhook
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15.5.2 with App Router
- **Frontend**: React 19, TypeScript 5.9
- **Styling**: Tailwind CSS with custom prohibition theme
- **Database**: PostgreSQL 16 (Docker), Prisma ORM 6.16.2
- **Payments**: Stripe SDK 18.5.0 (Payment Intents API)
- **Email**: SendGrid 8.1.5 for transactional emails
- **Auth**: JWT with bcryptjs (Edge Runtime compatible)
- **Real-time**: Server-Sent Events (SSE) for availability updates
- **Icons**: Lucide React 0.542.0

### Key Project Structure
```
/app                      # Next.js App Router
  /api                   # API endpoints
    /admin/*            # Protected admin endpoints
    /availability       # Real-time table availability
    /bookings          # Booking CRUD operations
    /payment           # Stripe payment handling
    /email             # Email operations
  /admin                # Admin dashboard pages (protected)
    /dashboard         # Admin home and stats
    /login            # Admin authentication
  /booking             # Customer booking flow
    /confirmation     # Post-payment confirmation
    /payment         # Stripe payment page
  /test-login        # Development login helpers

/components            # Reusable React components
  /admin              # Admin-specific components
  /booking           # Booking flow components

/lib                  # Core utilities and services
  /generated/prisma  # Prisma client output
  db.ts             # Database client singleton
  email.ts          # SendGrid email service
  stripe.ts         # Stripe configuration

/prisma
  schema.prisma     # Database schema definition
  seed.ts          # Database seeding script
  /migrations      # Database migration history

/public
  /floor-plans     # SVG/PNG venue layouts

/scripts            # Development and testing utilities
/types             # TypeScript type definitions
```

## Database Schema (Prisma)

### Core Models
- **Table** (16 tables): Floor location, capacity (2-12), VIP status, combination logic
- **Booking**: Reservation with status enum (pending/confirmed/cancelled/completed/refunded)
- **Customer**: Guest profiles with contact details
- **DrinkPackage** (8 packages): Pre-configured packages (£40-£580)
- **Spirits** (31 spirits): 7 categories (Vodka/Rum/Gin/Cognac/Whiskey/Tequila/Other)
- **Champagnes** (8 selections): Premium bottles (£85-£250)
- **CustomOrders**: Flexible bottle selection for bookings
- **AdminUsers**: Staff with roles (admin/manager/staff)
- **PaymentLog**: Complete audit trail of payment events
- **BookingModification**: Track all booking changes and refunds

### Table Configuration
- Tables 1-10: Upstairs (Tables 5 & 10 are VIP booths)
- Tables 11-16: Downstairs
- Tables 15 & 16: Can combine for groups of 7-12
- All tables have 2-hour booking slots

## API Patterns and Routes

### Public API Endpoints
```
GET    /api/tables                          # List all tables
GET    /api/availability/[date]             # Check availability for date
GET    /api/availability/stream             # SSE real-time updates
GET    /api/packages                        # List drink packages
GET    /api/spirits                         # List available spirits
GET    /api/champagnes                      # List champagne options
POST   /api/bookings                        # Create new booking
GET    /api/bookings/[reference]            # Get booking details
POST   /api/payment/create-intent           # Initialize Stripe payment
POST   /api/payment/webhook                 # Stripe webhook handler
```

### Protected Admin Endpoints (JWT required)
```
POST   /api/admin/auth/login                # Admin login
GET    /api/admin/auth/verify              # Verify JWT token
POST   /api/admin/auth/logout              # Logout admin
GET    /api/admin/bookings                 # List all bookings
PUT    /api/admin/bookings/[id]            # Update booking
DELETE /api/admin/bookings/[id]            # Cancel booking
POST   /api/admin/bookings/[id]/refund     # Process refund
GET    /api/admin/customers                # List customers
GET    /api/admin/analytics                # Revenue and metrics
GET    /api/admin/tables                   # Manage tables
```

## Business Logic and Rules

### Booking Constraints
- Maximum 31 days advance booking
- 2-hour time slots: 18:00-20:00, 20:00-22:00, 22:00-00:00
- £50 non-refundable deposit (48-hour refund policy for managers/admins)
- Party size must match table capacity (with ±1 flexibility)
- Tables 15 & 16 combine for groups 7-12

### Payment Flow
1. Customer completes booking form
2. Stripe Payment Intent created for £50
3. Customer enters card details (Stripe Elements)
4. Payment processed, webhook confirms
5. Booking status updated to 'confirmed'
6. Confirmation email sent automatically
7. Refunds available via admin dashboard

### Email Templates
- Booking confirmation (on payment success)
- Booking modification (when admin updates)
- Refund confirmation (when deposit refunded)
- All emails use prohibition-themed HTML with plain text fallback

## Styling and Theme

### Tailwind Config Extensions
```javascript
colors: {
  gold: '#D4AF37',
  burgundy: '#722F37',
  charcoal: '#1A1A1A',
  'speakeasy-green': '#2F4F2F',
  'speakeasy-charcoal': '#1A1A1A',
  'speakeasy-cream': '#F5F5DC'
}
```

### Fonts (Google Fonts)
- Bebas Neue: Headings
- Poiret One: Subheadings
- Playfair Display: Body text
- Crimson Text: Descriptions

## Environment Configuration

### Development Environments

This project has two distinct deployment environments:

#### 1. Local Testing Environment (Localhost)
- **Purpose**: Development and testing
- **Email**: MailHog for email capture and testing
- **Payments**: Stripe test mode with webhook CLI
- **Access**: http://localhost:3000

#### 2. Production VPS (CloudPanel)
- **Purpose**: Live production server
- **Email**: SendGrid for transactional emails
- **Payments**: Stripe live mode
- **Access**: https://br.door50a.co.uk

### Environment Variables

#### Local Testing Environment (.env or .env.local)
```env
# Database
DATABASE_URL="postgresql://backroom_user:development_password_2024@localhost:5432/backroom_bookings_dev"

# Stripe Test Mode
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."  # From stripe listen command

# MailHog Email Configuration
EMAIL_PROVIDER=mailhog
SMTP_HOST=localhost
SMTP_PORT=1025
EMAIL_FROM="bookings@backroom-dev.local"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
JWT_SECRET="development-secret-key"
NODE_ENV="development"
```

#### Production VPS Environment (.env.production)
```env
# Database
DATABASE_URL="postgresql://backroom_user:prod_password@localhost:5432/backroom_bookings"

# Stripe Live Mode
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# SendGrid Email Configuration
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY="SG...."
SENDGRID_FROM_EMAIL="admin@backroomleeds.co.uk"

# Application
NEXT_PUBLIC_APP_URL="https://br.door50a.co.uk"
JWT_SECRET="production-secret-key"
NODE_ENV="production"
```

## Common Development Tasks

### Adding a New Admin User
```bash
npx tsx scripts/create-admin.ts
# Follow prompts for email, password, name, and role
```

### Testing Email Integration

#### Local Environment (MailHog)
```bash
# Start MailHog container
docker-compose up -d

# Test MailHog email sending
npx tsx scripts/test-mailhog.ts

# View captured emails at
http://localhost:8025

# Simulate full payment flow with email
npx tsx scripts/simulate-payment.ts BOOK-XXXXX
```

#### Production Environment (SendGrid)
```bash
# Test SendGrid email sending
npx tsx scripts/test-email.ts test@example.com

# Resend confirmation email
npx tsx scripts/resend-email.ts BOOK-XXXXX
```

### Working with Database
```bash
# View/edit data visually
npm run db:studio

# Create new migration after schema changes
npx prisma migrate dev --name describe_your_changes

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Testing Stripe Integration
```bash
# Start webhook listener in one terminal
stripe listen --forward-to localhost:3000/api/payment/webhook

# Create test payment in another terminal
npx tsx scripts/simulate-payment.ts BOOK-XXXXX
```

## Code Patterns and Conventions

### API Response Format
```typescript
// Success
return NextResponse.json({
  success: true,
  data: result
});

// Error
return NextResponse.json({
  success: false,
  error: 'Error message'
}, { status: 400 });
```

### Database Access Pattern
```typescript
import { db } from '@/lib/db';

// Always use the singleton instance
const result = await db.table.findMany({
  where: { isActive: true },
  orderBy: { tableNumber: 'asc' }
});
```

### Admin Route Protection
All `/admin/*` routes are protected by middleware. JWT verification happens automatically.

### Component Organization
- Use `components/admin/*` for admin-specific components
- Use `components/booking/*` for customer booking flow
- Shared components go in `components/` root

## Testing and Debugging

### Check Database Connection
```bash
npm run db:check
```

### View Application Logs
```bash
# Development
npm run dev

# Production (PM2)
pm2 logs booking-system
```

### Common Issues

1. **Database connection failed**: Ensure Docker is running with `docker-compose up -d`
2. **Stripe webhook not working**: Check webhook secret and ensure stripe CLI is listening
3. **Emails not sending (Local)**: Check MailHog is running at http://localhost:8025
4. **Emails not sending (Production)**: Verify SendGrid API key and sender email is verified
5. **Admin login not working**: Run `npx tsx scripts/seed-admin.ts` to create default admin
6. **Environment confusion**: Check NODE_ENV and EMAIL_PROVIDER variables match your environment

## Production Deployment Notes

- Uses PM2 for process management
- PostgreSQL runs in Docker container
- Manual deployment via `scripts/deploy-prod.sh`
- Production URL: https://br.door50a.co.uk
- Cloudflare proxy enabled for SSL and DDoS protection