export interface OperatingHours {
  regularHours: {
    startTime: string;
    endTime: string;
    lastBookingTime: string;
  };
  specialEvents: {
    date: string;
    name: string;
    startTime: string;
    endTime: string;
    lastBookingTime: string;
  }[];
}

export const OPERATING_HOURS: OperatingHours = {
  regularHours: {
    startTime: '23:00',
    endTime: '06:00',  // Venue operates until 6am
    lastBookingTime: '02:00'  // Last arrival time for bookings is 2am
  },
  specialEvents: [
    {
      date: '2025-12-31',
      name: "New Year's Eve",
      startTime: '21:00',  // Earlier start for NYE
      endTime: '06:00',  // Venue still closes at 6am
      lastBookingTime: '03:00'  // Extended booking window until 3am
    },
    {
      date: '2025-12-24',
      name: "Christmas Eve",
      startTime: '22:00',  // Slightly earlier start
      endTime: '06:00',  // Venue operates until 6am
      lastBookingTime: '02:00'  // Standard last booking time
    },
    {
      date: '2025-12-25',
      name: "Christmas Day",
      startTime: '22:00',  // Earlier start for Christmas
      endTime: '06:00',  // Venue operates until 6am
      lastBookingTime: '03:00'  // Extended booking window until 3am
    }
  ]
};

export function getOperatingHours(date: Date): { startTime: string; endTime: string; lastBookingTime: string; isSpecialEvent: boolean; eventName?: string } {
  const dateStr = date.toISOString().split('T')[0];
  
  const specialEvent = OPERATING_HOURS.specialEvents.find(event => event.date === dateStr);
  
  if (specialEvent) {
    return {
      startTime: specialEvent.startTime,
      endTime: specialEvent.endTime,
      lastBookingTime: specialEvent.lastBookingTime,
      isSpecialEvent: true,
      eventName: specialEvent.name
    };
  }
  
  return {
    ...OPERATING_HOURS.regularHours,
    isSpecialEvent: false
  };
}

export function generateTimeSlots(date: Date): string[] {
  const hours = getOperatingHours(date);
  const slots: string[] = [];

  const startHour = parseInt(hours.startTime.split(':')[0]);
  const startMinute = parseInt(hours.startTime.split(':')[1]);

  // Use lastBookingTime instead of endTime for generating booking slots
  let endHour = parseInt(hours.lastBookingTime.split(':')[0]);
  const endMinute = parseInt(hours.lastBookingTime.split(':')[1]);

  // Handle next day scenario (e.g., 23:00 to 02:00)
  if (endHour < startHour) {
    endHour += 24;
  }

  // Generate 30-minute slots
  let currentHour = startHour;
  let currentMinute = startMinute;

  while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
    const displayHour = currentHour >= 24 ? currentHour - 24 : currentHour;
    const timeStr = `${displayHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    slots.push(timeStr);

    // Add 30 minutes
    currentMinute += 30;
    if (currentMinute >= 60) {
      currentMinute = 0;
      currentHour++;
    }
  }

  return slots;
}

export function isTimeWithinOperatingHours(date: Date, time: string): boolean {
  const hours = getOperatingHours(date);
  const [inputHour, inputMinute] = time.split(':').map(Number);
  const [startHour, startMinute] = hours.startTime.split(':').map(Number);
  // For booking validation, we check against lastBookingTime, not endTime
  const [endHour, endMinute] = hours.lastBookingTime.split(':').map(Number);

  const inputMinutes = inputHour * 60 + inputMinute;
  const startMinutes = startHour * 60 + startMinute;
  let endMinutes = endHour * 60 + endMinute;

  // Handle next day scenario
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
    if (inputMinutes < startMinutes) {
      return inputMinutes + 24 * 60 <= endMinutes;
    }
  }

  return inputMinutes >= startMinutes && inputMinutes <= endMinutes;
}

// Helper function to validate if a time is a valid booking slot
export function isValidBookingTimeSlot(date: Date, time: string): boolean {
  // Generate all valid time slots for the date
  const validSlots = generateTimeSlots(date);

  // Check if the provided time is in the valid slots
  return validSlots.includes(time);
}