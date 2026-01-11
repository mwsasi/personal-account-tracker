
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, MonthlyBudget, Notification } from '../types';
import TransactionForm from './TransactionForm';
import StatsOverview from './StatsOverview';
import MonthlyCharts from './MonthlyCharts';
import HistoryTable from './HistoryTable';
import BudgetManager from './BudgetManager';
import BudgetPerformance from './BudgetPerformance';
import { Plus, X, Calendar, BarChart3, ClipboardList, ArrowRight, Target, AlertCircle, Clock, History } from 'lucide-react';
import { storageService } from '../services/googleSheets';

interface DashboardProps {
  activeTab: 'dashboard' | 'analytics' | 'history' | 'budget' | 'bills' | 'settings';
  setActiveTab?: (tab: 'dashboard' | 'analytics' | 'history' | 'budget' | 'bills' | 'settings') => void;
  t: any;
  transactions: Transaction[];
  onAdd: (data: Transaction) => void;
  onUpdate: (id: string, data: Transaction) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  formatCurrency: (amount: number) => string;
  notifications?: Notification[];
  latestBalance?: number;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  activeTab, 
  setActiveTab,
  t, 
  transactions, 
  onAdd, 
  onUpdate,
  onDelete,
  onRefresh,
  isLoading,
  formatCurrency,
  notifications = [],
  latestBalance = 0
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);

  useEffect(() => {
    const loadBudgets = async () => {
      const data = await storageService.fetchBudgets();
      setBudgets(data);
    };
    loadBudgets();
  }, [transactions]);

  const currentMonthName = useMemo(() => {
    return new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }, []);

  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    transactions.forEach(tx => {
      if (tx.month) monthsSet.add(tx.month.trim());
    });
    monthsSet.add(currentMonthName);
    return Array.from(monthsSet).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateB.getTime() - dateA.getTime();
    });
  }, [transactions, currentMonthName]);

  const [selectedMonth, setSelectedMonth] = useState<string>(availableMonths[0] || currentMonthName);

  const activeBudget = useMemo(() => {
    return budgets.find(b => b.month === selectedMonth) || {
      month: selectedMonth,
      limits: { groceries: 0, vegetables: 0, fishEgg: 0, chicken: 0, houseRent: 0, electricity: 0, water: 0, travel: 0, others: 0 }
    };
  }, [budgets, selectedMonth]);

  const currentMonthTransactions = useMemo(() => {
    return transactions
      .filter(tx => tx.month?.trim() === selectedMonth)
      .sort((a, b) => a.date.localeCompare(b.date) || a.timestamp.localeCompare(b.timestamp));
  }, [transactions, selectedMonth]);

  const filteredStats = useMemo(() => {
    const sorted = [...currentMonthTransactions].sort((a, b) => a.date.localeCompare(b.date) || a.timestamp.localeCompare(b.timestamp));
    const totalSpent = currentMonthTransactions.reduce((sum, tx) => sum + (Number(tx.totalExpenses) || 0), 0);
    const firstTx = sorted[0];
    const initialBF = firstTx ? (Number(firstTx.broughtForward) || 0) : 0;
    const totalDailyCash = currentMonthTransactions.reduce((sum, tx) => sum + (Number(tx.dailyCash) || 0), 0);
    const totalAvailableFunds = initialBF + totalDailyCash;
    const currentNetBalance = totalAvailableFunds - totalSpent;
    return { totalSpent, totalReceived: totalAvailableFunds, lastBalance: currentNetBalance };
  }, [currentMonthTransactions]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date) || b.timestamp.localeCompare(a.timestamp))
      .slice(0, 5);
  }, [transactions]);

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setShowAddForm(true);
  };

  const handleSaveBudget = async (limits: MonthlyBudget['limits']) => {
    await storageService.saveBudget(selectedMonth, limits);
    const updated = await storageService.fetchBudgets();
    setBudgets(updated);
    setShowBudgetForm(false);
  };

  const upcomingBillAlerts = useMemo(() => {
    return notifications
      .filter(n => n.type === 'bill' && !n.read)
      .sort((a, b) => {
        const priorityMap = { high: 0, medium: 1, low: 2 };
        return (priorityMap[a.priority] || 3) - (priorityMap[b.priority] || 3);
      })
      .slice(0, 3);
  }, [notifications]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm no-print transition-colors">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
            <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-grow">
            <h2 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">{t.selectMonth}</h2>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-bold text-lg text-slate-800 dark:text-slate-100 outline-none cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {availableMonths.map(m => (
                <option key={m} value={m} className="bg-white dark:bg-slate-900">{m}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setShowBudgetForm(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 rounded-2xl font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all border border-indigo-100 dark:border-indigo-900 shadow-sm active:scale-95"
          >
            <Target className="w-5 h-5" />
            <span className="sm:inline">{t.manageBudget}</span>
          </button>
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex-1 sm:flex-none bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span className="sm:inline">{t.addRecord}</span>
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <>
          <StatsOverview t={t} stats={filteredStats} formatCurrency={formatCurrency} />

          <div className="mt-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClipboardList className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.recentTransactions}</h2>
              </div>
              <button 
                onClick={() => setActiveTab?.('history')}
                className="flex items-center gap-1 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                {t.viewAll}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-4">{t.date}</th>
                    <th className="px-6 py-4">{t.broughtForward}</th>
                    <th className="px-6 py-4">{t.dailyCash}</th>
                    <th className="px-6 py-4">{t.totalExpenses}</th>
                    <th className="px-6 py-4 bg-indigo-50/30 dark:bg-indigo-900/10 text-indigo-700 dark:text-indigo-400">{t.totalBalance}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentTransactions.map((tx) => (
                    <tr key={tx.id || tx.timestamp} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{tx.date.split('-').reverse().join('/')}</td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-400 dark:text-slate-500">{formatCurrency(Number(tx.broughtForward))}</td>
                      <td className="px-6 py-4 text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(Number(tx.dailyCash))}</td>
                      <td className="px-6 py-4 text-sm font-bold text-rose-500 dark:text-rose-400">{formatCurrency(Number(tx.totalExpenses))}</td>
                      <td className="px-6 py-4 text-sm font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-900/5">{formatCurrency(Number(tx.totalBalance))}</td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 dark:text-slate-600 font-medium italic">{t.noData}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-indigo-700 dark:text-indigo-400" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{t.charts} - {selectedMonth}</h2>
              </div>
            </div>
            <MonthlyCharts t={t} transactions={currentMonthTransactions} />
          </div>
        </div>
      )}

      {activeTab === 'budget' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <BudgetPerformance 
            t={t} 
            transactions={transactions} 
            budgets={budgets} 
            formatCurrency={formatCurrency} 
          />
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 transition-colors">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between no-print">
            <div className="flex items-center gap-3">
               <History className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
               <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.history} ({selectedMonth})</h2>
            </div>
          </div>
          <HistoryTable 
            t={t} 
            transactions={currentMonthTransactions} 
            allTransactions={transactions}
            onEdit={handleEdit} 
            onDelete={onDelete} 
            isLoading={isLoading} 
            formatCurrency={formatCurrency}
          />
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm no-print">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl dark:shadow-none overflow-hidden max-h-[90vh] flex flex-col scale-in-center transition-colors">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {editingTransaction ? t.edit : t.addRecord}
              </h3>
              <button 
                onClick={() => { setShowAddForm(false); setEditingTransaction(null); }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-400 dark:text-slate-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <TransactionForm 
                t={t} 
                initialData={editingTransaction}
                latestBalance={latestBalance}
                formatCurrency={formatCurrency}
                onSubmit={(data) => {
                  if (editingTransaction?.id) {
                    onUpdate(editingTransaction.id, data);
                  } else {
                    onAdd(data);
                  }
                  setShowAddForm(false);
                  setEditingTransaction(null);
                }} 
              />
            </div>
          </div>
        </div>
      )}

      {showBudgetForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm no-print">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl dark:shadow-none overflow-hidden flex flex-col scale-in-center transition-colors max-h-[95vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.manageBudget}</h3>
              <button 
                onClick={() => setShowBudgetForm(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-400 dark:text-slate-500" />
              </button>
            </div>
            <div className="p-4 md:p-6 overflow-y-auto">
              <BudgetManager 
                t={t} 
                month={selectedMonth} 
                initialLimits={activeBudget.limits} 
                onSubmit={handleSaveBudget} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
