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
  isActive?: boolean;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
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
  brand: string;
  category: string;
  price: number | string | { toNumber: () => number };
  isAvailable: boolean;
  isActive?: boolean;
}

export interface Champagne {
  id: string;
  name: string;
  brand: string;
  price: number | string | { toNumber: () => number };
  isAvailable: boolean;
  isActive?: boolean;
}

export type BookingStep = 'date' | 'table' | 'drinks' | 'details' | 'payment';