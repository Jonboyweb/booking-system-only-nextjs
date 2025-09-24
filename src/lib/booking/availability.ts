import { db } from '@/lib/db';

/**
 * Check if a specific table is available for a given date
 * Tables are booked for the ENTIRE evening when reserved
 * @param tableId - The ID of the table to check
 * @param date - The date to check (ISO string)
 * @param time - The time slot (kept for compatibility but not used in availability check)
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

    // Check for ANY existing bookings on this date for the table
    // Since tables are booked for entire evening, we ignore the time
    const existingBookings = await db.booking.findMany({
      where: {
        tableId,
        bookingDate,
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
    const table = await db.table.findUnique({
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
 * Get all available tables for a specific date and party size
 * Tables are booked for the ENTIRE evening when reserved
 * @param date - The date to check (ISO string)
 * @param time - The time slot (kept for compatibility but not used in availability check)
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
    const suitableTables = await db.table.findMany({
      where: {
        capacityMin: { lte: partySize },
        capacityMax: { gte: partySize },
        isActive: true
      },
      orderBy: {
        tableNumber: 'asc'
      }
    });

    // Get ALL bookings for this date (regardless of time)
    const bookedTables = await db.booking.findMany({
      where: {
        bookingDate,
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
 * Tables are booked for the ENTIRE evening when reserved
 * @param partySize - The size of the party
 * @param date - The date to check
 * @param time - The time slot (kept for compatibility but not used)
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
      db.table.findFirst({ where: { tableNumber: 15 } }),
      db.table.findFirst({ where: { tableNumber: 16 } })
    ]);

    if (!table15 || !table16) {
      return false;
    }

    // Check if either table is already booked for the entire evening
    const existingBookings = await db.booking.findMany({
      where: {
        tableId: {
          in: [table15.id, table16.id]
        },
        bookingDate,
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
 * Tables are booked for the ENTIRE evening when reserved
 * @param tableId - The table ID to check
 * @param date - The date to check
 * @param time - The time slot (kept for compatibility but not used)
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

    // Check for ANY bookings on this date (entire evening reservation)
    const conflicts = await db.booking.findMany({
      where: {
        tableId,
        bookingDate,
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

    return conflicts.map(conflict => ({
      bookingReference: conflict.bookingReference,
      customerName: `${conflict.customer.firstName} ${conflict.customer.lastName}`,
      partySize: conflict.partySize
    }));
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
    const table = await db.table.findUnique({
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