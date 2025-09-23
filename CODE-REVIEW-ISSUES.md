# Code Review - Critical Issues and Fix Plan

## Executive Summary
The code review identified several critical security vulnerabilities and performance issues in the API layer that require immediate attention. The most severe issues involve JWT verification gaps, database connection management, and missing input validation.

## Critical Issues Identified

### 1. Security Vulnerabilities

#### 1.1 JWT Token Verification Issues
**Severity: CRITICAL**
- JWT tokens are not properly verified in some endpoints
- Missing token expiration checks
- No refresh token mechanism
- Token secret stored in plain environment variable

**Affected Files:**
- `/app/api/admin/auth/verify/route.ts`
- `/app/api/admin/*` - All admin endpoints

#### 1.2 CORS Configuration Too Permissive
**Severity: HIGH**
- CORS allows all origins in production
- Missing proper origin validation
- Credentials included without proper checks

**Affected Files:**
- All API routes lacking proper CORS headers

#### 1.3 Missing Input Validation
**Severity: HIGH**
- No request body validation using schemas
- SQL injection possible through unvalidated inputs
- XSS vulnerabilities in user-submitted content

**Affected Files:**
- `/app/api/bookings/route.ts`
- `/app/api/admin/bookings/[id]/route.ts`
- `/app/api/payment/create-intent/route.ts`

### 2. Performance Issues

#### 2.1 Database Connection Management
**Severity: HIGH**
- Multiple Prisma client instances being created
- Not using singleton pattern from `/lib/db.ts`
- Connection pool exhaustion risk

**Affected Files:**
- Multiple API routes importing Prisma directly instead of using the singleton

#### 2.2 Missing Database Indexes
**Severity: MEDIUM**
- No indexes on frequently queried fields
- Slow queries on booking lookups by reference
- Missing composite indexes for date/time/table queries

#### 2.3 No Rate Limiting
**Severity: HIGH**
- Public endpoints vulnerable to abuse
- No DDoS protection at application level
- Payment endpoints can be spammed

### 3. Code Quality Issues

#### 3.1 Inconsistent Error Handling
**Severity: MEDIUM**
- Different error response formats across endpoints
- Some errors expose sensitive information
- Missing error logging

#### 3.2 Missing TypeScript Types
**Severity: MEDIUM**
- Request/response types not defined
- Using `any` type in several places
- No runtime type validation

#### 3.3 Async Operations Issues
**Severity: LOW**
- Some promises not properly awaited
- Missing try-catch blocks in async functions
- Potential race conditions in booking creation

## Fix Implementation Plan

### Phase 1: Critical Security Fixes (Immediate)

#### Task 1: Fix JWT Verification
```typescript
// Create middleware for proper JWT verification
// Location: /lib/auth/middleware.ts

import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export async function verifyJWT(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    throw new Error('No token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
      algorithms: ['HS256'],
      maxAge: '24h'
    });
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}
```

#### Task 2: Implement Request Validation
```typescript
// Use Zod for runtime validation
// Location: /lib/validators/booking.ts

import { z } from 'zod';

export const CreateBookingSchema = z.object({
  customerName: z.string().min(2).max(100),
  customerEmail: z.string().email(),
  customerPhone: z.string().regex(/^[\d\s+()-]+$/),
  date: z.string().datetime(),
  timeSlot: z.enum(['18:00-20:00', '20:00-22:00', '22:00-00:00']),
  tableId: z.number().int().positive(),
  partySize: z.number().int().min(1).max(12),
  specialRequests: z.string().max(500).optional()
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
```

#### Task 3: Configure CORS Properly
```typescript
// Location: /lib/cors.ts

export function setCORSHeaders(origin: string | null) {
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'https://br.door50a.co.uk',
    'https://backroomleeds.co.uk'
  ];

  if (origin && allowedOrigins.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400'
    };
  }

  return {};
}
```

### Phase 2: Performance Optimizations (High Priority)

#### Task 4: Fix Database Connection
```typescript
// Ensure all files use the singleton
// Update all API routes to import from @/lib/db

import { db } from '@/lib/db';
// NOT: import { PrismaClient } from '@prisma/client';
```

