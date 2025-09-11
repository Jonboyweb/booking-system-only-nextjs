'use client';

interface CustomerDetailsFormProps {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth?: string;
    specialRequests?: string;
    marketingConsent: boolean;
  };
  onChange: (field: string, value: string | boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function CustomerDetailsForm({
  formData,
  onChange,
  onNext,
  onBack
}: CustomerDetailsFormProps) {
  const isValid = formData.firstName && formData.lastName && formData.email && formData.phone;
  
  return (
    <div className="bg-charcoal-light p-8 rounded-lg border-2 border-gold">
      <h2 className="text-3xl font-bebas text-gold mb-6">Your Details</h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-cream mb-2 font-poiret">First Name *</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => onChange('firstName', e.target.value)}
              className="w-full p-3 bg-charcoal border border-gold rounded text-cream focus:outline-none focus:border-gold-light"
              required
            />
          </div>
          <div>
            <label className="block text-cream mb-2 font-poiret">Last Name *</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => onChange('lastName', e.target.value)}
              className="w-full p-3 bg-charcoal border border-gold rounded text-cream focus:outline-none focus:border-gold-light"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-cream mb-2 font-poiret">Email Address *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => onChange('email', e.target.value)}
            className="w-full p-3 bg-charcoal border border-gold rounded text-cream focus:outline-none focus:border-gold-light"
            required
          />
        </div>
        
        <div>
          <label className="block text-cream mb-2 font-poiret">Phone Number *</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            className="w-full p-3 bg-charcoal border border-gold rounded text-cream focus:outline-none focus:border-gold-light"
            placeholder="07XXX XXXXXX"
            required
          />
        </div>
        
        <div>
          <label className="block text-cream mb-2 font-poiret">Date of Birth</label>
          <input
            type="date"
            value={formData.dateOfBirth || ''}
            onChange={(e) => onChange('dateOfBirth', e.target.value)}
            className="w-full p-3 bg-charcoal border border-gold rounded text-cream focus:outline-none focus:border-gold-light"
          />
          <p className="text-xs text-cream-dark mt-1">Optional - for birthday treats</p>
        </div>
        
        <div>
          <label className="block text-cream mb-2 font-poiret">Special Requests</label>
          <textarea
            value={formData.specialRequests || ''}
            onChange={(e) => onChange('specialRequests', e.target.value)}
            rows={3}
            className="w-full p-3 bg-charcoal border border-gold rounded text-cream focus:outline-none focus:border-gold-light"
            placeholder="Any special requirements or celebrations?"
          />
        </div>
        
        <div className="flex items-start gap-3 pt-2">
          <input
            type="checkbox"
            id="marketing"
            checked={formData.marketingConsent}
            onChange={(e) => onChange('marketingConsent', e.target.checked)}
            className="mt-1 accent-gold"
          />
          <label htmlFor="marketing" className="text-sm text-cream-dark">
            I&apos;d like to receive exclusive offers and updates from The Backroom Leeds
          </label>
        </div>
      </div>
      
      {/* Navigation Buttons */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={onBack}
          className="flex-1 py-3 border border-gold text-cream font-bebas text-lg rounded hover:bg-gold hover:text-charcoal transition-all"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          className="flex-1 py-3 bg-gold text-charcoal font-bebas text-lg rounded hover:bg-gold-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Review & Pay
        </button>
      </div>
    </div>
  );
}