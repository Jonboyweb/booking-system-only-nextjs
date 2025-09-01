# The Backroom Leeds - Table Booking System Development Plan

## 📊 Current Progress
- **Phase 1**: ✅ COMPLETED - Project Setup & Architecture
- **Phase 2**: ✅ COMPLETED - Database & Data Models (100% Complete)
- **Phase 3**: ✅ COMPLETED - Core Booking Flow Frontend (100% Complete)
- **Phase 4**: ✅ COMPLETED - Backend API Development (100% Complete)
- **Phase 5**: ✅ COMPLETED - Payment Integration (100% Complete)
- **Phase 6**: ✅ COMPLETED - Email & Notifications (100% Complete)
- **Phase 7**: ⏳ PENDING - Admin Dashboard
- **Phase 8**: ⏳ PENDING - Mobile Optimization & Testing
- **Phase 9**: ⏳ PENDING - Final Polish & Deployment

**Last Updated**: January 1, 2025
**Overall Progress**: 67% Complete (6 of 9 phases)

## Project Overview
Build a comprehensive Next.js table booking system for a prohibition-themed nightclub with 16 tables across two floors, integrated payment processing, and drink package selection.

## Phase 1: Project Setup & Architecture (Day 1) ✅ COMPLETED
1. **Initialize Next.js 15 project** with TypeScript and Tailwind CSS ✅
   - Next.js 15.5.2 installed with App Router
   - TypeScript configured
   - Tailwind CSS v3 working with custom prohibition theme
2. **Set up project structure**: ✅
   - `/app` - App Router pages and layouts ✅
   - `/components` - Reusable UI components ✅
   - `/lib` - Utilities, API clients, database ✅
   - `/types` - TypeScript definitions ✅
   - `/public` - Static assets (floor plans moved to `/public/floor-plans`) ✅
3. **Configure development environment**: ✅
   - ESLint configured ✅
   - Environment variables for Stripe, database configured ✅
   - `.gitignore` configured ✅

## Phase 2: Database & Data Models (Day 2) ✅ COMPLETED
**Completion Date**: December 1, 2024

### Achievements:
1. **PostgreSQL Database Setup** ✅
   - Docker Compose configuration with PostgreSQL 16-Alpine
   - Database container: `backroom-postgres` running on port 5432
   - Persistent volume for data retention
   - Health checks configured

2. **Prisma ORM Integration** ✅
   - Prisma schema fully defined with 9 models
   - Custom enums: `Floor` (UPSTAIRS/DOWNSTAIRS), `BookingStatus` (5 states)
   - Generated client at `/lib/generated/prisma`
   - Singleton pattern for Next.js integration

3. **Database Schema Implementation** ✅
   - **Tables Model**: 16 tables with full venue layout
     - 10 upstairs tables (including 2 VIP booths)
     - 6 downstairs tables
     - Combinable tables (15 & 16) for larger groups
   - **Bookings Model**: Complete reservation system
     - Unique constraints on table/date/time
     - Status tracking (PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW)
     - Stripe payment integration fields
   - **Customer Model**: Guest management with marketing consent
   - **DrinkPackages Model**: 8 pre-configured packages with JSON storage
   - **Spirits Model**: 31 spirits across 7 categories
   - **Champagnes Model**: 8 premium champagne options
   - **CustomOrders Model**: Flexible bottle selection system
   - **AdminUsers Model**: Role-based access control

4. **Database Seeding** ✅
   - Comprehensive seed script (`prisma/seed.ts`)
   - All venue data imported from documentation
   - Verified data integrity:
     - ✅ 16 tables loaded correctly
     - ✅ 8 drink packages configured
     - ✅ 31 spirits categorized
     - ✅ 8 champagnes available
   
5. **API Verification** ✅
   - `/api/tables` endpoint functioning
   - Database queries working correctly
   - Real-time data access confirmed

## Phase 3: Core Booking Flow - Frontend (Days 3-4) ✅ COMPLETED
**Completion Date**: December 31, 2024

### Achievements:
1. **Interactive Floor Plan Component** ✅
   - Created dynamic SVG floor plans for both floors
   - Implemented table selection with visual feedback
   - Real-time availability with color coding (available/booked/selected/unavailable)
   - Hover tooltips showing table details and features
   
2. **Multi-Step Booking Form** ✅
   - Step 1: DateTimeSelector - Date, time slot, and party size selection
   - Step 2: FloorPlan - Interactive table selection across both floors
   - Step 3: DrinkPackageSelector - Packages and custom bottle selection
   - Step 4: CustomerDetailsForm - Guest information capture
   - Step 5: Payment summary (ready for Stripe integration)
   
