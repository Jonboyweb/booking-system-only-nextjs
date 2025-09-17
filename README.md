# The Backroom Leeds - Table Booking System

A sophisticated table booking system for a prohibition-themed nightclub in Leeds, featuring interactive floor plans, real-time availability, and integrated payment processing.

## 🎭 Features

- **Interactive Floor Plans**: Visual table selection across two floors
- **Real-time Availability**: Live table availability checking with SSE updates
- **Drink Packages**: Pre-defined packages and custom bottle service
- **Payment Integration**: Secure £50 deposit via Stripe
- **Email Confirmations**: Automated booking confirmations via SendGrid
- **Prohibition Theme**: Art Deco design with speakeasy atmosphere
- **Mobile Responsive**: Optimized for all devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker Desktop
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Jonboyweb/booking-system-only-nextjs.git
cd booking-system-only-nextjs
```

2. Install dependencies:
```bash
npm install
```

3. Start the PostgreSQL database:
```bash
docker-compose up -d
```

4. Set up the database:
```bash
npx prisma migrate dev
npx prisma db seed
npx tsx scripts/seed-admin.ts
```

5. Start the development server:
```bash
npm run dev
```

Visit http://localhost:3000 to see the application.

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL 16 (Docker)
- **Payment**: Stripe (Payment Intents API)
- **Email**: SendGrid
- **Authentication**: JWT with bcrypt (Edge Runtime compatible)
- **Real-time**: Server-Sent Events (SSE)
- **Styling**: Tailwind CSS with custom prohibition theme

## 📊 Database Schema

### Venue Layout
- **16 Tables Total**:
  - 10 Upstairs tables (including 2 VIP booths)
  - 6 Downstairs tables
  - Tables 15 & 16 can combine for groups of 7-12

### Core Models
- **Tables**: Venue layout with capacity, features, VIP status
- **Customers**: Guest profiles with contact info and preferences
- **Bookings**: Reservations with status tracking, payment info, and refund tracking
- **DrinkPackages**: 8 pre-configured packages (£40-£580)
- **Spirits**: 31 options across Vodka, Rum, Gin, Cognac, Whiskey, Tequila
- **Champagnes**: 8 premium selections (£85-£250)
- **CustomOrders**: Flexible bottle selection system
- **AdminUsers**: Staff access with role-based permissions
- **PaymentLog**: Audit trail for all payment events including refunds
- **BookingModification**: Complete history of booking changes and refunds

## 🎨 Design Theme

The prohibition/speakeasy theme features:
- **Colors**: Gold (#D4AF37), Burgundy (#722F37), Charcoal (#1A1A1A)
- **Fonts**: Bebas Neue, Poiret One, Playfair Display, Crimson Text
- **UI Elements**: Art Deco patterns, vintage styling

## 📝 Environment Variables

Create a `.env.local` file with:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""

# Email (SendGrid)
SENDGRID_API_KEY=""
SENDGRID_FROM_EMAIL="admin@backroomleeds.co.uk"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 🔧 Development Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server

# Database
npx prisma studio    # Open Prisma Studio
npx prisma migrate dev  # Run migrations
npx prisma db seed   # Seed database

# Docker
docker-compose up -d    # Start services
docker-compose down     # Stop services
docker-compose logs -f  # View logs

# Admin
npx tsx scripts/seed-admin.ts  # Create default admin user
npx tsx scripts/create-admin.ts  # Create custom admin user

# Email Testing
npx tsx scripts/test-email.ts <email>  # Test email sending
npx tsx scripts/simulate-payment.ts <booking-ref>  # Simulate payment & email
npx tsx scripts/resend-email.ts <booking-ref>  # Resend confirmation

# Feature Testing
npx tsx scripts/test-booking-modification.ts  # Test booking modification feature
npx tsx scripts/test-refund.ts  # Test refund functionality
npx tsx scripts/create-paid-booking.ts  # Create paid booking for testing

# Stripe Webhook (for local testing)
stripe listen --forward-to localhost:3000/api/payment/webhook
```

## 👤 Admin Access

Access the admin dashboard at `/admin/login`

