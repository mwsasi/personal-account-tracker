
import React, { useState, useEffect, useMemo } from 'react';
import { Bill, Transaction } from '../types';
import { storageService } from '../services/googleSheets';
import { Plus, CreditCard, Trash2, Calendar, DollarSign, X, TrendingUp, ReceiptText } from 'lucide-react';

interface BillManagerProps {
  t: any;
  formatCurrency: (amount: number) => string;
  transactions: Transaction[];
  onRefresh?: () => void;
}

const BillManager: React.FC<BillManagerProps> = ({ t, formatCurrency, transactions, onRefresh }) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newBill, setNewBill] = useState<Partial<Bill>>({ dueDay: new Date().getDate(), category: 'others' });
  const [isNameManuallyEdited, setIsNameManuallyEdited] = useState(false);

  useEffect(() => {
    storageService.fetchBills().then(setBills);
  }, []);

  const currentMonthLabel = useMemo(() => {
    return new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }, []);

  const monthlySpendingSummary = useMemo(() => {
    const currentMonthTxs = transactions.filter(tx => tx.month === currentMonthLabel);
    
    // Aggregating actual spending by category
    const actualByCategory: Record<string, number> = {
      groceries: 0, vegetables: 0, fishEgg: 0, chicken: 0,
      houseRent: 0, electricity: 0, water: 0, travel: 0, others: 0
    };

    currentMonthTxs.forEach(tx => {
      Object.keys(actualByCategory).forEach(cat => {
        actualByCategory[cat] += (tx as any)[cat] || 0;
      });
    });

    // Aggregating bill estimates by category
    const billEstimatesByCategory: Record<string, number> = {
      groceries: 0, vegetables: 0, fishEgg: 0, chicken: 0,
      houseRent: 0, electricity: 0, water: 0, travel: 0, others: 0
    };

    bills.forEach(bill => {
      if (billEstimatesByCategory[bill.category] !== undefined) {
        billEstimatesByCategory[bill.category] += bill.amount;
      } else {
        billEstimatesByCategory.others += bill.amount;
      }
    });

    return Object.keys(actualByCategory)
      .map(cat => ({
        category: cat,
        label: t[cat as keyof typeof t] || cat,
        actual: actualByCategory[cat],
        estimate: billEstimatesByCategory[cat]
      }))
      .filter(item => item.actual > 0 || item.estimate > 0)
      .sort((a, b) => b.actual - a.actual);
  }, [transactions, bills, currentMonthLabel, t]);

  const handleCategoryChange = (category: string) => {
    const updates: Partial<Bill> = { category };
    
    // Auto-fill name if not manually edited or if name is empty
    if (!isNameManuallyEdited || !newBill.name) {
      updates.name = t[category as keyof typeof t] || category;
    }
    
    setNewBill(prev => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    if (!newBill.name || !newBill.amount) return;
    const bill: Bill = {
      id: crypto.randomUUID(),
      name: newBill.name,
      amount: Number(newBill.amount),
      dueDay: Number(newBill.dueDay),
      category: newBill.category || 'others'
    };
    await storageService.saveBill(bill);
    setBills([...bills, bill]);
    setShowAdd(false);
    resetForm();
    if (onRefresh) onRefresh();
  };

  const resetForm = () => {
    setNewBill({ dueDay: new Date().getDate(), category: 'others' });
    setIsNameManuallyEdited(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t.confirmDelete)) {
      await storageService.deleteBill(id);
      setBills(bills.filter(b => b.id !== id));
      if (onRefresh) onRefresh();
    }
  };

  // Helper to format the current month's "due date" for the date picker input
  const getDummyDateString = (day: number = 1) => {
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth(), day);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
            <CreditCard className="w-6 h-6 text-indigo-700 dark:text-indigo-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{t.bills}</h2>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          {t.addBill}
        </button>
      </div>

      {/* Monthly Spending Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm overflow-hidden transition-colors">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Monthly Spending Summary</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{currentMonthLabel}</p>
          </div>
        </div>

        {monthlySpendingSummary.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {monthlySpendingSummary.map(item => (
              <div key={item.category} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700/30">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-black uppercase text-slate-400 tracking-wider">{item.label}</span>
                  {item.estimate > 0 && item.actual > item.estimate && (
                    <span className="text-[10px] font-black text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-full">Exceeded Bill</span>
                  )}
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100">{formatCurrency(item.actual)}</span>
                  {item.estimate > 0 && (
                    <span className="text-xs text-slate-400 font-bold">/ {formatCurrency(item.estimate)}</span>
                  )}
                </div>
                {item.estimate > 0 && (
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-700 ${item.actual > item.estimate ? 'bg-rose-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min((item.actual / item.estimate) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-slate-400 italic flex flex-col items-center gap-2">
            <ReceiptText className="w-8 h-8 opacity-20" />
            <p>No spending recorded for this month yet.</p>
          </div>
        )}
      </div>

      {/* Bill List Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <ReceiptText className="w-5 h-5 text-indigo-600" />
          Scheduled & Recurring
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bills.map(bill => (
            <div key={bill.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative group overflow-hidden transition-colors">
              <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500 opacity-20 group-hover:opacity-100 transition-all" />
              <div className="flex justify-between items-start mb-4 pl-2">
                <div>
                  <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg uppercase tracking-tight">{bill.name}</h3>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t[bill.category as keyof typeof t] || bill.category}</p>
                </div>
                <button 
                  onClick={() => handleDelete(bill.id)}
                  className="p-2 text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center gap-6 pl-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{t.date}</span>
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black">
                    <Calendar className="w-4 h-4" />
                    <span>Day {bill.dueDay} / Month</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Amount</span>
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-black">
                    <DollarSign className="w-4 h-4 text-slate-300 dark:text-slate-700" />
                    <span>{formatCurrency(bill.amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {bills.length === 0 && (
            <div className="col-span-full py-20 bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 gap-4 transition-colors">
               <CreditCard className="w-12 h-12 opacity-10" />
               <p className="font-bold italic">{t.noData}</p>
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl dark:shadow-none overflow-hidden animate-in zoom-in-95 duration-200 transition-colors">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.addBill}</h3>
              <button onClick={() => { setShowAdd(false); resetForm(); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400 dark:text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Category</label>
                <select 
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  value={newBill.category || 'others'}
                  onChange={e => handleCategoryChange(e.target.value)}
                >
                  <option value="groceries">{t.groceries}</option>
                  <option value="vegetables">{t.vegetables}</option>
                  <option value="fishEgg">{t.fishEgg}</option>
                  <option value="chicken">{t.chicken}</option>
                  <option value="houseRent">{t.houseRent}</option>
                  <option value="electricity">{t.electricity}</option>
                  <option value="water">{t.water}</option>
                  <option value="travel">{t.travel}</option>
                  <option value="others">{t.others}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Bill Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  value={newBill.name || ''}
                  onChange={e => {
                    setNewBill({...newBill, name: e.target.value});
                    setIsNameManuallyEdited(true);
                  }}
                  placeholder="e.g. Internet Bill"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Amount</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                    value={newBill.amount ?? ''}
                    onChange={e => setNewBill({...newBill, amount: e.target.value === '' ? undefined : Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Recurring Due Day</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm"
                      value={getDummyDateString(newBill.dueDay)}
                      onChange={e => {
                        const date = new Date(e.target.value);
                        if (!isNaN(date.getTime())) {
                          setNewBill({...newBill, dueDay: date.getDate()});
                        }
                      }}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-500">
                       <span className="text-xs font-black">Day {newBill.dueDay}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={handleSave}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 mt-4 transition-all"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillManager;