3. **Prohibition Theme Implementation** ✅
   - Art Deco patterns in floor plans
   - Gold (#D4AF37), Burgundy (#722F37), Charcoal (#1A1A1A) color scheme
   - Bebas Neue, Poiret One fonts for authentic speakeasy feel
   - Vintage-inspired form elements and buttons
   
4. **API Routes Created** ✅
   - `/api/tables` - Table information
   - `/api/availability` - Real-time availability checking
   - `/api/packages` - Drink packages
   - `/api/spirits` - Spirit inventory
   - `/api/champagnes` - Champagne selection
   - `/api/bookings` - Booking creation and retrieval

## Phase 4: Backend API Development (Days 5-6) ✅ COMPLETED
**Completion Date**: December 31, 2024

### Achievements:
1. **Enhanced API Routes** ✅
   - `/api/availability` - Basic availability checking
   - `/api/availability/[date]` - Detailed availability by date with time slots
   - `/api/availability/stream` - SSE real-time updates
   - `/api/bookings` - Full CRUD with validation
   - `/api/tables/combine` - Table combination logic
   - All existing routes enhanced with business logic
   
2. **Business Logic Implementation** ✅
   - 31-day advance booking limit enforced
   - Table capacity validation with min/max guests
   - Booking conflict prevention (2-hour slots)
   - Dynamic table combinations (Tables 15 & 16)
   - Comprehensive validation utility functions
   
3. **Real-time Features** ✅
   - Server-Sent Events (SSE) for live availability
   - useAvailabilityStream React hook
   - Visual connection status indicator
   - 10-second polling for updates
   
4. **Testing Suite** ✅
   - Automated API testing script
   - All validation rules verified
   - Conflict prevention tested
   - Table combination tested

## Phase 5: Payment Integration (Day 7) ✅ COMPLETED
**Completion Date**: January 1, 2025

### Achievements:
1. **Stripe Integration** ✅
   - Stripe SDK configured for server and client
   - Payment intent creation for £50 deposit
   - Successful/failed payment handling
   - Refund logic with 48-hour policy
   
2. **Payment Security** ✅
   - PCI-compliant Stripe Elements implementation
   - Secure webhook endpoint with signature verification
   - Payment confirmation flow with status tracking
   
3. **Payment Components** ✅
   - PaymentForm component with Stripe Elements
   - Payment page with booking details
   - Confirmation page with booking reference
   - Payment status tracking in database
   
4. **Database Enhancements** ✅
   - PaymentLog model for audit trail
   - Payment tracking fields in Booking model
   - BookingSpirit and BookingChampagne junction tables
   - Refund tracking capabilities

## Phase 6: Email & Notifications (Day 8) ✅ COMPLETED
**Completion Date**: January 1, 2025

### Achievements:
1. **SendGrid Integration** ✅
   - SendGrid SDK configured and integrated
   - API key and sender email configuration
   - Secure email sending service implementation
   - Error handling and logging
   
2. **Email Templates** ✅
   - Prohibition-themed HTML email template
   - Art Deco design with gold/brown color scheme
   - Booking confirmation with all details
   - Plain text fallback version
   - Responsive email design
   
3. **Automated Email Sending** ✅
   - Automatic emails on payment confirmation
   - Stripe webhook integration for triggers
   - Payment success email workflow
   - Table name formatting fixed (Table X - Floor)
   
4. **Testing & Debugging Tools** ✅
   - Email test scripts and endpoints
   - Webhook debugging utilities
   - Payment simulation for email testing
   - Resend functionality for existing bookings
   - Comprehensive logging system

## Phase 7: Admin Dashboard (Days 9-10)
1. **Staff Interface**:
   - Real-time booking overview
   - Table management dashboard
   - Manual booking creation
   - Customer database with history
2. **Analytics & Reporting**:
   - Booking statistics
   - Revenue tracking
   - Popular tables/packages
   - No-show tracking

## Phase 8: Mobile Optimization & Testing (Day 11)
1. **Responsive Design**:
   - Mobile-first booking flow
   - Touch-optimized table selection
   - Progressive Web App features
2. **Cross-browser Testing**:
   - Test on all major browsers
   - Ensure accessibility compliance
3. **Performance Optimization**:
   - Image optimization
   - Code splitting
   - Caching strategies

## Phase 9: Final Polish & Deployment (Day 12)
1. **Final Features**:
   - Booking modification/cancellation
   - Waitlist functionality
   - Special requests handling
2. **Deployment**:
   - Deploy to Vercel
   - Configure production database
   - Set up monitoring and analytics
3. **Documentation**:
   - User guide for staff
   - API documentation
   - Deployment instructions

## Technical Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Supabase/Neon)
- **Payment**: Stripe
- **Email**: SendGrid/Resend
- **Hosting**: Vercel
- **Real-time**: Server-Sent Events

## Key Features to Implement
✓ Interactive floor plans with table selection
✓ Real-time availability checking
✓ Drink package and bottle service selection
✓ £50 deposit payment via Stripe
✓ Email confirmations
✓ Mobile-responsive design
✓ Admin dashboard
✓ Prohibition-themed UI
✓ 31-day advance booking limit
✓ Party size 2-12 guests
✓ Special VIP table handling (Table 10 - Ciroc booth)
✓ Combined table options (Tables 15 & 16)

## Database Schema

### Tables
```sql
- id (UUID, primary key)
- table_number (INTEGER, unique)
- floor (ENUM: 'upstairs', 'downstairs')
- capacity_min (INTEGER)
- capacity_max (INTEGER)
- description (TEXT)
- features (TEXT[])
- is_vip (BOOLEAN)
- can_combine_with (INTEGER[])
```

### Bookings
```sql
- id (UUID, primary key)
- booking_reference (STRING, unique)
- table_id (UUID, foreign key)
- customer_id (UUID, foreign key)
- booking_date (DATE)
- booking_time (TIME)
- party_size (INTEGER)
- status (ENUM: 'pending', 'confirmed', 'cancelled', 'completed')
- deposit_amount (DECIMAL)
- deposit_paid (BOOLEAN)
- stripe_payment_id (STRING)
- drink_package_id (UUID, foreign key, nullable)
- custom_order_id (UUID, foreign key, nullable)
- special_requests (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Customers
```sql
- id (UUID, primary key)
- first_name (STRING)
- last_name (STRING)
- email (STRING, unique)
- phone (STRING)
- date_of_birth (DATE, nullable)
- marketing_consent (BOOLEAN)
- created_at (TIMESTAMP)
```

### DrinkPackages
```sql
- id (UUID, primary key)
- name (STRING)
- price (DECIMAL)
- description (TEXT)
- includes (JSONB)
- is_active (BOOLEAN)
```

### CustomOrders
```sql
- id (UUID, primary key)
- booking_id (UUID, foreign key)
- items (JSONB)
- total_price (DECIMAL)
```

## UI/UX Design Guidelines

### Prohibition Theme Elements
- **Color Palette**: 
  - Primary: Deep gold (#D4AF37)
  - Secondary: Rich burgundy (#722F37)
  - Accent: Art Deco green (#2E5F45)
  - Background: Dark charcoal (#1A1A1A)
  - Text: Cream (#F5F5DC)

- **Typography**:
  - Headlines: Art Deco fonts (Poiret One, Bebas Neue)
  - Body: Clean serif (Playfair Display, Crimson Text)
  
- **Design Elements**:
  - Art Deco patterns and borders
  - Vintage ornamental dividers
  - Speakeasy-inspired icons
  - Distressed textures
  - Gold foil effects for VIP sections

### User Flow
1. **Landing**: Atmospheric hero with "Book Your Table" CTA
2. **Date Selection**: Calendar with available dates highlighted
3. **Party Size**: Visual selector with silhouettes
4. **Table Selection**: Interactive floor plan with hover details
5. **Packages**: Card-based selection with "light show" animation
6. **Details**: Form with vintage styling
7. **Payment**: Secure Stripe checkout
8. **Confirmation**: Themed success page with booking details

## 🚀 Current Development Status

### Services Running
- **Next.js Dev Server**: http://localhost:3001 ✅
- **PostgreSQL Database**: localhost:5432 ✅
- **Docker Container**: backroom-postgres ✅

### Quick Start
```bash
# Start database
docker-compose up -d

# Start development server
npm run dev

# View database
npx prisma studio
```

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Database commands
npx prisma migrate dev
npx prisma generate
npx prisma studio
npx prisma db seed

# Docker commands
docker-compose up -d    # Start database
docker-compose down     # Stop database
docker-compose logs -f  # View logs

# Linting
npm run lint
npm run format
```

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Stripe
STRIPE_PUBLIC_KEY="pk_..."
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email
SENDGRID_API_KEY="..."
FROM_EMAIL="bookings@thebackroomleeds.com"

# App
NEXT_PUBLIC_APP_URL="https://thebackroomleeds.com"
```

## Testing Checklist

- [ ] Booking flow works end-to-end
- [ ] Payment processing successful
- [ ] Email notifications sent
- [ ] Mobile responsive on all devices
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] Performance metrics acceptable (<3s load time)
- [ ] Cross-browser compatibility
- [ ] Error handling for all edge cases
- [ ] Admin dashboard functional
- [ ] Real-time updates working
- [ ] Security best practices implemented