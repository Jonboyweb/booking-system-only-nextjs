import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date');
  
  if (!date) {
    return new Response('Date parameter required', { status: 400 });
  }
  
  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
      );
      
      // Function to send availability updates
      const sendUpdate = async () => {
        try {
          const bookingDate = new Date(date);
          
          // Get all tables
          const tables = await prisma.table.findMany();
          
          // Get all bookings for the date
          const bookings = await prisma.booking.findMany({
            where: {
              bookingDate,
              status: {
                in: ['PENDING', 'CONFIRMED']
              }
            }
          });
          
          // Calculate availability for each time slot
          const timeSlots = [
            '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
            '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'
          ];
          
          const availability = timeSlots.map(time => {
            const bookedTableIds = bookings
              .filter(b => {
                const bookingHour = parseInt(b.bookingTime.split(':')[0]);
                const slotHour = parseInt(time.split(':')[0]);
                return Math.abs(bookingHour - slotHour) < 2;
              })
              .map(b => b.tableId);
            
            return {
              time,
              availableCount: tables.filter(t => !bookedTableIds.includes(t.id)).length,
              bookedTables: bookedTableIds.length
            };
          });
          
          // Send the update
          const data = {
            type: 'availability',
            date,
            timestamp: new Date().toISOString(),
            slots: availability
          };
          
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch (error) {
          console.error('SSE update error:', error);
        }
      };
      
      // Send initial update
      await sendUpdate();
      
      // Set up polling interval (every 10 seconds)
      const interval = setInterval(sendUpdate, 10000);
      
      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    }
  });
}