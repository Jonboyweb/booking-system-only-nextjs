import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  validateBooking, 
  isDateWithinBookingWindow,
  isValidTableCapacity 
} from '@/lib/booking-validation';

// Generate booking reference
function generateBookingRef(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = 'BR-';
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.tableId || !body.date || !body.time || !body.partySize || !body.customer) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate booking date is within 31-day window
    const bookingDate = new Date(body.date);
    if (!isDateWithinBookingWindow(bookingDate)) {
      return NextResponse.json(
        { error: 'Bookings can only be made up to 31 days in advance' },
        { status: 400 }
      );
    }
    
    // Get table information
    const table = await prisma.table.findUnique({
      where: { id: body.tableId }
    });
    
    if (!table) {
      return NextResponse.json(
        { error: 'Invalid table selected' },
        { status: 400 }
      );
    }
    
    // Handle combined tables (15 & 16)
    let combinedTable = null;
    if (body.combinedTableId) {
      combinedTable = await prisma.table.findUnique({
        where: { id: body.combinedTableId }
      });
      
      // Verify tables can be combined
      if (!table.canCombineWith.includes(combinedTable?.tableNumber || 0)) {
        return NextResponse.json(
          { error: 'These tables cannot be combined' },
          { status: 400 }
        );
      }
    }
    
    // Validate table capacity
    if (!isValidTableCapacity(table, body.partySize, combinedTable)) {
      const minCapacity = combinedTable ? 7 : table.capacityMin;
      const maxCapacity = combinedTable ? 
        table.capacityMax + combinedTable.capacityMax : 
        table.capacityMax;
      
      return NextResponse.json(
        { error: `Party size must be between ${minCapacity} and ${maxCapacity} for this table` },
        { status: 400 }
      );
    }
    
    // Get all bookings for validation
    const existingBookings = await prisma.booking.findMany({
      where: {
        bookingDate: bookingDate,
        bookingTime: body.time,
        status: {
          in: ['PENDING', 'CONFIRMED']
        },
        OR: [
          { tableId: body.tableId },
          ...(body.combinedTableId ? [{ tableId: body.combinedTableId }] : [])
        ]
      }
    });
    
    // Validate booking
    const validation = validateBooking(
      bookingDate,
      body.time,
      body.partySize,
      table,
      existingBookings,
      combinedTable
    );
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join('. ') },
        { status: 400 }
      );
    }
    
    // Create or find customer
    let customer = await prisma.customer.findUnique({
      where: { email: body.customer.email }
    });
    
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          firstName: body.customer.firstName,
          lastName: body.customer.lastName,
          email: body.customer.email,
          phone: body.customer.phone,
          dateOfBirth: body.customer.dateOfBirth ? new Date(body.customer.dateOfBirth) : null,
          marketingConsent: body.customer.marketingConsent || false
        }
      });
    }
    
    // Create custom order if bottles selected
    let customOrderId = null;
    if ((body.selectedSpirits && body.selectedSpirits.length > 0) || 
        (body.selectedChampagnes && body.selectedChampagnes.length > 0)) {
      
      // Calculate total price
      let totalPrice = 0;
      const items = {
        spirits: [],
        champagnes: []
      };
      
      if (body.selectedSpirits && body.selectedSpirits.length > 0) {
        const spirits = await prisma.spirit.findMany({
          where: { id: { in: body.selectedSpirits } }
        });
        items.spirits = spirits;
        totalPrice += spirits.reduce((sum, s) => sum + s.price, 0);
      }
      
      if (body.selectedChampagnes && body.selectedChampagnes.length > 0) {
        const champagnes = await prisma.champagne.findMany({
          where: { id: { in: body.selectedChampagnes } }
        });
        items.champagnes = champagnes;
        totalPrice += champagnes.reduce((sum, c) => sum + c.price, 0);
      }
      
      const customOrder = await prisma.customOrder.create({
        data: {
          items,
          totalPrice
        }
      });
      
      customOrderId = customOrder.id;
    }
    
    // Create booking
    const booking = await prisma.booking.create({
      data: {
        bookingReference: generateBookingRef(),
        tableId: body.tableId,
        customerId: customer.id,
        bookingDate: new Date(body.date),
        bookingTime: body.time,
        partySize: body.partySize,
        status: 'PENDING',
        depositAmount: 50,
        depositPaid: false,
        drinkPackageId: body.drinkPackageId || null,
        customOrderId,
        specialRequests: body.specialRequests || null
      },
      include: {
        table: true,
        customer: true,
        drinkPackage: true,
        customOrder: true
      }
    });
    
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Booking creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    const email = searchParams.get('email');
    
    if (reference) {
      const booking = await prisma.booking.findUnique({
        where: { bookingReference: reference },
        include: {
          table: true,
          customer: true,
          drinkPackage: true,
          customOrder: true
        }
      });
      
      if (!booking) {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(booking);
    }
    
    if (email) {
      const customer = await prisma.customer.findUnique({
        where: { email },
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
        return NextResponse.json({ bookings: [] });
      }
      
      return NextResponse.json({ bookings: customer.bookings });
    }
    
    return NextResponse.json(
      { error: 'Reference or email required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to fetch booking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}