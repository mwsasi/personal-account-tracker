
import { Transaction, MonthlyBudget, Bill } from '../types';

// Replace this with your actual Deployment URL if it changes
const API_URL = 'https://script.google.com/macros/s/AKfycbxTM7V5p8FiW10QC0K550CTJ6V8tSKretm--imdvbf9ChGpuTq3h4ljvP8bBSUOTfye0g/exec'.trim();
const LOCAL_STORAGE_KEY = 'finance_tracker_v3_local_data';
const BUDGET_KEY = 'finance_tracker_v3_budgets';
const BILLS_KEY = 'finance_tracker_v3_bills';

export const storageService = {
  async fetchTransactions(): Promise<Transaction[]> {
    try {
      /**
       * For GET requests to GAS:
       * 1. Use the simplest fetch call possible to ensure a "Simple Request" (no preflight).
       * 2. GAS always redirects (302), and modern browsers follow this automatically.
       */
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data && Array.isArray(data.records)) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.records));
        return data.records;
      } else if (data && data.status === 'error') {
        throw new Error(data.message || 'Unknown backend error');
      }
    } catch (error) {
      console.error("Connection Diagnostic:", {
        url: API_URL,
        error: error instanceof Error ? error.message : String(error),
        hint: "Check if the Google Script is deployed as 'Web App', 'Execute as: Me', and 'Who has access: Anyone'."
      });
    }
    
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    return localData ? JSON.parse(localData) : [];
  },

  async saveAllTransactions(transactions: Transaction[]): Promise<boolean> {
    try {
      const payload = {
        action: 'sync',
        records: transactions
      };
      
      /**
       * IMPORTANT: Google Apps Script does NOT support OPTIONS (preflight) requests.
       * We must use:
       * 1. mode: 'no-cors' (bypass preflight)
       * 2. Content-Type: 'text/plain' (Simple header)
       */
      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors', 
        cache: 'no-cache',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload)
      });
      
      // Since 'no-cors' prevents us from reading the response, 
      // we assume success if no network error occurred.
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(transactions));
      return true;
    } catch (error) {
      console.error("Sync failure:", error);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(transactions));
      return false;
    }
  },

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) return { success: false, message: `Server error: ${response.status}` };
      const data = await response.json();
      return { success: true, message: `Connected! Found ${data.records?.length || 0} records.` };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : "Failed to connect" };
    }
  },

  async fetchBudgets(): Promise<MonthlyBudget[]> {
    const data = localStorage.getItem(BUDGET_KEY);
    return data ? JSON.parse(data) : [];
  },

  async saveBudget(month: string, limits: MonthlyBudget['limits']): Promise<boolean> {
    const budgets = await this.fetchBudgets();
    const index = budgets.findIndex(b => b.month === month);
    if (index !== -1) {
      budgets[index].limits = limits;
    } else {
      budgets.push({ month, limits });
    }
    localStorage.setItem(BUDGET_KEY, JSON.stringify(budgets));
    return true;
  },

  async fetchBills(): Promise<Bill[]> {
    const data = localStorage.getItem(BILLS_KEY);
    return data ? JSON.parse(data) : [];
  },

  async saveBill(bill: Bill): Promise<boolean> {
    const bills = await this.fetchBills();
    const index = bills.findIndex(b => b.id === bill.id);
    if (index !== -1) {
      bills[index] = bill;
    } else {
      bills.push(bill);
    }
    localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
    return true;
  },

  async deleteBill(id: string): Promise<boolean> {
    const bills = await this.fetchBills();
    const filtered = bills.filter(b => b.id !== id);
    localStorage.setItem(BILLS_KEY, JSON.stringify(filtered));
    return true;
  }
};
