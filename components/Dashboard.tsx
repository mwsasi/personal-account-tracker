
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, MonthlyBudget, Notification } from '../types';
import TransactionForm from './TransactionForm';
import StatsOverview from './StatsOverview';
import MonthlyCharts from './MonthlyCharts';
import HistoryTable from './HistoryTable';
import BudgetManager from './BudgetManager';
import BudgetPerformance from './BudgetPerformance';
import { 
  Plus, X, Calendar, BarChart3, ClipboardList, ArrowRight, Target, 
  AlertCircle, Clock, History, BellRing, TriangleAlert, Zap, 
  CheckCircle2, ArrowRightCircle, ShoppingBag, Leaf, Fish, 
  Drumstick, Home, Droplets, Car, PlusCircle, LayoutGrid
} from 'lucide-react';
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
  getStartingBalance: (date: string) => number;
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
  getStartingBalance
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
    const years = new Set<number>();
    
    // Always include the current year
    const currentYear = new Date().getFullYear();
    years.add(currentYear);
    
    // Extract years from transactions
    transactions.forEach(tx => {
      const d = new Date(tx.date);
      if (!isNaN(d.getTime())) {
        years.add(d.getFullYear());
      }
    });

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    // Generate all months for all involved years
    years.forEach(year => {
      monthNames.forEach(month => {
        monthsSet.add(`${month} ${year}`);
      });
    });

    // Sort descending chronologically
    return Array.from(monthsSet).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });
  }, [transactions]);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthName);

  // Sync selectedMonth if currentMonthName changes or component mounts
  useEffect(() => {
    if (!selectedMonth) {
      setSelectedMonth(currentMonthName);
    }
  }, [currentMonthName, selectedMonth]);

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

  // Category Totals for Quick-View
  const categorySummary = useMemo(() => {
    const categories = [
      { key: 'groceries', label: t.groceries, icon: ShoppingBag, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
      { key: 'vegetables', label: t.vegetables, icon: Leaf, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
      { key: 'fishEgg', label: t.fishEgg, icon: Fish, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
      { key: 'chicken', label: t.chicken, icon: Drumstick, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
      { key: 'houseRent', label: t.houseRent, icon: Home, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
      { key: 'electricity', label: t.electricity, icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
      { key: 'water', label: t.water, icon: Droplets, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
      { key: 'travel', label: t.travel, icon: Car, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
      { key: 'others', label: t.others, icon: PlusCircle, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800/50' },
    ];

    return categories.map(cat => {
      const total = currentMonthTransactions.reduce((sum, tx) => sum + (Number((tx as any)[cat.key]) || 0), 0);
      const limit = (activeBudget.limits as any)[cat.key] || 0;
      return { ...cat, total, limit };
    });
  }, [currentMonthTransactions, activeBudget, t]);

  // Real-time Budget Health Calculation
  const budgetHealth = useMemo(() => {
    const issues = categorySummary
      .filter(cat => cat.limit > 0 && (cat.total / cat.limit) * 100 >= 80)
      .map(cat => ({
        category: cat.key,
        label: cat.label,
        spent: cat.total,
        limit: cat.limit,
        percentage: (cat.total / cat.limit) * 100,
        status: (cat.total / cat.limit) * 100 >= 100 ? 'over' : 'warning'
      }));
    
    return issues.sort((a, b) => b.percentage - a.percentage);
  }, [categorySummary]);

  const filteredStats = useMemo(() => {
    const totalSpent = currentMonthTransactions.reduce((sum, tx) => sum + (Number(tx.totalExpenses) || 0), 0);
    const sorted = [...currentMonthTransactions].sort((a, b) => a.date.localeCompare(b.date) || a.timestamp.localeCompare(b.timestamp));
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

  const activeAlerts = useMemo(() => {
    return notifications
      .filter(n => (n.type === 'bill' || n.type === 'budget') && !n.read)
      .sort((a, b) => {
        const priorityMap = { high: 0, medium: 1, low: 2 };
        return (priorityMap[a.priority] || 3) - (priorityMap[b.priority] || 3);
      })
      .slice(0, 3);
  }, [notifications]);

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

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 md:p-4 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm no-print transition-colors">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-grow min-w-0">
            <h2 className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-0.5 truncate">{t.selectMonth}</h2>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-bold text-base text-slate-800 dark:text-slate-100 outline-none cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors w-full appearance-none"
            >
              {availableMonths.map(m => (
                <option key={m} value={m} className="bg-white dark:bg-slate-900 text-sm">{m}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setShowBudgetForm(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2.5 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all border border-indigo-100 dark:border-indigo-900 shadow-sm active:scale-95"
          >
            <Target className="w-4 h-4" />
            <span>{t.manageBudget}</span>
          </button>
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex-1 sm:flex-none bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addRecord}</span>
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <>
          {/* Enhanced Budget Watch Banner */}
          {budgetHealth.length > 0 && (
            <div className="animate-in slide-in-from-top-4 duration-500">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden transition-colors">
                <div className={`absolute top-0 left-0 bottom-0 w-1 ${budgetHealth.some(h => h.status === 'over') ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${budgetHealth.some(h => h.status === 'over') ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600'}`}>
                      {budgetHealth.some(h => h.status === 'over') ? <TriangleAlert className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Budget Attention</h3>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {budgetHealth.slice(0, 2).map((h, i) => (
                          <span key={i} className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${h.status === 'over' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/40' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/40'}`}>
                            {h.label}: {h.percentage.toFixed(0)}%
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab?.('budget')}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-lg shrink-0 w-fit"
                  >
                    Analysis
                    <ArrowRightCircle className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <StatsOverview t={t} stats={filteredStats} formatCurrency={formatCurrency} />

          {/* Enhanced: Category Quick-View Summary with Budget Values */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">{t.summary}</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {categorySummary.map((cat) => (
                <div key={cat.key} className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-2.5 transition-all hover:shadow-md group">
                  <div className={`p-1.5 rounded-lg transition-colors ${cat.bg} shrink-0`}>
                    <cat.icon className={`w-4 h-4 ${cat.color}`} />
                  </div>
                  <div className="min-w-0 flex-grow">
                    <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate mb-0.5">{cat.label}</p>
                    <div className="flex flex-col">
                      <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{formatCurrency(cat.total)}</p>
                      {cat.limit > 0 && (
                        <p className="text-[7px] font-bold text-slate-400 dark:text-slate-500 truncate">
                          {t.budget}: {formatCurrency(cat.limit)}
                        </p>
                      )}
                    </div>
                    {cat.limit > 0 && (
                      <div className="mt-1.5 w-full h-0.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-700 ${(cat.total / cat.limit) >= 1 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                          style={{ width: `${Math.min((cat.total / cat.limit) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t.recentTransactions}</h2>
              </div>
              <button 
                onClick={() => setActiveTab?.('history')}
                className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                {t.viewAll}
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[8px] uppercase font-black tracking-widest border-b border-slate-100 dark:border-slate-800">
                    <th className="px-4 py-3">{t.date}</th>
                    <th className="px-4 py-3">{t.dailyCash}</th>
                    <th className="px-4 py-3">{t.totalExpenses}</th>
                    <th className="px-4 py-3 bg-indigo-50/30 dark:bg-indigo-900/10 text-indigo-700 dark:text-indigo-400">{t.totalBalance}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentTransactions.map((tx) => (
                    <tr key={tx.id || tx.timestamp} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors text-xs">
                      <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">{tx.date.split('-').reverse().join('/')}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(Number(tx.dailyCash))}</td>
                      <td className="px-4 py-3 font-bold text-rose-500 dark:text-rose-400">{formatCurrency(Number(tx.totalExpenses))}</td>
                      <td className="px-4 py-3 font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-900/5">{formatCurrency(Number(tx.totalBalance))}</td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-slate-400 dark:text-slate-600 font-medium italic text-xs">{t.noData}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-indigo-700 dark:text-indigo-400" />
                </div>
                <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">{t.charts}</h2>
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 transition-colors">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between no-print">
            <div className="flex items-center gap-2">
               <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
               <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t.history}</h2>
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
            budgets={budgets}
          />
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm no-print">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl md:rounded-3xl shadow-2xl dark:shadow-none overflow-hidden max-h-[90vh] flex flex-col scale-in-center transition-colors">
            <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {editingTransaction ? t.edit : t.addRecord}
              </h3>
              <button 
                onClick={() => { setShowAddForm(false); setEditingTransaction(null); }}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              </button>
            </div>
            <div className="p-4 md:p-6 overflow-y-auto">
              <TransactionForm 
                t={t} 
                initialData={editingTransaction}
                getStartingBalance={getStartingBalance}
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm no-print">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl md:rounded-3xl shadow-2xl dark:shadow-none overflow-hidden flex flex-col scale-in-center transition-colors max-h-[95vh]">
            <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t.manageBudget}</h3>
              <button 
                onClick={() => setShowBudgetForm(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              </button>
            </div>
            <div className="p-3 md:p-6 overflow-y-auto">
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
