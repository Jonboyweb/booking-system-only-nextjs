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

## Current Development Status

Project is 78% complete (Phase 7 of 9 completed). Remaining phases:
- Phase 8: Mobile Optimization & Testing
- Phase 9: Final Polish & Deployment

The development server runs on port 3000 with PostgreSQL on port 5432 via Docker.