import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

/**
 * Check if a specific table is available for a given date and time
 * @param tableId - The ID of the table to check
 * @param date - The date to check (ISO string)
 * @param time - The time slot to check (e.g., "10:00 PM")
 * @param excludeBookingId - Optional booking ID to exclude (for modifications)
 * @returns Promise<boolean> - True if available, false otherwise
 */
export async function checkTableAvailability(
  tableId: string,
  date: string,
  time: string,
  excludeBookingId?: string
): Promise<boolean> {
  try {
    const bookingDate = new Date(date);
    
    // Check for existing bookings at this date/time for the table
    const existingBookings = await prisma.booking.findMany({
      where: {
        tableId,
        bookingDate,
        bookingTime: time,
        status: {
          in: ['PENDING', 'CONFIRMED']
        },
        ...(excludeBookingId && { id: { not: excludeBookingId } })
      }
    });

    return existingBookings.length === 0;
  } catch (error) {
    console.error('Error checking table availability:', error);
    return false;
  }
}

/**
 * Validate if party size fits within table capacity
 * @param tableId - The ID of the table
 * @param partySize - The size of the party
 * @returns Promise<boolean> - True if valid, false otherwise
 */
export async function validatePartySize(
  tableId: string,
  partySize: number
): Promise<boolean> {
  try {
    const table = await prisma.table.findUnique({
      where: { id: tableId }
    });

    if (!table) {
      return false;
    }

    return partySize >= table.capacityMin && partySize <= table.capacityMax;
  } catch (error) {
    console.error('Error validating party size:', error);
    return false;
  }
}

/**
 * Get all available tables for a specific date, time, and party size
 * @param date - The date to check (ISO string)
 * @param time - The time slot to check
 * @param partySize - The size of the party
 * @param excludeBookingId - Optional booking ID to exclude
 * @returns Promise<Array> - Array of available tables
 */
export async function getAvailableTablesForDateTime(
  date: string,
  time: string,
  partySize: number,
  excludeBookingId?: string
): Promise<Array<{id: string; tableNumber: number; floor: string; capacityMin: number; capacityMax: number; isVip: boolean; description: string; features: string[];}>> {
  try {
    const bookingDate = new Date(date);
    
    // Get all tables that can accommodate the party size
    const suitableTables = await prisma.table.findMany({
      where: {
        capacityMin: { lte: partySize },
        capacityMax: { gte: partySize },
        isActive: true
      },
      orderBy: {
        tableNumber: 'asc'
      }
    });

    // Get all bookings for this date/time
    const bookedTables = await prisma.booking.findMany({
      where: {
        bookingDate,
        bookingTime: time,
        status: {
          in: ['PENDING', 'CONFIRMED']
        },
        ...(excludeBookingId && { id: { not: excludeBookingId } })
      },
      select: {
        tableId: true
      }
    });

    const bookedTableIds = bookedTables.map(b => b.tableId);

    // Filter out booked tables
    const availableTables = suitableTables.filter(
      table => !bookedTableIds.includes(table.id)
    );

    // Check for table combination possibility (tables 15 & 16)
    if (partySize >= 7 && partySize <= 12) {
      const table15 = suitableTables.find(t => t.tableNumber === 15);
      const table16 = suitableTables.find(t => t.tableNumber === 16);
      
      if (table15 && table16) {
        const table15Booked = bookedTableIds.includes(table15.id);
        const table16Booked = bookedTableIds.includes(table16.id);
        
        if (!table15Booked && !table16Booked) {
          // Add a combined table option
          availableTables.push({
            id: 'combined-15-16',
            tableNumber: 1516,
            floor: table15.floor,
            capacityMin: 7,
            capacityMax: 12,
            description: 'Combined Tables 15 & 16',
            features: [...table15.features, 'Combined seating'],
            isVip: false,
            isActive: true,
            canCombineWith: [],
            createdAt: table15.createdAt,
            updatedAt: table15.updatedAt
          });
        }
      }
    }

    return availableTables;
  } catch (error) {
    console.error('Error getting available tables:', error);
    return [];
  }
}

/**
 * Check if tables 15 & 16 can be combined for a party
 * @param partySize - The size of the party
 * @param date - The date to check
 * @param time - The time slot to check
 * @param excludeBookingId - Optional booking ID to exclude
 * @returns Promise<boolean> - True if tables can be combined
 */
export async function canCombineTables(
  partySize: number,
  date: string,
  time: string,
  excludeBookingId?: string
): Promise<boolean> {
  try {
    // Combined tables only work for parties of 7-12
    if (partySize < 7 || partySize > 12) {
      return false;
    }

    const bookingDate = new Date(date);

    // Get tables 15 and 16
    const [table15, table16] = await Promise.all([
      prisma.table.findFirst({ where: { tableNumber: 15 } }),
      prisma.table.findFirst({ where: { tableNumber: 16 } })
    ]);

    if (!table15 || !table16) {
      return false;
    }

    // Check if either table is already booked
    const existingBookings = await prisma.booking.findMany({
      where: {
        tableId: {
          in: [table15.id, table16.id]
        },
        bookingDate,
        bookingTime: time,
        status: {
          in: ['PENDING', 'CONFIRMED']
        },
        ...(excludeBookingId && { id: { not: excludeBookingId } })
      }
    });

    return existingBookings.length === 0;
  } catch (error) {
    console.error('Error checking table combination:', error);
    return false;
  }
}

/**
 * Get booking conflicts for a proposed change
 * @param tableId - The table ID to check
 * @param date - The date to check
 * @param time - The time slot to check
 * @param excludeBookingId - Booking ID to exclude
 * @returns Promise<Array> - Array of conflicting bookings
 */
export async function getBookingConflicts(
  tableId: string,
  date: string,
  time: string,
  excludeBookingId: string
): Promise<Array<{bookingReference: string; customerName: string; partySize: number;}>> {
  try {
    const bookingDate = new Date(date);
    
    const conflicts = await prisma.booking.findMany({
      where: {
        tableId,
        bookingDate,
        bookingTime: time,
        status: {
          in: ['PENDING', 'CONFIRMED']
        },
        id: { not: excludeBookingId }
      },
      include: {
        customer: true,
        table: true
      }
    });

    return conflicts;
  } catch (error) {
    console.error('Error checking booking conflicts:', error);
    return [];
  }
}

/**
 * Validate date is within booking limits (max 31 days in advance)
 * @param date - The date to validate
 * @returns boolean - True if date is valid
 */
export function validateBookingDate(date: string): boolean {
  const bookingDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Can't book in the past
  if (bookingDate < today) {
    return false;
  }
  
  // Can't book more than 31 days in advance
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 31);
  maxDate.setHours(23, 59, 59, 999);
  
  return bookingDate <= maxDate;
}

/**
 * Get table details with availability status
 * @param tableId - The table ID
 * @param date - The date to check
 * @param time - The time slot to check
 * @param excludeBookingId - Optional booking ID to exclude
 * @returns Promise<object> - Table with availability status
 */
export async function getTableWithAvailability(
  tableId: string,
  date: string,
  time: string,
  excludeBookingId?: string
): Promise<{id: string; tableNumber: number; floor: string; capacityMin: number; capacityMax: number; isVip: boolean; isAvailable: boolean;} | null> {
  try {
    const table = await prisma.table.findUnique({
      where: { id: tableId }
    });

    if (!table) {
      return null;
    }

    const isAvailable = await checkTableAvailability(
      tableId,
      date,
      time,
      excludeBookingId
    );

    return {
      ...table,
      isAvailable
    };
  } catch (error) {
    console.error('Error getting table with availability:', error);
    return null;
  }
}