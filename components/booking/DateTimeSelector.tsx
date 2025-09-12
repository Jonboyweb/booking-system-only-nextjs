'use client';

import { useState, useEffect } from 'react';
import { generateTimeSlots, getOperatingHours } from '@/lib/operating-hours';

interface DateTimeSelectorProps {
  date: string;
  time: string;
  partySize: number;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onPartySizeChange: (size: number) => void;
  onNext: () => void;
}

export default function DateTimeSelector({
  date,
  time,
  partySize,
  onDateChange,
  onTimeChange,
  onPartySizeChange,
  onNext
}: DateTimeSelectorProps) {
  // Calculate min and max dates (today to 31 days from now)
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];
  const maxDate = new Date(today.getTime() + 31 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [operatingHours, setOperatingHours] = useState<{ startTime: string; endTime: string; isSpecialEvent: boolean; eventName?: string } | null>(null);
  
  // Update time slots when date changes
  useEffect(() => {
    if (date) {
      const selectedDate = new Date(date);
      const hours = getOperatingHours(selectedDate);
      const slots = generateTimeSlots(selectedDate);
      setOperatingHours(hours);
      setTimeSlots(slots);
      
      // Reset time if it's not in the new slots
      if (time && !slots.includes(time)) {
        onTimeChange('');
      }
    }
  }, [date, time, onTimeChange]);
  
  const isValid = date && time && partySize >= 2 && partySize <= 12;
  
  return (
    <div className="bg-charcoal-light p-8 rounded-lg border-2 border-gold">
      <h2 className="text-3xl font-bebas text-gold mb-6">Select Date & Party Size</h2>
      
      <div className="space-y-6">
        {/* Date Selection */}
        <div>
          <label className="block text-cream mb-2 font-poiret">Booking Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            min={minDate}
            max={maxDate}
            className="w-full p-3 bg-charcoal border border-gold rounded text-cream focus:outline-none focus:border-gold-light"
          />
          {operatingHours?.isSpecialEvent ? (
            <p className="text-xs text-gold mt-1">
              🎉 {operatingHours.eventName}: {operatingHours.startTime} - {operatingHours.endTime}
            </p>
          ) : operatingHours ? (
            <p className="text-xs text-cream-dark mt-1">
              Operating hours: {operatingHours.startTime} - {operatingHours.endTime}
            </p>
          ) : (
            <p className="text-xs text-cream-dark mt-1">Book up to 31 days in advance</p>
          )}
        </div>
        
        {/* Time Selection */}
        <div>
          <label className="block text-cream mb-2 font-poiret">Arrival Time</label>
          {date ? (
            timeSlots.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map(slot => (
                  <button
                    key={slot}
                    onClick={() => onTimeChange(slot)}
                    className={`p-2 rounded border transition-all ${
                      time === slot
                        ? 'bg-gold text-charcoal border-gold'
                        : 'bg-charcoal border-gold-dark text-cream hover:bg-gold-dark hover:text-charcoal'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-cream-dark">Please select a date first</p>
            )
          ) : (
            <p className="text-cream-dark">Please select a date first</p>
          )}
          {time && (
            <p className="text-xs text-gold mt-2">
              ⚠️ Booking any time reserves the table for the entire night
            </p>
          )}
        </div>
        
        {/* Party Size */}
        <div>
          <label className="block text-cream mb-2 font-poiret">Party Size</label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => partySize > 2 && onPartySizeChange(partySize - 1)}
              className="w-10 h-10 rounded-full bg-gold text-charcoal font-bold hover:bg-gold-light disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={partySize <= 2}
            >
              -
            </button>
            <div className="flex-1 text-center">
              <span className="text-4xl font-bebas text-gold">{partySize}</span>
              <span className="text-cream ml-2">guests</span>
            </div>
            <button
              onClick={() => partySize < 12 && onPartySizeChange(partySize + 1)}
              className="w-10 h-10 rounded-full bg-gold text-charcoal font-bold hover:bg-gold-light disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={partySize >= 12}
            >
              +
            </button>
          </div>
          <p className="text-xs text-cream-dark text-center mt-2">Minimum 2, Maximum 12 guests</p>
        </div>
        
        {/* Next Button */}
        <button
          onClick={onNext}
          disabled={!isValid}
          className="w-full py-4 bg-gold text-charcoal font-bebas text-xl rounded hover:bg-gold-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Select Table
        </button>
      </div>
    </div>
  );
}