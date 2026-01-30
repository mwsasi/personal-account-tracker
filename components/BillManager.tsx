
import React, { useState, useEffect, useMemo } from 'react';
import { Bill, Transaction } from '../types';
import { storageService } from '../services/googleSheets';
import { Plus, CreditCard, Trash2, Calendar, DollarSign, X, TrendingUp, ReceiptText, CheckCircle2, Search, Filter, ArrowUpDown, AlertCircle } from 'lucide-react';

interface BillManagerProps {
  t: any;
  formatCurrency: (amount: number) => string;
  transactions: Transaction[];
  onRefresh?: () => void;
}

const CATEGORY_COLORS: Record<string, { dot: string; bg: string; text: string }> = {
  groceries: { dot: 'bg-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400' },
  vegetables: { dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
  fishEgg: { dot: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
  chicken: { dot: 'bg-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400' },
  houseRent: { dot: 'bg-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-600 dark:text-rose-400' },
  electricity: { dot: 'bg-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-600 dark:text-yellow-400' },
  water: { dot: 'bg-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-600 dark:text-cyan-400' },
  travel: { dot: 'bg-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
  compoundInvestment: { dot: 'bg-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-600 dark:text-teal-400' },
  others: { dot: 'bg-slate-500', bg: 'bg-slate-50 dark:bg-slate-800/50', text: 'text-slate-600 dark:text-slate-400' },
};

const BillManager: React.FC<BillManagerProps> = ({ t, formatCurrency, transactions, onRefresh }) => {
  const [bills, setBills] = useState<Bill[]>([]);
  // Fix: Added missing isLoading state to fix reference error in rendering
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newBill, setNewBill] = useState<Partial<Bill>>({ dueDay: new Date().getDate(), category: 'others' });
  const [isNameManuallyEdited, setIsNameManuallyEdited] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'day' | 'name' | 'amount'>('day');

  // Fix: Updated useEffect to correctly handle the loading state during initial data fetch
  useEffect(() => {
    setIsLoading(true);
    storageService.fetchBills()
      .then(setBills)
      .catch(e => console.error("Bills fetch error", e))
      .finally(() => setIsLoading(false));
  }, []);

  const currentMonthLabel = useMemo(() => {
    return new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }, []);

  const filteredBills = useMemo(() => {
    return bills
      .filter(bill => {
        const name = bill.name || "";
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || bill.category === categoryFilter;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'day') return (a.dueDay || 0) - (b.dueDay || 0);
        if (sortBy === 'amount') return (b.amount || 0) - (a.amount || 0);
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [bills, searchTerm, categoryFilter, sortBy]);

  const handleCategoryChange = (category: string) => {
    const updates: Partial<Bill> = { category };
    if (!isNameManuallyEdited || !newBill.name) {
      updates.name = t[category as keyof typeof t] || category;
    }
    setNewBill(prev => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    setValidationError(null);
    if (!newBill.name?.trim()) {
      setValidationError("Bill name is required");
      return;
    }
    if (newBill.amount === undefined || newBill.amount === null || Number(newBill.amount) <= 0) {
      setValidationError("Please enter a valid amount greater than 0");
      return;
    }
    if (newBill.dueDay === undefined || newBill.dueDay === null || Number(newBill.dueDay) < 1 || Number(newBill.dueDay) > 31) {
      setValidationError("Please enter a valid due day between 1 and 31");
      return;
    }

    try {
      const bill: Bill = {
        id: crypto.randomUUID(),
        name: newBill.name.trim(),
        amount: Number(newBill.amount),
        dueDay: Number(newBill.dueDay),
        category: newBill.category || 'others'
      };
      
      const success = await storageService.saveBill(bill);
      if (success) {
        setBills(prev => [...prev, bill]);
        setShowAdd(false);
        resetForm();
        if (onRefresh) onRefresh();
      } else {
        throw new Error("Storage failure");
      }
    } catch (e) {
      setValidationError("An error occurred while saving. Please try again.");
    }
  };

  const resetForm = () => {
    setNewBill({ dueDay: new Date().getDate(), category: 'others' });
    setIsNameManuallyEdited(false);
    setValidationError(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t.confirmDelete)) {
      try {
        const success = await storageService.deleteBill(id);
        if (success) {
          setBills(prev => prev.filter(b => b.id !== id));
          if (onRefresh) onRefresh();
        }
      } catch (e) {
        alert("Delete failed.");
      }
    }
  };

  const handlePayBill = async (bill: Bill) => {
    try {
      const updatedBill: Bill = { ...bill, lastPaidMonth: currentMonthLabel };
      const success = await storageService.saveBill(updatedBill);
      if (success) {
        setBills(prev => prev.map(b => b.id === bill.id ? updatedBill : b));
        if (onRefresh) onRefresh();
      }
    } catch (e) {
      alert("Payment recording failed.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
            <CreditCard className="w-6 h-6 text-indigo-700 dark:text-indigo-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{t.bills}</h2>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          {t.addBill}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 no-print">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" placeholder={t.search} 
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-sm shadow-sm"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold text-xs outline-none"
            value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {Object.keys(CATEGORY_COLORS).map(cat => (
              <option key={cat} value={cat}>{t[cat as keyof typeof t] || cat}</option>
            ))}
          </select>
          <select 
            className="px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold text-xs outline-none"
            value={sortBy} onChange={e => setSortBy(e.target.value as any)}
          >
            <option value="day">Day</option>
            <option value="name">Name</option>
            <option value="amount">Amount</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBills.map(bill => {
          const isPaidThisMonth = bill.lastPaidMonth === currentMonthLabel;
          const style = CATEGORY_COLORS[bill.category] || CATEGORY_COLORS.others;
          return (
            <div 
              key={bill.id} 
              className={`bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative group overflow-hidden transition-all duration-300 ${isPaidThisMonth ? 'opacity-60 grayscale-[0.4]' : ''}`}
            >
              <div className={`absolute top-0 left-0 w-1.5 h-full transition-all ${isPaidThisMonth ? 'bg-emerald-500' : style.dot}`} />
              <div className="flex justify-between items-start mb-4 pl-2">
                <div>
                  <h3 className={`font-black text-slate-800 dark:text-slate-100 text-lg uppercase tracking-tight ${isPaidThisMonth ? 'line-through' : ''}`}>
                    {bill.name}
                  </h3>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${style.text}`}>
                    {t[bill.category as keyof typeof t] || bill.category}
                  </p>
                </div>
                <button 
                  onClick={() => handleDelete(bill.id)}
                  className="p-2 text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center gap-6 pl-2 mb-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Due Day</span>
                  <div className={`flex items-center gap-2 font-black ${isPaidThisMonth ? 'text-slate-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                    <Calendar className="w-4 h-4" />
                    <span>{bill.dueDay}</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Amount</span>
                  <div className={`flex items-center gap-2 font-black ${isPaidThisMonth ? 'text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                    <span>{formatCurrency(bill.amount)}</span>
                  </div>
                </div>
              </div>

              <div className="pl-2">
                {isPaidThisMonth ? (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/30 py-2 px-4 rounded-xl">
                    <CheckCircle2 className="w-4 h-4" /> {t.paid}
                  </div>
                ) : (
                  <button 
                    onClick={() => handlePayBill(bill)}
                    className={`w-full flex items-center justify-center gap-2 text-white font-bold text-xs uppercase tracking-widest py-3 rounded-xl transition-all shadow-md active:scale-95 ${style.dot} hover:brightness-[1.1]`}
                  >
                    <CheckCircle2 className="w-4 h-4" /> {t.payBill}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {filteredBills.length === 0 && !isLoading && (
          <div className="col-span-full p-20 text-center flex flex-col items-center gap-4 text-slate-400">
             <ReceiptText className="w-12 h-12 opacity-10" />
             <p className="font-bold italic">No bills found</p>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl dark:shadow-none overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.addBill}</h3>
              <button onClick={() => { setShowAdd(false); resetForm(); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400 dark:text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              {validationError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50 rounded-xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-xs font-bold animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="w-4 h-4" /> {validationError}
                </div>
              )}
              
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2 pl-1 tracking-widest">Category</label>
                <select 
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                  value={newBill.category || 'others'} onChange={e => handleCategoryChange(e.target.value)}
                >
                  {Object.keys(CATEGORY_COLORS).map(cat => <option key={cat} value={cat}>{t[cat as keyof typeof t] || cat}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2 pl-1 tracking-widest">Bill Name</label>
                <input 
                  type="text" className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                  value={newBill.name || ''} 
                  onChange={e => { setNewBill({...newBill, name: e.target.value}); setIsNameManuallyEdited(true); }}
                  placeholder="Electricity, Water, Rent..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2 pl-1 tracking-widest">Amount</label>
                  <input 
                    type="number" className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                    value={newBill.amount === undefined ? '' : newBill.amount} 
                    onChange={e => {
                      const val = e.target.value;
                      setNewBill({...newBill, amount: val === '' ? undefined : Number(val)});
                    }}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2 pl-1 tracking-widest">Due Day (1-31)</label>
                  <input 
                    type="number" min="1" max="31"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                    value={newBill.dueDay === undefined ? '' : newBill.dueDay} 
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '') {
                        setNewBill({...newBill, dueDay: undefined});
                        return;
                      }
                      const n = Number(val);
                      if (n >= 1 && n <= 31) {
                        setNewBill({...newBill, dueDay: n});
                      } else if (n === 0) {
                         // Allow user to clear if they type 0, but it won't pass validation
                         setNewBill({...newBill, dueDay: 0});
                      }
                    }}
                  />
                </div>
              </div>
              
              <button 
                onClick={handleSave}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all mt-4"
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