#### Task 5: Add Database Indexes
```prisma
// Location: /prisma/schema.prisma

model Booking {
  // ... existing fields

  @@index([reference]) // Fast lookup by booking reference
  @@index([date, timeSlot]) // Availability queries
  @@index([customerId]) // Customer bookings
  @@index([status, date]) // Admin dashboard queries
  @@index([createdAt]) // Recent bookings
}

model Table {
  // ... existing fields

  @@index([floor, isActive]) // Floor filtering
  @@index([capacity]) // Capacity queries
}
```

#### Task 6: Implement Rate Limiting
```typescript
// Location: /lib/rate-limit.ts

import { LRUCache } from 'lru-cache';

const rateLimitCache = new LRUCache<string, number>({
  max: 500,
  ttl: 60 * 1000 // 1 minute
});

export async function rateLimit(
  identifier: string,
  limit: number = 10
): Promise<void> {
  const tokenCount = rateLimitCache.get(identifier) || 0;

  if (tokenCount >= limit) {
    throw new Error('Rate limit exceeded');
  }

  rateLimitCache.set(identifier, tokenCount + 1);
}

// Usage in API route:
// await rateLimit(req.ip || 'anonymous', 5);
```

### Phase 3: Code Quality Improvements (Medium Priority)

#### Task 7: Standardize Error Handling
```typescript
// Location: /lib/api/errors.ts

export class APIError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
  }
}

export function handleAPIError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof APIError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code
      },
      { status: error.statusCode }
    );
  }

  return NextResponse.json(
    { success: false, error: 'Internal server error' },
    { status: 500 }
  );
}
```

#### Task 8: Add Input Sanitization
```typescript
// Location: /lib/sanitize.ts

import DOMPurify from 'isomorphic-dompurify';

export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}

export function sanitizeBookingData(data: any) {
  return {
    ...data,
    customerName: sanitizeInput(data.customerName),
    customerEmail: sanitizeInput(data.customerEmail),
    specialRequests: data.specialRequests ? sanitizeInput(data.specialRequests) : null
  };
}
```

## Implementation Timeline

### Week 1 (Immediate)
- [ ] Fix JWT verification in all admin endpoints
- [ ] Add request validation schemas
- [ ] Configure CORS properly
- [ ] Fix database connection singleton usage

### Week 2
- [ ] Add database indexes via migration
- [ ] Implement rate limiting
- [ ] Standardize error handling
- [ ] Add input sanitization

### Week 3
- [ ] Complete TypeScript type definitions
- [ ] Add comprehensive logging
- [ ] Performance testing
- [ ] Security audit

## Testing Requirements

### Security Testing
- [ ] JWT token expiration tests
- [ ] SQL injection prevention tests
- [ ] XSS prevention tests
- [ ] Rate limiting tests

### Performance Testing
- [ ] Load testing with 1000+ concurrent requests
- [ ] Database query performance benchmarks
- [ ] Memory leak detection
- [ ] Connection pool monitoring

### Integration Testing
- [ ] End-to-end booking flow
- [ ] Payment processing
- [ ] Email delivery
- [ ] Admin operations

## Monitoring Requirements

### Post-Deployment Monitoring
- Error rate monitoring
- API response times
- Database query performance
- Rate limit violations
- Failed authentication attempts

## Dependencies to Add

```json
{
  "dependencies": {
    "zod": "^3.22.4",
    "lru-cache": "^10.1.0",
    "isomorphic-dompurify": "^2.9.0"
  }
}
```

## Environment Variable Updates

```env
# Add to .env files
JWT_ALGORITHM=HS256
JWT_MAX_AGE=24h
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=10
ALLOWED_ORIGINS=https://br.door50a.co.uk,https://backroomleeds.co.uk
```

## Rollback Plan

If issues arise during implementation:
1. Revert to previous commit via git
2. Restore database from backup
3. Clear CDN cache
4. Monitor error logs for 30 minutes
5. Communicate with stakeholders

## Success Metrics

- Zero critical security vulnerabilities
- API response time < 200ms for 95% of requests
- Zero unauthorized access attempts succeeding
- 99.9% uptime
- All OWASP Top 10 vulnerabilities addressed