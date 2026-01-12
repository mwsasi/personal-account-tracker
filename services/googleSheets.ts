
import { Transaction, MonthlyBudget, Bill } from '../types';

const STORAGE_KEY = 'finance_tracker_v3_local_data';
const BUDGET_KEY = 'finance_tracker_v3_budgets';
const BILLS_KEY = 'finance_tracker_v3_bills';

export const storageService = {
  async fetchTransactions(): Promise<Transaction[]> {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  async addTransaction(transaction: Transaction): Promise<boolean> {
    const data = await this.fetchTransactions();
    const newTx = { ...transaction, id: crypto.randomUUID() };
    data.push(newTx);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  },

  async updateTransaction(id: string, transaction: Transaction): Promise<boolean> {
    const data = await this.fetchTransactions();
    const index = data.findIndex(tx => tx.id === id);
    if (index !== -1) {
      data[index] = { ...transaction, id };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    }
    return false;
  },

  async saveAllTransactions(transactions: Transaction[]): Promise<boolean> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    return true;
  },

  async deleteTransaction(id: string): Promise<boolean> {
    const data = await this.fetchTransactions();
    const filtered = data.filter(tx => tx.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
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
