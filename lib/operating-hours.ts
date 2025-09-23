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
    endTime: '02:00',
    lastBookingTime: '02:00'
  },
  specialEvents: [
    {
      date: '2025-12-31',
      name: "New Year's Eve",
      startTime: '21:00',
      endTime: '03:00',
      lastBookingTime: '03:00'
    },
    {
      date: '2025-12-24',
      name: "Christmas Eve",
      startTime: '22:00',
      endTime: '02:00',
      lastBookingTime: '02:00'
    },
    {
      date: '2025-12-25',
      name: "Christmas Day",
      startTime: '22:00',
      endTime: '03:00',
      lastBookingTime: '03:00'
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
  
  let endHour = parseInt(hours.endTime.split(':')[0]);
  const endMinute = parseInt(hours.endTime.split(':')[1]);
  
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
  const [endHour, endMinute] = hours.endTime.split(':').map(Number);
  
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