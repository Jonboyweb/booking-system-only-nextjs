import BookingFlow from '@/components/booking/BookingFlow';

export default function BookingPage() {
  return (
    <div className="min-h-screen bg-charcoal">
      {/* Header */}
      <div className="bg-charcoal-light border-b-2 border-gold">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bebas text-gold">Book Your Table</h1>
          <p className="text-cream font-poiret mt-2">Reserve your spot at Leeds' most exclusive speakeasy</p>
        </div>
      </div>
      
      {/* Booking Flow */}
      <BookingFlow />
    </div>
  );
}