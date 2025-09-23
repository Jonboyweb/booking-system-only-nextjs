import { z } from 'zod';

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation regex (UK format)
const phoneRegex = /^(\+44|0)?[1-9]\d{9,10}$/;

// Base customer schema
const customerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z.string()
    .regex(emailRegex, 'Invalid email format')
    .toLowerCase()
    .max(255, 'Email must be less than 255 characters'),
  phone: z.string()
    .regex(phoneRegex, 'Invalid UK phone number format')
    .transform(val => val.replace(/\s/g, '')), // Remove spaces
});

// Custom order item schema
const customOrderItemSchema = z.object({
  spiritId: z.number()
    .int('Spirit ID must be an integer')
    .positive('Spirit ID must be positive'),
  quantity: z.number()
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .max(10, 'Maximum 10 bottles per spirit'),
});

// Champagne order item schema
const champagneOrderItemSchema = z.object({
  champagneId: z.number()
    .int('Champagne ID must be an integer')
    .positive('Champagne ID must be positive'),
  quantity: z.number()
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .max(10, 'Maximum 10 bottles per champagne'),
});

// Booking creation schema
export const createBookingSchema = z.object({
  customer: customerSchema,
  tableId: z.number()
    .int('Table ID must be an integer')
    .min(1, 'Invalid table ID')
    .max(16, 'Invalid table ID'), // Based on 16 tables in the system
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const bookingDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 31);
      return bookingDate >= today && bookingDate <= maxDate;
    }, 'Booking must be between today and 31 days from now'),
  timeSlot: z.enum(['18:00-20:00', '20:00-22:00', '22:00-00:00'], {
    message: 'Invalid time slot',
  }),
  partySize: z.number()
    .int('Party size must be an integer')
    .min(1, 'Party size must be at least 1')
    .max(12, 'Party size must be 12 or less'),
  packageId: z.number()
    .int('Package ID must be an integer')
    .positive('Package ID must be positive')
    .optional()
    .nullable(),
  customOrder: z.array(customOrderItemSchema)
    .max(20, 'Maximum 20 different spirits per order')
    .optional()
    .nullable(),
  champagneOrder: z.array(champagneOrderItemSchema)
    .max(10, 'Maximum 10 different champagnes per order')
    .optional()
    .nullable(),
  specialRequests: z.string()
    .max(500, 'Special requests must be less than 500 characters')
    .optional()
    .nullable()
    .transform(val => val?.trim() || null),
  stripePaymentIntentId: z.string()
    .min(1, 'Payment intent ID is required')
    .max(255, 'Payment intent ID too long')
    .regex(/^pi_[a-zA-Z0-9]+$/, 'Invalid payment intent ID format')
    .optional(),
}).refine(
  (data) => data.packageId || (data.customOrder && data.customOrder.length > 0),
  'Either a package or custom order must be selected'
);

// Booking update schema for admin
export const updateBookingSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'refunded'], {
    message: 'Invalid booking status',
  }).optional(),
  customer: customerSchema.partial().optional(),
  tableId: z.number()
    .int('Table ID must be an integer')
    .min(1, 'Invalid table ID')
    .max(16, 'Invalid table ID')
    .optional(),
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  timeSlot: z.enum(['18:00-20:00', '20:00-22:00', '22:00-00:00'], {
    message: 'Invalid time slot',
  }).optional(),
  partySize: z.number()
    .int('Party size must be an integer')
    .min(1, 'Party size must be at least 1')
    .max(12, 'Party size must be 12 or less')
    .optional(),
  specialRequests: z.string()
    .max(500, 'Special requests must be less than 500 characters')
    .nullable()
    .optional()
    .transform(val => val?.trim() || null),
  adminNotes: z.string()
    .max(1000, 'Admin notes must be less than 1000 characters')
    .nullable()
    .optional()
    .transform(val => val?.trim() || null),
}).strict(); // Prevent unknown fields

// Payment intent creation schema
export const createPaymentIntentSchema = z.object({
  bookingReference: z.string()
    .min(10, 'Invalid booking reference')
    .max(20, 'Invalid booking reference')
    .regex(/^BOOK-[A-Z0-9]+$/, 'Invalid booking reference format'),
  amount: z.number()
    .int('Amount must be an integer (in pence)')
    .min(5000, 'Minimum deposit is £50')
    .max(10000, 'Maximum deposit is £100'),
  currency: z.literal('gbp'),
}).strict();

// Refund request schema
export const refundBookingSchema = z.object({
  amount: z.number()
    .int('Amount must be an integer (in pence)')
    .min(100, 'Minimum refund amount is £1')
    .max(10000, 'Maximum refund amount is £100')
    .optional(),
  reason: z.string()
    .min(5, 'Refund reason must be at least 5 characters')
    .max(500, 'Refund reason must be less than 500 characters'),
  notify: z.boolean().optional().default(true),
}).strict();

// Query parameters schema for listing bookings
export const listBookingsQuerySchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'refunded'])
    .optional(),
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  customerId: z.string()
    .regex(/^\d+$/, 'Customer ID must be numeric')
    .transform(Number)
    .optional(),
  page: z.string()
    .regex(/^\d+$/, 'Page must be numeric')
    .optional()
    .default('1')
    .transform(Number),
  limit: z.string()
    .regex(/^\d+$/, 'Limit must be numeric')
    .optional()
    .default('20')
    .transform(Number)
    .refine(val => val <= 100, 'Maximum limit is 100'),
});

// Booking reference validation
export const bookingReferenceSchema = z.string()
  .min(10, 'Invalid booking reference')
  .max(20, 'Invalid booking reference')
  .regex(/^BOOK-[A-Z0-9]+$/, 'Invalid booking reference format');

// ID parameter validation
export const idParamSchema = z.string()
  .regex(/^\d+$/, 'ID must be numeric')
  .transform(Number)
  .refine(val => val > 0, 'ID must be positive');

// Date parameter validation for availability checks
export const dateParamSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((date) => {
    const checkDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 31);
    return checkDate >= today && checkDate <= maxDate;
  }, 'Date must be between today and 31 days from now');

// Helper function to sanitize strings for XSS prevention
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Helper function to validate and parse request body
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string; details?: z.ZodError<any> }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return {
        success: false,
        error: 'Validation failed',
        details: result.error,
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch {
    return {
      success: false,
      error: 'Invalid JSON in request body',
    };
  }
}

// Helper function to format validation errors
export function formatZodError(error: z.ZodError<any>): string {
  if (!error) {
    return 'Validation error occurred';
  }
  const issues = error.issues;
  if (!issues || issues.length === 0) {
    return 'Validation error occurred';
  }
  const errors = issues.map(issue => {
    const path = issue.path.join('.');
    return `${path}: ${issue.message}`;
  });
  return errors.join(', ');
}