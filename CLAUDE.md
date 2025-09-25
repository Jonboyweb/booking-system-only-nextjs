# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Agents

Use appropriate agents in the .claude/agents folder for completing tasks in this project

## Project Overview

Prohibition-themed nightclub table booking system for The Backroom Leeds. Built with Next.js 15 App Router, featuring interactive floor plans, real-time availability, Stripe payments, comprehensive admin dashboard with venue object management, 2FA authentication, and table blocking capabilities.

## Recent Updates (Updated: 2025-09-25)

### Major Features Added
- **Interactive Floor Plan Editor**: Full drag-and-drop floor plan editor for tables and venue objects
- **Venue Object Management**: Manage bars, DJ booths, dance floors, and other venue elements
- **Two-Factor Authentication (2FA)**: Enhanced security with TOTP-based 2FA for admin accounts
- **Table Blocking System**: Block specific tables on specific dates for private events
- **Enhanced Security**: Rate limiting, CORS protection, input validation, and JWT improvements
- **Cookie Compatibility Fix**: Cross-browser cookie support for admin authentication
- **Password Management**: Admin password change functionality with secure validation

### Recent Bug Fixes
- Fixed cross-browser cookie compatibility issues
- Fixed venue objects display in customer booking view
- Resolved admin dashboard text readability issues
- Fixed refund email functionality for MailHog support
- Fixed critical booking validation and operating hours issues

### New Database Models
- **VenueObject**: Stores venue elements (bars, DJ booths, etc.) with position and styling
- **TableBlock**: Date-specific table blocking for events
- **AdminUser** extensions: Added 2FA fields (twoFactorEnabled, twoFactorSecret, twoFactorBackupCodes)

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
npx tsx scripts/reset-admin-password.ts  # Reset admin password

# Testing Scripts
npx tsx scripts/test-email.ts <email>                    # Test SendGrid email
npx tsx scripts/simulate-payment.ts <booking-ref>        # Simulate Stripe payment
npx tsx scripts/resend-email.ts <booking-ref>           # Resend confirmation email
npx tsx scripts/test-booking-modification.ts            # Test booking modifications
npx tsx scripts/test-refund.ts                         # Test Stripe refunds
npx tsx scripts/create-paid-booking.ts                 # Create test paid booking
npx tsx scripts/test-2fa.ts                           # Test 2FA setup
npx tsx scripts/test-table-blocks.ts                  # Test table blocking

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
- **Email**: SendGrid 8.1.5 / MailHog for development
- **Auth**: JWT with bcryptjs (Edge Runtime compatible) + 2FA with Speakeasy
- **Real-time**: Server-Sent Events (SSE) for availability updates
- **Icons**: Lucide React 0.542.0
- **Security**: Rate limiting (LRU Cache), CORS protection, input validation (Zod)
- **2FA**: Speakeasy for TOTP, QRCode for setup

### Key Project Structure
```
/app                      # Next.js App Router
  /api                   # API endpoints
    /admin/*            # Protected admin endpoints
      /auth            # Authentication (login, 2FA, password)
      /venue-objects   # Venue object CRUD
      /table-blocks    # Table blocking management
    /availability       # Real-time table availability
    /bookings          # Booking CRUD operations
    /payment           # Stripe payment handling
    /email             # Email operations
  /admin                # Admin dashboard pages (protected)
    /dashboard         # Admin home and stats
      /floor-plan      # Interactive floor plan editor
      /settings        # Admin settings & 2FA setup
      /tables          # Table management & blocking
    /login            # Admin authentication with 2FA
  /booking             # Customer booking flow
    /confirmation     # Post-payment confirmation
    /payment         # Stripe payment page
  /test-login        # Development login helpers

/components            # Reusable React components
  /admin              # Admin-specific components
    FloorPlanEditor.tsx                # Table position editor
    FloorPlanEditorWithObjects.tsx    # Full floor plan editor
    TableBlockModal.tsx                # Table blocking interface
    TableBlocksList.tsx                # View/manage blocks
  /booking           # Booking flow components
    FloorPlanWithObjects.tsx          # Customer view with objects

/lib                  # Core utilities and services
  /generated/prisma  # Prisma client output
  api-wrapper.ts     # API error handling wrapper
  cookie-utils.ts    # Cross-browser cookie utilities
  cors.ts           # CORS configuration
  db.ts             # Database client singleton
  email.ts          # SendGrid/MailHog service
  rate-limit.ts     # Rate limiting middleware
  stripe.ts         # Stripe configuration
  /validations       # Input validation schemas
    booking.ts      # Booking validation rules
    payment.ts      # Payment validation

/prisma
  schema.prisma     # Database schema definition
  seed.ts          # Database seeding script
  /migrations      # Database migration history

/public
  /floor-plans     # SVG/PNG venue layouts

/scripts            # Development and testing utilities
/types             # TypeScript type definitions
/.claude/agents    # Claude Code agent configurations
```

