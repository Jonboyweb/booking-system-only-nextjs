import { useEffect, useState, useRef } from 'react';

interface AvailabilitySlot {
  time: string;
  availableCount: number;
  bookedTables: number;
}

interface AvailabilityUpdate {
  type: string;
  date: string;
  timestamp: string;
  slots: AvailabilitySlot[];
}

export function useAvailabilityStream(date: string | null) {
  const [availability, setAvailability] = useState<AvailabilityUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  
  useEffect(() => {
    if (!date) {
      return;
    }
    
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    // Create new SSE connection
    const eventSource = new EventSource(`/api/availability/stream?date=${date}`);
    eventSourceRef.current = eventSource;
    
    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'connected') {
          console.log('SSE connected for date:', date);
        } else if (data.type === 'availability') {
          setAvailability(data);
        }
      } catch (err) {
        console.error('Failed to parse SSE data:', err);
      }
    };
    
    eventSource.onerror = (err) => {
      console.error('SSE error:', err);
      setIsConnected(false);
      setError('Connection lost. Retrying...');
      
      // Reconnect after 5 seconds
      setTimeout(() => {
        if (eventSourceRef.current === eventSource) {
          eventSource.close();
          eventSourceRef.current = null;
        }
      }, 5000);
    };
    
    // Cleanup on unmount or date change
    return () => {
      eventSource.close();
      if (eventSourceRef.current === eventSource) {
        eventSourceRef.current = null;
      }
    };
  }, [date]);
  
  return {
    availability,
    isConnected,
    error
  };
}