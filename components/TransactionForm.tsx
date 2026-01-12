
import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { AlertCircle, Calculator } from 'lucide-react';

interface TransactionFormProps {
  t: any;
  initialData?: Transaction | null;
  getStartingBalance: (date: string) => number;
  onSubmit: (data: Transaction) => void;
  formatCurrency: (amount: number) => string;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ t, initialData, getStartingBalance, onSubmit, formatCurrency }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    groceries: '' as any,
    vegetables: '' as any,
    fishEgg: '' as any,
    chicken: '' as any,
    houseRent: '' as any,
    electricity: '' as any,
    water: '' as any,
    travel: '' as any,
    others: '' as any,
    dailyCash: '' as any,
    broughtForward: '' as any,
  });

  const [dateError, setDateError] = useState<string | null>(null);
  const [isCalculated, setIsCalculated] = useState(false);

  // Synchronize Brought Forward whenever the date or initialData changes.
  useEffect(() => {
    if (initialData) {
      // Editing existing transaction
      setFormData({
        date: initialData.date,
        groceries: initialData.groceries || '',
        vegetables: initialData.vegetables || '',
        fishEgg: initialData.fishEgg || '',
        chicken: initialData.chicken || '',
        houseRent: initialData.houseRent || '',
        electricity: initialData.electricity || '',
        water: initialData.water || '',
        travel: initialData.travel || '',
        others: initialData.others || '',
        dailyCash: initialData.dailyCash || '',
        broughtForward: initialData.broughtForward,
      });
      setIsCalculated(false);
    } else {
      // Adding new transaction - calculate opening balance reactively
      const bf = getStartingBalance(formData.date);
      setFormData(prev => ({
        ...prev,
        broughtForward: Number(bf) || 0
      }));
      setIsCalculated(true);
    }
  }, [initialData, getStartingBalance, formData.date]);

  const validateDate = (dateString: string) => {
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      setDateError(t.futureDateError);
      return false;
    } else {
      setDateError(null);
      return true;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (name === 'date') validateDate(value);
    
    // If user manually edits the Brought Forward, mark it as no longer auto-calculated
    if (name === 'broughtForward') setIsCalculated(false);

    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const val = (v: any) => {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  };

  const totalExpenses = 
    val(formData.groceries) + 
    val(formData.vegetables) + 
    val(formData.fishEgg) + 
    val(formData.chicken) + 
    val(formData.houseRent) +
    val(formData.electricity) +
    val(formData.water) +
    val(formData.travel) +
    val(formData.others);

  const totalBalance = val(formData.broughtForward) + val(formData.dailyCash) - totalExpenses;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDate(formData.date)) return;

    const dateObj = new Date(formData.date);
    const monthName = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    onSubmit({
      ...formData,
      groceries: val(formData.groceries),
      vegetables: val(formData.vegetables),
      fishEgg: val(formData.fishEgg),
      chicken: val(formData.chicken),
      houseRent: val(formData.houseRent),
      electricity: val(formData.electricity),
      water: val(formData.water),
      travel: val(formData.travel),
      others: val(formData.others),
      dailyCash: val(formData.dailyCash),
      broughtForward: val(formData.broughtForward),
      month: monthName,
      totalExpenses: totalExpenses,
      totalBalance: totalBalance,
      timestamp: initialData?.timestamp || new Date().toISOString()
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.date}</label>
            <input
              type="date"
              name="date"
              required
              className={`w-full px-4 py-2.5 rounded-xl border ${dateError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium`}
              value={formData.date}
              onChange={handleChange}
            />
            {dateError && (
              <div className="flex items-center gap-1.5 text-rose-500 text-xs font-bold animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {dateError}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{t.broughtForward}</label>
              {isCalculated && (
                <span className="flex items-center gap-1 text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-tight animate-in fade-in duration-300">
                  <Calculator className="w-2.5 h-2.5" />
                  Auto-Synced
                </span>
              )}
            </div>
            <input
              type="number"
              name="broughtForward"
              placeholder="0"
              className={`w-full px-4 py-2.5 rounded-xl border ${isCalculated ? 'border-indigo-100 dark:border-indigo-900 bg-indigo-50/20 dark:bg-indigo-900/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'} text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-indigo-600 dark:text-indigo-400`}
              value={formData.broughtForward === '' ? '' : formData.broughtForward}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1 text-emerald-600 dark:text-emerald-400">{t.dailyCash}</label>
            <input
              type="number"
              name="dailyCash"
              placeholder="0"
              className="w-full px-4 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-900/10 font-bold transition-all focus:ring-2 focus:ring-emerald-500 outline-none text-emerald-800 dark:text-emerald-100"
              value={formData.dailyCash === '' ? '' : formData.dailyCash}
              onChange={handleChange}
            />
          </div>
          {[
            { name: 'groceries', label: t.groceries },
            { name: 'vegetables', label: t.vegetables },
            { name: 'fishEgg', label: t.fishEgg },
            { name: 'chicken', label: t.chicken },
            { name: 'houseRent', label: t.houseRent },
            { name: 'electricity', label: t.electricity },
            { name: 'water', label: t.water },
            { name: 'travel', label: t.travel },
            { name: 'others', label: t.others },
          ].map(field => (
            <div key={field.name}>
              <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">{field.label}</label>
              <input
                type="number"
                name={field.name}
                placeholder="0"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 transition-all focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                value={(formData as any)[field.name] === '' ? '' : (formData as any)[field.name]}
                onChange={handleChange}
              />
            </div>
          ))}
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex flex-wrap gap-8 items-center justify-center border border-slate-100 dark:border-slate-800 transition-colors shadow-inner">
          <div className="text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold mb-1">{t.totalExpenses}</p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold mb-1">{t.totalBalance}</p>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(totalBalance)}</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={!!dateError}
          className={`w-full ${dateError ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'} text-white py-4 rounded-xl font-bold shadow-lg dark:shadow-none active:scale-[0.99] transition-all`}
        >
          {t.save}
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;
