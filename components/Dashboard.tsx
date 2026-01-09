
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, MonthlyBudget, Notification } from '../types';
import TransactionForm from './TransactionForm';
import StatsOverview from './StatsOverview';
import MonthlyCharts from './MonthlyCharts';
import HistoryTable from './HistoryTable';
import BudgetManager from './BudgetManager';
import BudgetPerformance from './BudgetPerformance';
import { Plus, X, Calendar, BarChart3, ClipboardList, ArrowRight, Target, AlertCircle, Clock } from 'lucide-react';
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
  notifications = []
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
    return transactions.filter(tx => tx.month?.trim() === selectedMonth).sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions, selectedMonth]);

  const categorySpending = useMemo(() => {
    const totals = { groceries: 0, vegetables: 0, fishEgg: 0, chicken: 0, houseRent: 0, electricity: 0, water: 0, travel: 0, others: 0 };
    currentMonthTransactions.forEach(tx => {
      totals.groceries += Number(tx.groceries) || 0;
      totals.vegetables += Number(tx.vegetables) || 0;
      totals.fishEgg += Number(tx.fishEgg) || 0;
      totals.chicken += Number(tx.chicken) || 0;
      totals.houseRent += Number(tx.houseRent) || 0;
      totals.electricity += Number(tx.electricity) || 0;
      totals.water += Number(tx.water) || 0;
      totals.travel += Number(tx.travel) || 0;
      totals.others += Number(tx.others) || 0;
    });
    return totals;
  }, [currentMonthTransactions]);

  const filteredStats = useMemo(() => {
    const sorted = [...currentMonthTransactions].sort((a, b) => a.date.localeCompare(b.date));
    
    // 1. Total Expenses: Sum of all category fields across all transactions of the month
    const totalSpent = currentMonthTransactions.reduce((sum, tx) => {
      const txExp = Number(tx.groceries || 0) + Number(tx.vegetables || 0) + Number(tx.fishEgg || 0) + 
                    Number(tx.chicken || 0) + Number(tx.houseRent || 0) + Number(tx.electricity || 0) + 
                    Number(tx.water || 0) + Number(tx.travel || 0) + Number(tx.others || 0);
      return sum + txExp;
    }, 0);
    
    // 2. Total Cash Received + Brought Forward
    const firstTx = sorted[0];
    const initialBF = firstTx ? (Number(firstTx.broughtForward) || 0) : 0;
    const totalDailyCash = currentMonthTransactions.reduce((sum, tx) => sum + (Number(tx.dailyCash) || 0), 0);
    const totalAvailableFunds = initialBF + totalDailyCash;
    
    // 3. Net Balance = (Initial BF + Sum Daily Cash) - Total Monthly Expenses
    const currentNetBalance = totalAvailableFunds - totalSpent;
    
    return { totalSpent, totalReceived: totalAvailableFunds, lastBalance: currentNetBalance };
  }, [currentMonthTransactions]);

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
          {upcomingBillAlerts.length > 0 && (
            <div className="animate-in slide-in-from-top-4 duration-500">
              <div className="bg-indigo-600 text-white p-4 rounded-3xl shadow-xl shadow-indigo-200 dark:shadow-none flex flex-col md:flex-row items-center justify-between gap-4 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Clock className="w-24 h-24 rotate-12" />
                </div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="p-3 bg-white/20 rounded-2xl">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg leading-tight uppercase tracking-tight">{t.dueSoon}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {upcomingBillAlerts.map((n, i) => (
                        <span key={n.id} className="text-sm font-medium flex items-center gap-1.5 text-white/90">
                          <span className={`w-2 h-2 rounded-full ${n.priority === 'high' ? 'bg-rose-400 animate-pulse' : (n.priority === 'medium' ? 'bg-amber-400' : 'bg-sky-400')}`} />
                          {n.title}: {n.message}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button 
                   onClick={() => setActiveTab?.('bills')}
                   className="relative z-10 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all backdrop-blur-sm"
                >
                  Manage Bills
                </button>
              </div>
            </div>
          )}

          <StatsOverview t={t} stats={filteredStats} formatCurrency={formatCurrency} />

          <div className="mt-8 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600 dark:text-emerald-400">
                    <Target className="w-6 h-6" />
                 </div>
                 <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.budgetStatus}</h2>
               </div>
               <div className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">{selectedMonth}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {[
                { key: 'groceries', label: t.groceries },
                { key: 'vegetables', label: t.vegetables },
                { key: 'fishEgg', label: t.fishEgg },
                { key: 'chicken', label: t.chicken },
                { key: 'houseRent', label: t.houseRent },
                { key: 'electricity', label: t.electricity },
                { key: 'water', label: t.water },
                { key: 'travel', label: t.travel },
                { key: 'others', label: t.others },
              ].map(({ key, label }) => {
                const limit = (activeBudget.limits as any)[key] || 0;
                const spent = (categorySpending as any)[key] || 0;
                const percent = limit > 0 ? (spent / limit) * 100 : 0;
                const remaining = limit - spent;
                
                let barColor = "bg-indigo-500";
                if (percent >= 100) barColor = "bg-rose-500";
                else if (percent >= 80) barColor = "bg-amber-500";

                return (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between items-end gap-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{label}</span>
                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-black uppercase tracking-tighter ${percent > 100 ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'}`}>
                          {formatCurrency(spent)} / {limit > 0 ? formatCurrency(limit) : '---'}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden transition-colors">
                      <div 
                        className={`h-full transition-all duration-500 ${barColor}`} 
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">
                       {limit > 0 ? (
                         remaining >= 0 ? (
                           <span className="text-emerald-500 dark:text-emerald-400 truncate">{t.remaining}: {formatCurrency(remaining)}</span>
                         ) : (
                           <span className="text-rose-500 flex items-center gap-1 truncate">
                             <AlertCircle className="w-3 h-3" />
                             {t.overspent}: {formatCurrency(Math.abs(remaining))}
                           </span>
                         )
                       ) : (
                         <span className="text-slate-300 dark:text-slate-700">Not set</span>
                       )}
                       <span className="text-slate-400 dark:text-slate-500 ml-2">{Math.round(percent)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
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
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-4">{t.date}</th>
                    <th className="px-6 py-4">{t.month}</th>
                    <th className="px-6 py-4">{t.dailyCash}</th>
                    <th className="px-6 py-4">{t.totalExpenses}</th>
                    <th className="px-6 py-4 bg-indigo-50/30 dark:bg-indigo-900/10 text-indigo-700 dark:text-indigo-400">{t.totalBalance}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {transactions.slice().reverse().slice(0, 5).map((tx) => (
                    <tr key={tx.id || tx.timestamp} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{tx.date.split('-').reverse().join('/')}</td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-400 dark:text-slate-500">{tx.month}</td>
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.history} ({selectedMonth})</h2>
          </div>
          <HistoryTable 
            t={t} 
            transactions={transactions.filter(tx => tx.month?.trim() === selectedMonth)} 
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
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
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