## Database Schema (Prisma)

### Core Models
- **Table** (16 tables): Floor location, capacity (2-12), VIP status, combination logic, position coordinates
- **Booking**: Reservation with status enum (pending/confirmed/cancelled/completed/refunded)
- **Customer**: Guest profiles with contact details
- **DrinkPackage** (8 packages): Pre-configured packages (£40-£580)
- **Spirits** (31 spirits): 7 categories (Vodka/Rum/Gin/Cognac/Whiskey/Tequila/Other)
- **Champagnes** (8 selections): Premium bottles (£85-£250)
- **CustomOrders**: Flexible bottle selection for bookings
- **AdminUsers**: Staff with roles (admin/manager/staff), 2FA support, password management
- **PaymentLog**: Complete audit trail of payment events
- **BookingModification**: Track all booking changes and refunds
- **VenueObject**: Venue elements (BAR/DJ_BOOTH/PARTITION/DANCE_FLOOR/EXIT/STAIRCASE/TOILETS/CUSTOM)
- **TableBlock**: Date and time-specific table blocking

### Table Configuration
- Tables 1-10: Upstairs (Tables 5 & 10 are VIP booths)
- Tables 11-16: Downstairs
- Tables 15 & 16: Can combine for groups of 7-12
- All tables have 2-hour booking slots
- Tables store position (x, y) and dimensions (width, height)

## API Patterns and Routes

### Public API Endpoints
```
GET    /api/tables                          # List active tables
GET    /api/tables/all                      # List all tables (including inactive)
GET    /api/availability/[date]             # Check availability for date
GET    /api/availability/stream             # SSE real-time updates
GET    /api/packages                        # List drink packages
GET    /api/spirits                         # List available spirits
GET    /api/champagnes                      # List champagne options
GET    /api/venue-objects                   # Get venue objects for display
POST   /api/bookings                        # Create new booking (with validation)
GET    /api/bookings/[reference]            # Get booking details
POST   /api/payment/create-intent           # Initialize Stripe payment
POST   /api/payment/webhook                 # Stripe webhook handler
```

### Protected Admin Endpoints (JWT required)
```
# Authentication & Security
POST   /api/admin/auth/login                # Admin login (returns JWT)
GET    /api/admin/auth/verify              # Verify JWT token
POST   /api/admin/auth/logout              # Logout admin
POST   /api/admin/auth/change-password     # Change password
GET    /api/admin/auth/2fa/status          # Check 2FA status
POST   /api/admin/auth/2fa/setup           # Setup 2FA
POST   /api/admin/auth/2fa/verify          # Verify 2FA code
POST   /api/admin/auth/2fa/disable         # Disable 2FA

# Bookings Management
GET    /api/admin/bookings                 # List all bookings
PUT    /api/admin/bookings/[id]            # Update booking
DELETE /api/admin/bookings/[id]            # Cancel booking
POST   /api/admin/bookings/[id]/refund     # Process refund

# Customer & Analytics
GET    /api/admin/customers                # List customers
GET    /api/admin/analytics                # Revenue and metrics
GET    /api/admin/stats                    # Dashboard statistics

# Table Management
GET    /api/admin/tables                   # List tables with positions
PUT    /api/admin/tables                   # Batch update tables
PATCH  /api/admin/tables/[id]              # Update single table

# Venue Objects
GET    /api/admin/venue-objects            # List venue objects
POST   /api/admin/venue-objects            # Create venue object
PATCH  /api/admin/venue-objects/[id]       # Update venue object
DELETE /api/admin/venue-objects/[id]       # Delete venue object

# Table Blocking
GET    /api/admin/table-blocks             # List table blocks
POST   /api/admin/table-blocks             # Create table block
DELETE /api/admin/table-blocks/[id]        # Delete table block
```

## Business Logic and Rules

### Booking Constraints
- Maximum 31 days advance booking
- 2-hour time slots: 18:00-20:00, 20:00-22:00, 22:00-00:00
- £50 non-refundable deposit (48-hour refund policy for managers/admins)
- Party size must match table capacity (with ±1 flexibility)
- Tables 15 & 16 combine for groups 7-12
- Bookings validated with Zod schemas for security
- Table blocks prevent bookings on specific dates/times

