import { Table, Booking } from './generated/prisma';
import { isTimeWithinOperatingHours, getOperatingHours } from './operating-hours';

/**
 * Validates if a booking date is within the allowed range (up to 31 days in advance)
 */
export function isDateWithinBookingWindow(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const bookingDate = new Date(date);
  bookingDate.setHours(0, 0, 0, 0);
  
  // Can't book in the past
  if (bookingDate < today) {
    return false;
  }
  
  // Maximum 31 days in advance
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 31);
  
  return bookingDate <= maxDate;
}

/**
 * Validates if party size fits table capacity
 */
export function isValidTableCapacity(
  table: Table,
  partySize: number,
  combinedTable?: Table
): boolean {
  if (combinedTable) {
    // For combined tables, sum the capacities
    const minCapacity = Math.min(table.capacityMin, combinedTable.capacityMin);
    const maxCapacity = table.capacityMax + combinedTable.capacityMax;
    return partySize >= minCapacity && partySize <= maxCapacity;
  }
  
  return partySize >= table.capacityMin && partySize <= table.capacityMax;
}

/**
 * Checks if tables can be combined (Tables 15 & 16)
 */
export function canCombineTables(table1: Table, table2: Table): boolean {
  return (
    table1.canCombineWith.includes(table2.tableNumber) &&
    table2.canCombineWith.includes(table1.tableNumber)
  );
}

/**
 * Gets all conflicting bookings for a given date
 * Tables are reserved for the ENTIRE evening when booked
 */
export function getConflictingBookings(
  bookings: Booking[],
  date: Date,
  tableId: string,
  excludeBookingId?: string
): Booking[] {
  return bookings.filter(booking => {
    // Exclude the current booking if updating
    if (excludeBookingId && booking.id === excludeBookingId) {
      return false;
    }

    // Check if same table
    if (booking.tableId !== tableId) {
      return false;
    }

    // Check if same date
    const bookingDate = new Date(booking.bookingDate);
    const targetDate = new Date(date);
    if (
      bookingDate.getFullYear() !== targetDate.getFullYear() ||
      bookingDate.getMonth() !== targetDate.getMonth() ||
      bookingDate.getDate() !== targetDate.getDate()
    ) {
      return false;
    }

    // ANY booking on the same date conflicts (table is booked for entire night)
    return ['PENDING', 'CONFIRMED'].includes(booking.status);
  });
}

/**
 * Simplified table availability check for date-based bookings
 */
export function checkTableAvailability(
  tableId: string,
  date: Date,
  bookings: Booking[],
  excludeBookingId?: string
): boolean {
  const conflicts = getConflictingBookings(bookings, date, tableId, excludeBookingId);
  return conflicts.length === 0;
}

/**
 * Validates all booking rules
 */
export interface BookingValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateBooking(
  date: Date,
  time: string,
  partySize: number,
  table: Table,
  existingBookings: Booking[],
  combinedTable?: Table
): BookingValidationResult {
  const errors: string[] = [];

  // Check date is within booking window
  if (!isDateWithinBookingWindow(date)) {
    errors.push('Bookings can only be made up to 31 days in advance');
  }

  // Check if time is within operating hours
  if (!isTimeWithinOperatingHours(date, time)) {
    const operatingHours = getOperatingHours(date);
    if (operatingHours.isSpecialEvent) {
      errors.push(`${operatingHours.eventName}: Tables are available from ${operatingHours.startTime} to ${operatingHours.endTime}`);
    } else {
      errors.push(`Tables are only available from ${operatingHours.startTime} to ${operatingHours.endTime}`);
    }
  }

  // Check party size fits table
  if (!isValidTableCapacity(table, partySize, combinedTable)) {
    if (combinedTable) {
      errors.push(`Party size must be between 7 and 12 for combined tables`);
    } else {
      errors.push(`Party size must be between ${table.capacityMin} and ${table.capacityMax} for this table`);
    }
  }

  // Check for conflicts - table is booked for entire evening
  const conflicts = getConflictingBookings(existingBookings, date, table.id);
  if (conflicts.length > 0) {
    errors.push('This table is already booked for the entire evening on this date');
  }

  // Check combined table conflicts if applicable
  if (combinedTable) {
    const combinedConflicts = getConflictingBookings(existingBookings, date, combinedTable.id);
    if (combinedConflicts.length > 0) {
      errors.push('The combined table is already booked for the entire evening on this date');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Format booking time for display
 */
export function formatBookingTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${period}`;
}

/**
 * Calculate booking end time (typically 2 hours after start)
 */
export function calculateEndTime(startTime: string): string {
  const [hours, minutes] = startTime.split(':');
  let endHour = parseInt(hours) + 2;
  
  // Handle day rollover
  if (endHour >= 24) {
    endHour = endHour - 24;
  }
  
  return `${endHour.toString().padStart(2, '0')}:${minutes}`;
}