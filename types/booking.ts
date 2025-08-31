export interface Table {
  id: string;
  tableNumber: number;
  floor: 'UPSTAIRS' | 'DOWNSTAIRS';
  capacityMin: number;
  capacityMax: number;
  description: string;
  features: string[];
  isVip: boolean;
  canCombineWith: number[];
}

export interface BookingFormData {
  date: string;
  time: string;
  partySize: number;
  tableId?: string;
  drinkPackageId?: string;
  customOrder?: {
    spirits: string[];
    champagnes: string[];
  };
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth?: string;
    marketingConsent: boolean;
  };
  specialRequests?: string;
}

export interface DrinkPackage {
  id: string;
  name: string;
  price: number;
  description: string;
  includes: any;
  isActive: boolean;
}

export interface Spirit {
  id: string;
  name: string;
  category: string;
  price: number;
  isAvailable: boolean;
}

export interface Champagne {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

export type BookingStep = 'date' | 'table' | 'drinks' | 'details' | 'payment';