**Default Credentials:**
- Email: `admin@backroomleeds.co.uk`
- Password: `admin123`

⚠️ **Important:** Change the default password after first login!

### Admin Dashboard Features:
- **Overview**: Real-time stats, recent bookings, revenue metrics
- **Bookings**: Full CRUD operations, status updates, detail views with modification capability
- **Booking Modifications**: Edit date, time, party size, and table with real-time availability checking
- **Refund Processing**: Stripe-integrated deposit refunds with email confirmations
- **Tables**: Manage table availability and view capacity
- **Customers**: Search customers, view booking history
- **Analytics**: Revenue reports, booking trends, popular tables/packages
- **Email Notifications**: Send booking confirmations, modifications, and refund notices
- **Audit Trail**: Track all booking changes, modifications, and refunds
- **Settings**: Account management, system information

## 📁 Project Structure

```
booking-system-only-nextjs/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── booking/        # Booking pages
│   └── layout.tsx      # Root layout
├── components/         # React components
├── lib/               # Utilities & database
├── prisma/            # Database schema & migrations
├── public/            # Static assets
│   └── floor-plans/   # SVG/PNG floor plans
└── types/             # TypeScript definitions
```

## 🚧 Development Progress

### ✅ Completed Phases
- **Phase 1: Project Setup & Architecture**
  - Next.js 15 with TypeScript configured
  - Tailwind CSS with prohibition theme
  - Project structure established
  
- **Phase 2: Database & Data Models** 
  - PostgreSQL with Docker setup
  - Prisma ORM with 11 models (including PaymentLog)
  - 16 tables, 8 drink packages, 31 spirits seeded
  - API endpoints verified

- **Phase 3: Core Booking Flow Frontend** ✅
  - Interactive SVG floor plans with real-time availability
  - 5-step booking form (date, table, drinks, details, payment)
  - Full prohibition theme with Art Deco design
  - API routes for all booking operations

- **Phase 4: Backend API Development** ✅
  - 31-day advance booking limit enforced
  - Table capacity and conflict validation
  - Dynamic table combinations (15 & 16)
  - Real-time SSE availability updates
  - Comprehensive API testing suite

- **Phase 5: Payment Integration** ✅ COMPLETED
  - Stripe SDK integrated (server & client)
  - £50 deposit payment with Payment Intents API
  - Secure payment form with Stripe Elements
  - Webhook endpoint for payment confirmation
  - PaymentLog model for audit trail
  - Refund logic with 48-hour policy
  - Payment confirmation page with booking details

- **Phase 6: Email & Notifications** ✅ COMPLETED
  - SendGrid integration for transactional emails
  - Prohibition-themed HTML email templates
  - Automatic confirmation emails on payment
  - Plain text fallback for all emails
  - Email testing scripts and utilities
  - Webhook debugging tools
  - Table formatting fixed (Table X - Floor)

- **Phase 7: Admin Dashboard** ✅ COMPLETED
  - JWT-based authentication system (Edge Runtime compatible)
  - Real-time booking overview dashboard
  - Comprehensive booking detail views with edit functionality
  - Booking modification system with real-time availability checking
  - Stripe refund processing with full audit trail
  - Table management interface with activate/deactivate
  - Customer database with search and booking history
  - Analytics and revenue reporting with visualizations
  - Manual booking creation for walk-ins
  - Booking status management and internal notes
  - Modification email notifications with change tracking
  - Refund confirmation emails with payment tracking
  - Email resend functionality
  - Full audit trail with BookingModification model
  - Role-based refund access control
  - Quick test credentials fill

### ⏳ Upcoming Phases
- Phase 8: Mobile Optimization & Testing
- Phase 9: Final Polish & Deployment

**Overall Progress**: 78% Complete (7 of 9 phases)

## 📄 License

Private repository - All rights reserved

## 🤝 Contributing

This is a private project. Please contact the repository owner for access.

---

Built with ❤️ for The Backroom Leeds<!-- Deployment test -->
<!-- Auto-deployment test: Wed Sep 17 09:55:50 PM BST 2025 -->
