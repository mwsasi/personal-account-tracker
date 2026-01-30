
export interface Transaction {
  id?: string;
  date: string;
  month: string;
  groceries: number;
  vegetables: number;
  fishEgg: number;
  chicken: number;
  houseRent: number;
  electricity: number;
  water: number;
  travel: number;
  fuel: number;
  bikeRepair: number;
  parcel: number;
  compoundInvestment: number;
  others: number;
  dailyCash: number;
  broughtForward: number;
  totalExpenses: number;
  totalBalance: number;
  timestamp: string;
}

// Fix: Language should be a type alias, not an interface
export type Language = 'en' | 'si';

export interface CurrencySettings {
  symbol: string;
  position: 'before' | 'after';
}

export interface MonthlyBudget {
  month: string;
  limits: {
    groceries: number;
    vegetables: number;
    fishEgg: number;
    chicken: number;
    houseRent: number;
    electricity: number;
    water: number;
    travel: number;
    fuel: number;
    bikeRepair: number;
    parcel: number;
    compoundInvestment: number;
    others: number;
  };
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDay: number; // 1-31
  category: string;
  lastPaidMonth?: string; // tracks the last month this bill was paid (e.g., "March 2025")
}

export interface Notification {
  id: string;
  type: 'budget' | 'bill' | 'pattern';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}
