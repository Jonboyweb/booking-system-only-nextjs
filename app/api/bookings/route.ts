import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  isValidTableCapacity
} from '@/lib/booking-validation';
import {
  createBookingSchema,
  validateRequest,
  formatZodError,
  sanitizeString,
  bookingReferenceSchema,
  idParamSchema
} from '@/lib/validations/booking';
import { isValidBookingTimeSlot } from '@/lib/operating-hours';
import { z } from 'zod';
import { checkRateLimit, applyRateLimitHeaders, RateLimitConfigs } from '@/lib/rate-limit';
import { withCORS } from '@/lib/cors';

// Generate booking reference
function generateBookingRef(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = 'BR-';
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for booking creation
    const rateLimitResult = await checkRateLimit(request, 'booking-create', RateLimitConfigs.bookingCreate);

    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Too many booking attempts. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        },
        { status: 429 }
      );
      return applyRateLimitHeaders(withCORS(response, request), rateLimitResult);
    }

    // Parse and validate request body with Zod
    const validationResult = await validateRequest(request, createBookingSchema);

    if (!validationResult.success) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.details ? formatZodError(validationResult.details) : validationResult.error
        },
        { status: 400 }
      );
      return applyRateLimitHeaders(withCORS(response, request), rateLimitResult);
    }

    const validatedData = validationResult.data;

    // Parse the date string to Date object
    const bookingDate = new Date(validatedData.date);

    // Get table information
    const table = await db.table.findUnique({
      where: { id: validatedData.tableId }
    });

    if (!table) {
      const response = NextResponse.json(
        { success: false, error: 'Invalid table selected' },
        { status: 400 }
      );
      return applyRateLimitHeaders(withCORS(response, request), rateLimitResult);
    }

    // Validate table capacity
    if (!isValidTableCapacity(table, validatedData.partySize)) {
      const response = NextResponse.json(
        {
          success: false,
          error: `Party size must be between ${table.capacityMin} and ${table.capacityMax} for this table`
        },
        { status: 400 }
      );
      return applyRateLimitHeaders(withCORS(response, request), rateLimitResult);
    }

    // Validate time slot is within operating hours for the selected date
    if (!isValidBookingTimeSlot(bookingDate, validatedData.timeSlot)) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Invalid time slot. Please select a time within operating hours.'
        },
        { status: 400 }
      );
      return applyRateLimitHeaders(withCORS(response, request), rateLimitResult);
    }

    // Check for existing bookings on the same date (table is booked for entire evening)
    const existingBookings = await db.booking.findMany({
      where: {
        bookingDate: bookingDate,
        tableId: validatedData.tableId,
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      }
    });

    if (existingBookings.length > 0) {
      const response = NextResponse.json(
        { success: false, error: 'This table is already booked for the entire evening on this date. Please select a different table or date.' },
        { status: 400 }
      );
      return applyRateLimitHeaders(withCORS(response, request), rateLimitResult);
    }

    // Create or find customer with validated and sanitized data
    let customer = await db.customer.findUnique({
      where: { email: validatedData.customer.email }
    });

    if (!customer) {
      // Split name into first and last name
      const nameParts = validatedData.customer.name.trim().split(' ');
      const firstName = sanitizeString(nameParts[0]);
      const lastName = sanitizeString(nameParts.slice(1).join(' ') || nameParts[0]);

      customer = await db.customer.create({
        data: {
          firstName,
          lastName,
          email: validatedData.customer.email,
          phone: validatedData.customer.phone,
          marketingConsent: false
        }
      });
    }

    // Generate unique booking reference
    let bookingReference: string;
    let isUnique = false;
    do {
      bookingReference = generateBookingRef();
      const existing = await db.booking.findUnique({
        where: { bookingReference }
      });
      isUnique = !existing;
    } while (!isUnique);

    // Create booking with validated data
    const booking = await db.booking.create({
      data: {
        bookingReference,
        tableId: validatedData.tableId,
        customerId: customer.id,
        bookingDate,
        bookingTime: validatedData.timeSlot,
        partySize: validatedData.partySize,
        status: 'PENDING',
        depositAmount: 50,
        depositPaid: false,
        drinkPackageId: validatedData.packageId || null,
        specialRequests: validatedData.specialRequests ? sanitizeString(validatedData.specialRequests) : null,
        stripePaymentId: validatedData.stripePaymentIntentId || null
      },
      include: {
        table: true,
        customer: true,
        drinkPackage: true
      }
    });

    // Handle custom order if provided
    if (validatedData.customOrder && validatedData.customOrder.length > 0) {
      let totalPrice = 0;
      const items = {
        spirits: [] as Array<{id: number; name: string; price: number; quantity: number;}>,
        champagnes: [] as Array<{id: number; name: string; price: number; quantity: number;}>
      };

      // Process spirits with validated quantities
      for (const orderItem of validatedData.customOrder) {
        const spirit = await db.spirit.findUnique({
          where: { id: orderItem.spiritId }
        });

        if (!spirit) {
          // Rollback booking if spirit not found
          await db.booking.delete({ where: { id: booking.id } });
          const response = NextResponse.json(
            { success: false, error: `Invalid spirit ID: ${orderItem.spiritId}` },
            { status: 400 }
          );
          return applyRateLimitHeaders(withCORS(response, request), rateLimitResult);
        }

        await db.bookingSpirit.create({
          data: {
            bookingId: booking.id,
            spiritId: spirit.id,
            quantity: orderItem.quantity,
            price: spirit.price
          }
        });

        items.spirits.push({
          id: Number(spirit.id),
          name: spirit.name,
          price: Number(spirit.price),
          quantity: orderItem.quantity
        });
        totalPrice += Number(spirit.price) * orderItem.quantity;
      }

      // Process champagnes if provided
      if (validatedData.champagneOrder && validatedData.champagneOrder.length > 0) {
        for (const champagneItem of validatedData.champagneOrder) {
          const champagne = await db.champagne.findUnique({
            where: { id: champagneItem.champagneId }
          });

          if (!champagne) {
            // Rollback booking if champagne not found
            await db.booking.delete({ where: { id: booking.id } });
            const response = NextResponse.json(
              { success: false, error: `Invalid champagne ID: ${champagneItem.champagneId}` },
              { status: 400 }
            );
            return applyRateLimitHeaders(withCORS(response, request), rateLimitResult);
          }

          await db.bookingChampagne.create({
            data: {
              bookingId: booking.id,
              champagneId: champagne.id,
              quantity: champagneItem.quantity,
              price: champagne.price
            }
          });

          items.champagnes.push({
            id: Number(champagne.id),
            name: champagne.name,
            price: Number(champagne.price),
            quantity: champagneItem.quantity
          });
          totalPrice += Number(champagne.price) * champagneItem.quantity;
        }
      }

      // Create custom order record
      await db.customOrder.create({
        data: {
          bookingId: booking.id,
          items,
          totalPrice
        }
      });
    }

    const response = NextResponse.json({
      success: true,
      data: booking
    }, { status: 201 });

    // Apply rate limit headers and CORS
    return applyRateLimitHeaders(withCORS(response, request), rateLimitResult);
  } catch (error) {
    console.error('Booking creation failed:', error);
    const response = NextResponse.json(
      { success: false, error: 'Failed to create booking' },
      { status: 500 }
    );
    return withCORS(response, request);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const reference = searchParams.get('reference');
    const email = searchParams.get('email');

    // Validate and process ID parameter
    if (id) {
      const validationResult = idParamSchema.safeParse(id);
      if (!validationResult.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid booking ID format' },
          { status: 400 }
        );
      }

      const booking = await db.booking.findUnique({
        where: { id: validationResult.data },
        include: {
          table: true,
          customer: true,
          drinkPackage: true,
          customOrder: true,
          spirits: {
            include: {
              spirit: true
            }
          },
          champagnes: {
            include: {
              champagne: true
            }
          }
        }
      });

      if (!booking) {
        const response = NextResponse.json(
          { success: false, error: 'Booking not found' },
          { status: 404 }
        );
        return withCORS(response, request);
      }

      const response = NextResponse.json({ success: true, data: booking });
      return withCORS(response, request);
    }

    // Validate and process reference parameter
    if (reference) {
      const validationResult = bookingReferenceSchema.safeParse(reference);
      if (!validationResult.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid booking reference format' },
          { status: 400 }
        );
      }

      const booking = await db.booking.findUnique({
        where: { bookingReference: validationResult.data },
        include: {
          table: true,
          customer: true,
          drinkPackage: true,
          customOrder: true,
          spirits: {
            include: {
              spirit: true
            }
          },
          champagnes: {
            include: {
              champagne: true
            }
          }
        }
      });

      if (!booking) {
        const response = NextResponse.json(
          { success: false, error: 'Booking not found' },
          { status: 404 }
        );
        return withCORS(response, request);
      }

      const response = NextResponse.json({ success: true, data: booking });
      return withCORS(response, request);
    }

    // Validate and process email parameter
    if (email) {
      const emailSchema = z.string().email('Invalid email format').max(255);
      const validationResult = emailSchema.safeParse(email);

      if (!validationResult.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        );
      }

      const customer = await db.customer.findUnique({
        where: { email: validationResult.data.toLowerCase() },
        include: {
          bookings: {
            include: {
              table: true,
              drinkPackage: true,
              customOrder: true
            },
            orderBy: {
              bookingDate: 'desc'
            }
          }
        }
      });

      if (!customer) {
        const response = NextResponse.json({ success: true, data: { bookings: [] } });
        return withCORS(response, request);
      }

      const response = NextResponse.json({ success: true, data: { bookings: customer.bookings } });
      return withCORS(response, request);
    }

    const response = NextResponse.json(
      { success: false, error: 'Booking ID, reference, or email required' },
      { status: 400 }
    );
    return withCORS(response, request);
  } catch (error) {
    console.error('Failed to fetch booking:', error);
    const response = NextResponse.json(
      { success: false, error: 'Failed to fetch booking' },
      { status: 500 }
    );
    return withCORS(response, request);
  }
}