### Payment Flow
1. Customer completes booking form (validated)
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
- MailHog support for local development

## Security Features

### Authentication & Authorization
- JWT-based authentication with secure httpOnly cookies
- Cross-browser cookie compatibility
- Two-Factor Authentication (2FA) using TOTP
- Backup codes for 2FA recovery
- Password change with validation
- Role-based access control (admin/manager/staff)

### API Security
- Rate limiting on all endpoints (configurable limits)
- CORS protection with configurable origins
- Input validation using Zod schemas
- SQL injection protection via Prisma ORM
- XSS protection through React's built-in escaping
- Environment-based security headers

### Cookie Configuration
- Secure flag in production
- SameSite=Lax for CSRF protection
- HttpOnly to prevent XSS
- Optional domain configuration for subdomains

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

# Optional Cookie Domain (for subdomain support)
# COOKIE_DOMAIN=.localhost
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

# Optional Cookie Domain (for subdomain support)
# COOKIE_DOMAIN=.door50a.co.uk
```

## Common Development Tasks

### Adding a New Admin User
```bash
npx tsx scripts/create-admin.ts
# Follow prompts for email, password, name, and role
```

### Managing 2FA
```bash
# Check 2FA status
npx tsx scripts/check-2fa.ts

# Toggle 2FA for testing
npx tsx scripts/toggle-2fa.ts

# Test 2FA flow
npx tsx scripts/test-2fa.ts
```

### Floor Plan Management
```bash
# Update table positions
npx tsx scripts/update-table-positions.ts

# Seed venue objects
npx tsx scripts/seed-venue-objects.ts

# Test floor plan features
npx tsx scripts/test-floor-plan.ts
```

### Table Blocking
```bash
# Test table blocking API
npx tsx scripts/test-table-blocks-api.ts

# Test blocking functionality
npx tsx scripts/test-deactivated-blocked-tables.ts
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

### Input Validation Pattern
```typescript
import { bookingSchema } from '@/lib/validations/booking';

// Validate request body
const validatedData = bookingSchema.parse(await request.json());
```

### Admin Route Protection
All `/admin/*` routes are protected by middleware. JWT verification happens automatically. Routes requiring 2FA will check for verification status.

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

### Security Testing
```bash
# Test rate limiting and CORS
npx tsx scripts/test-cors-rate-limit.ts

# Test authentication flow
npx tsx scripts/test-admin-login.ts

# Test 2FA implementation
npx tsx scripts/test-2fa-login-flow.ts
```

### Common Issues

1. **Database connection failed**: Ensure Docker is running with `docker-compose up -d`
2. **Stripe webhook not working**: Check webhook secret and ensure stripe CLI is listening
3. **Emails not sending (Local)**: Check MailHog is running at http://localhost:8025
4. **Emails not sending (Production)**: Verify SendGrid API key and sender email is verified
5. **Admin login not working**: Run `npx tsx scripts/seed-admin.ts` to create default admin
6. **Environment confusion**: Check NODE_ENV and EMAIL_PROVIDER variables match your environment
7. **Cookie issues**: Check COOKIE_DOMAIN setting and browser cookie settings
8. **2FA issues**: Use backup codes or disable via database if locked out
9. **Floor plan not saving**: Check table position constraints and venue object validation
10. **Table blocks not working**: Ensure date format matches and time slots are valid

## Production Deployment Notes

- Uses PM2 for process management
- PostgreSQL runs in Docker container
- Manual deployment via `scripts/deploy-prod.sh`
- Production URL: https://br.door50a.co.uk
- Cloudflare proxy enabled for SSL and DDoS protection
- Rate limiting configured per endpoint
- Security headers configured in middleware
- Regular security audits recommended

## Important Notes for Developers

### When Adding New Features
1. Always validate input using Zod schemas
2. Implement proper error handling with try-catch blocks
3. Add rate limiting to new endpoints
4. Test with both MailHog (local) and SendGrid (production)
5. Update this documentation when adding significant features

### Security Best Practices
1. Never log sensitive information (passwords, tokens, keys)
2. Always use parameterized queries (Prisma handles this)
3. Validate and sanitize all user input
4. Use environment variables for secrets
5. Keep dependencies updated (check with npm audit)

### Performance Considerations
1. Use database indexes for frequently queried fields
2. Implement caching for static data (packages, spirits, etc.)
3. Optimize images for floor plans
4. Use pagination for large data sets
5. Monitor rate limit hits and adjust as needed