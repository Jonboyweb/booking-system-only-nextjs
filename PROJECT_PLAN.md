# The Backroom Leeds - Table Booking System Development Plan

## 📊 Current Progress
- **Phase 1**: ✅ COMPLETED - Project Setup & Architecture
- **Phase 2**: ✅ COMPLETED - Database & Data Models  
- **Phase 3**: 🚧 IN PROGRESS - Core Booking Flow Frontend
- **Phase 4**: ⏳ PENDING - Backend API Development
- **Phase 5**: ⏳ PENDING - Payment Integration
- **Phase 6**: ⏳ PENDING - Email & Notifications
- **Phase 7**: ⏳ PENDING - Admin Dashboard
- **Phase 8**: ⏳ PENDING - Mobile Optimization & Testing
- **Phase 9**: ⏳ PENDING - Final Polish & Deployment

**Last Updated**: August 31, 2025

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
1. **Set up PostgreSQL with Prisma ORM** ✅
   - Docker Compose with PostgreSQL 16 running
   - Prisma client generated at `/lib/generated/prisma`
2. **Create database schema**: ✅
   - Tables (16 tables with full details) ✅
   - Bookings (with unique constraints, status enum) ✅
   - DrinkPackages (8 packages from menu) ✅
   - Spirits (31 spirits categorized) ✅
   - Champagnes (8 champagne options) ✅
   - CustomOrders (JSON storage for selections) ✅
   - Customers (contact info, preferences) ✅
   - AdminUsers (for dashboard access) ✅
3. **Seed database** with table data and drink menu ✅
   - All 16 tables seeded
   - All drink packages and spirits loaded
   - Database fully operational

## Phase 3: Core Booking Flow - Frontend (Days 3-4)
1. **Interactive Floor Plan Component**:
   - Convert SVG floor plans to interactive React components
   - Implement table selection with visual feedback
   - Show real-time availability with color coding
2. **Booking Form Flow**:
   - Step 1: Date & party size selection (2-12 guests)
   - Step 2: Interactive table selection based on capacity
   - Step 3: Drink package/bottle selection
   - Step 4: Customer information form
   - Step 5: Payment & confirmation
3. **Implement prohibition theme**:
   - Art Deco design patterns
   - Speakeasy-inspired UI elements
   - Vintage typography and color scheme

## Phase 4: Backend API Development (Days 5-6)
1. **Next.js API Routes**:
   - `/api/availability` - Check table availability by date/time
   - `/api/bookings` - Create, read, update bookings
   - `/api/tables` - Get table information
   - `/api/packages` - Drink packages and pricing
2. **Business Logic**:
   - 31-day advance booking limit
   - Table capacity validation
   - Conflict prevention (no double bookings)
   - Dynamic table combinations (Tables 15 & 16)
3. **Real-time updates** using Server-Sent Events or WebSockets

## Phase 5: Payment Integration (Day 7)
1. **Stripe Integration**:
   - Set up Stripe Connect
   - Create payment intent for £50 deposit
   - Handle successful/failed payments
   - Implement refund logic for cancellations
2. **Payment Security**:
   - PCI compliance
   - Secure webhook handling
   - Payment confirmation flow

## Phase 6: Email & Notifications (Day 8)
1. **Email Service Setup** (SendGrid/Resend):
   - Booking confirmation emails
   - Reminder emails (24 hours before)
   - Cancellation notifications
2. **Email Templates**:
   - Prohibition-themed HTML templates
   - Booking details with QR code
   - Special instructions for VIP tables

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