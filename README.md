# The Backroom Leeds - Table Booking System

A sophisticated table booking system for a prohibition-themed nightclub in Leeds, featuring interactive floor plans, real-time availability, and integrated payment processing.

## 🎭 Features

- **Interactive Floor Plans**: Visual table selection across two floors
- **Real-time Availability**: Live table availability checking
- **Drink Packages**: Pre-defined packages and custom bottle service
- **Payment Integration**: Secure £50 deposit via Stripe
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
- **Payment**: Stripe
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
- **Bookings**: Reservations with status tracking and payment info
- **DrinkPackages**: 8 pre-configured packages (£40-£580)
- **Spirits**: 31 options across Vodka, Rum, Gin, Cognac, Whiskey, Tequila
- **Champagnes**: 8 premium selections (£85-£250)
- **CustomOrders**: Flexible bottle selection system
- **AdminUsers**: Staff access with role-based permissions

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

# Email
EMAIL_API_KEY=""
EMAIL_FROM="bookings@thebackroomleeds.com"

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
```

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

### ⏳ Upcoming Phases
- Phase 6: Email & Notifications
- Phase 7: Admin Dashboard
- Phase 8: Mobile Optimization & Testing
- Phase 9: Final Polish & Deployment

**Overall Progress**: 56% Complete (5 of 9 phases)

## 📄 License

Private repository - All rights reserved

## 🤝 Contributing

This is a private project. Please contact the repository owner for access.

---

Built with ❤️ for The Backroom Leeds