'use client';

import { useState, useEffect } from 'react';
import DateTimeSelector from './DateTimeSelector';
import FloorPlan from './FloorPlan';
import DrinkPackageSelector from './DrinkPackageSelector';
import CustomerDetailsForm from './CustomerDetailsForm';
import { BookingFormData, BookingStep, Table, DrinkPackage, Spirit, Champagne } from '@/types/booking';
import { useAvailabilityStream } from '@/hooks/useAvailabilityStream';

export default function BookingFlow() {
  const [currentStep, setCurrentStep] = useState<BookingStep>('date');
  const [tables, setTables] = useState<Table[]>([]);
  const [packages, setPackages] = useState<DrinkPackage[]>([]);
  const [spirits, setSpirits] = useState<Spirit[]>([]);
  const [champagnes, setChampagnes] = useState<Champagne[]>([]);
  const [bookedTables, setBookedTables] = useState<number[]>([]);
  
  const [formData, setFormData] = useState<BookingFormData>({
    date: '',
    time: '',
    partySize: 2,
    customer: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      marketingConsent: false
    }
  });
  
  const [selectedSpirits, setSelectedSpirits] = useState<string[]>([]);
  const [selectedChampagnes, setSelectedChampagnes] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | undefined>();
  
  // Use real-time availability stream
  const { isConnected } = useAvailabilityStream(formData.date);
  
  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load tables
        const tablesRes = await fetch('/api/tables');
        if (tablesRes.ok) {
          const data = await tablesRes.json();
          setTables(data);
        }
        
        // Load drink packages
        const packagesRes = await fetch('/api/packages');
        if (packagesRes.ok) {
          const data = await packagesRes.json();
          setPackages(data);
        }
        
        // Load spirits
        const spiritsRes = await fetch('/api/spirits');
        if (spiritsRes.ok) {
          const data = await spiritsRes.json();
          setSpirits(data);
        }
        
        // Load champagnes
        const champagnesRes = await fetch('/api/champagnes');
        if (champagnesRes.ok) {
          const data = await champagnesRes.json();
          setChampagnes(data);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    
    loadData();
  }, []);
  
  // Check availability when date/time changes
  useEffect(() => {
    const checkAvailability = async () => {
      if (formData.date && formData.time) {
        try {
          const res = await fetch(`/api/availability?date=${formData.date}&time=${formData.time}`);
          if (res.ok) {
            const data = await res.json();
            setBookedTables(data.bookedTables || []);
          }
        } catch (error) {
          console.error('Failed to check availability:', error);
        }
      }
    };
    
    checkAvailability();
  }, [formData.date, formData.time]);
  
  const steps: BookingStep[] = ['date', 'table', 'drinks', 'details', 'payment'];
  const stepTitles = {
    date: 'Select Date & Time',
    table: 'Choose Your Table',
    drinks: 'Drinks & Bottles',
    details: 'Your Details',
    payment: 'Payment'
  };
  
  const goToStep = (step: BookingStep) => {
    setCurrentStep(step);
  };
  
  const handleTableSelect = (table: Table) => {
    setSelectedTable(table);
    setFormData({ ...formData, tableId: table.id });
  };
  
  const handleCustomerFieldChange = (field: string, value: string | boolean) => {
    setFormData({
      ...formData,
      customer: {
        ...formData.customer,
        [field]: value
      }
    });
  };
  
  const handlePayment = async () => {
    try {
      // Validate that drinks have been selected
      if (!formData.drinkPackageId && selectedSpirits.length === 0) {
        alert('Please select a drinks package or custom bottles before proceeding.');
        goToStep('drinks');
        return;
      }

      // Transform customer data to match backend schema
      const customerData = {
        name: `${formData.customer.firstName.trim()} ${formData.customer.lastName.trim()}`.trim(),
        email: formData.customer.email,
        phone: formData.customer.phone
      };

      // Transform selected spirits and champagnes to match backend schema
      const customOrder = selectedSpirits.length > 0
        ? selectedSpirits.map(spiritId => ({
            spiritId: spiritId,
            quantity: 1
          }))
        : null; // Use null instead of undefined for JSON serialization

      const champagneOrder = selectedChampagnes.length > 0
        ? selectedChampagnes.map(champagneId => ({
            champagneId: champagneId,
            quantity: 1
          }))
        : null; // Use null instead of undefined for JSON serialization

      // Create the booking
      const bookingResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tableId: formData.tableId,
          date: formData.date,
          timeSlot: formData.time, // Backend expects 'timeSlot', not 'time'
          partySize: formData.partySize,
          customer: customerData, // Use transformed customer data
          packageId: formData.drinkPackageId || null, // Ensure null instead of undefined
          customOrder: customOrder, // Use transformed format (null when no spirits)
          champagneOrder: champagneOrder, // Use transformed format (null when no champagnes)
          specialRequests: formData.specialRequests || ''
        })
      });

      if (!bookingResponse.ok) {
        const error = await bookingResponse.json();
        console.error('Booking failed:', error);

        // Handle specific validation errors
        if (error.details) {
          alert(`Booking failed: ${error.details}`);
        } else {
          alert(error.error || 'Failed to create booking. Please check all fields and try again.');
        }
        return;
      }

      const bookingResult = await bookingResponse.json();

      // Redirect to payment page - access booking data from the response
      window.location.href = `/booking/payment?bookingId=${bookingResult.data.id}`;
    } catch (error) {
      console.error('Booking failed:', error);
      alert('Failed to create booking. Please try again.');
    }
  };
  
  return (
    <div className="min-h-screen bg-charcoal py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div
                key={step}
                className="flex-1 flex items-center"
              >
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                    steps.indexOf(currentStep) >= index
                      ? 'bg-gold border-gold text-charcoal'
                      : 'bg-charcoal border-gold-dark text-cream'
                  } font-bebas text-xl cursor-pointer transition-all`}
                  onClick={() => steps.indexOf(currentStep) >= index && goToStep(step)}
                >
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${
                    steps.indexOf(currentStep) > index ? 'bg-gold' : 'bg-gold-dark'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map(step => (
              <div
                key={step}
                className={`flex-1 text-center text-sm font-poiret ${
                  currentStep === step ? 'text-gold' : 'text-cream-dark'
                }`}
              >
                {stepTitles[step]}
              </div>
            ))}
          </div>
        </div>
        
        {/* Step Content */}
        {currentStep === 'date' && (
          <DateTimeSelector
            date={formData.date}
            time={formData.time}
            partySize={formData.partySize}
            onDateChange={(date) => setFormData({ ...formData, date })}
            onTimeChange={(time) => setFormData({ ...formData, time })}
            onPartySizeChange={(size) => setFormData({ ...formData, partySize: size })}
            onNext={() => goToStep('table')}
          />
        )}
        
        {currentStep === 'table' && (
          <div className="space-y-6">
            {/* Real-time availability indicator */}
            {formData.date && (
              <div className="flex items-center justify-end gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                <span className="text-cream-dark">
                  {isConnected ? 'Live availability' : 'Connecting...'}
                </span>
              </div>
            )}
            <FloorPlan
              floor="UPSTAIRS"
              tables={tables}
              selectedTable={selectedTable}
              onTableSelect={handleTableSelect}
              partySize={formData.partySize}
              date={formData.date}
              bookedTables={bookedTables}
            />
            <FloorPlan
              floor="DOWNSTAIRS"
              tables={tables}
              selectedTable={selectedTable}
              onTableSelect={handleTableSelect}
              partySize={formData.partySize}
              date={formData.date}
              bookedTables={bookedTables}
            />
            <div className="flex gap-4">
              <button
                onClick={() => goToStep('date')}
                className="flex-1 py-3 border border-gold text-cream font-bebas text-lg rounded hover:bg-gold hover:text-charcoal transition-all"
              >
                Back
              </button>
              <button
                onClick={() => goToStep('drinks')}
                disabled={!selectedTable}
                className="flex-1 py-3 bg-gold text-charcoal font-bebas text-lg rounded hover:bg-gold-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        )}
        
        {currentStep === 'drinks' && (
          <DrinkPackageSelector
            packages={packages}
            spirits={spirits}
            champagnes={champagnes}
            selectedPackage={formData.drinkPackageId}
            selectedSpirits={selectedSpirits}
            selectedChampagnes={selectedChampagnes}
            onPackageSelect={(id) => setFormData({ ...formData, drinkPackageId: id })}
            onSpiritToggle={(id) => {
              setSelectedSpirits(prev =>
                prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
              );
            }}
            onChampagneToggle={(id) => {
              setSelectedChampagnes(prev =>
                prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
              );
            }}
            onNext={() => goToStep('details')}
            onBack={() => goToStep('table')}
          />
        )}
        
        {currentStep === 'details' && (
          <CustomerDetailsForm
            formData={formData.customer}
            onChange={handleCustomerFieldChange}
            onNext={() => goToStep('payment')}
            onBack={() => goToStep('drinks')}
          />
        )}
        
        {currentStep === 'payment' && (
          <div className="bg-charcoal-light p-8 rounded-lg border-2 border-gold">
            <h2 className="text-3xl font-bebas text-gold mb-6">Booking Summary</h2>
            
            <div className="space-y-4 text-cream mb-6">
              <div className="border-b border-gold-dark pb-2">
                <p className="font-poiret">Date: {new Date(formData.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="font-poiret">Time: {formData.time}</p>
                <p className="font-poiret">Party Size: {formData.partySize} guests</p>
              </div>
              
              {selectedTable && (
                <div className="border-b border-gold-dark pb-2">
                  <p className="font-poiret">Table {selectedTable.tableNumber} - {selectedTable.description}</p>
                  <p className="text-sm text-cream-dark">{selectedTable.floor === 'UPSTAIRS' ? 'Upstairs' : 'Downstairs'}</p>
                </div>
              )}
              
              <div className="border-b border-gold-dark pb-2">
                <p className="font-poiret">{formData.customer.firstName} {formData.customer.lastName}</p>
                <p className="text-sm text-cream-dark">{formData.customer.email}</p>
                <p className="text-sm text-cream-dark">{formData.customer.phone}</p>
              </div>
              
              <div className="bg-gold bg-opacity-10 p-4 rounded">
                <p className="font-bebas text-2xl text-gold">Deposit Required: £50</p>
                <p className="text-xs text-cream-dark mt-1">This will be deducted from your final bill</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => goToStep('details')}
                className="flex-1 py-3 border border-gold text-cream font-bebas text-lg rounded hover:bg-gold hover:text-charcoal transition-all"
              >
                Back
              </button>
              <button
                onClick={handlePayment}
                className="flex-1 py-3 bg-gold text-charcoal font-bebas text-lg rounded hover:bg-gold-light transition-all"
              >
                Pay £50 Deposit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}