// Types for the booking system that match database schema
export interface Booking {
  id: string;
  bookingReference: string;
  reference_number: string; // alias for email template
  tableId: string;
  table_name: string; // from table relation
  customerId: string;
  name: string; // customer full name
  email: string; // customer email
  phone?: string; // customer phone
  bookingDate: Date | string;
  date: string; // formatted date for email
  bookingTime: string;
  time: string; // alias for email template
  partySize: number;
  party_size: number; // alias for email template
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  depositAmount: number;
  depositPaid: boolean;
  stripe_payment_intent_id?: string;
  drinkPackageId?: string;
  drinks_package?: string; // package name for email
  specialRequests?: string;
  custom_spirits?: string; // formatted spirits list
  custom_champagnes?: string; // formatted champagnes list
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: Date | string;
  marketingConsent: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Table {
  id: string;
  tableNumber: number;
  name: string;
  floor: 'UPSTAIRS' | 'DOWNSTAIRS';
  capacityMin: number;
  capacityMax: number;
  description: string;
  features: string[];
  isVip: boolean;
  canCombineWith: number[];
}

export interface DrinkPackage {
  id: string;
  name: string;
  price: number;
  description: string;
  includes: string[];
  isActive: boolean;
}

export interface Spirit {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  isAvailable: boolean;
}

export interface Champagne {
  id: string;
  name: string;
  brand: string;
  price: number;
  isAvailable: boolean;
}