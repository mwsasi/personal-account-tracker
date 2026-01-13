
import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { AlertCircle } from 'lucide-react';

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

  /**
   * REACTION LOGIC
   * This effect ensures that the "Brought Forward" field is always accurate to the selected calendar date.
   * If jumping to an older date or a missing date, the form will suggest the closing balance of the day immediately prior.
   */
  useEffect(() => {
    if (initialData) {
      // EDIT MODE: Use the values exactly as they are currently stored in the specific record.
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
    } else {
      // ADD MODE: Automatically determine the opening Stock/Balance based on the selected date.
      // Jumping to any date in the calendar will fetch the correct 'final total balance' of its predecessor.
      const bf = getStartingBalance(formData.date);
      setFormData(prev => ({
        ...prev,
        broughtForward: Number(bf) || 0
      }));
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
            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1 mb-1">{t.date}</label>
            <input
              type="date"
              name="date"
              required
              className={`w-full px-4 py-3 rounded-2xl border ${dateError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-sm`}
              value={formData.date}
              onChange={handleChange}
            />
            {dateError && (
              <div className="flex items-center gap-1.5 text-rose-500 text-[10px] font-black uppercase tracking-tight pl-1 pt-1 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {dateError}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1 mb-1">{t.broughtForward}</label>
            <input
              type="number"
              name="broughtForward"
              placeholder="0"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 transition-all focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm"
              value={formData.broughtForward === '' ? '' : formData.broughtForward}
              onChange={handleChange}
            />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter pl-1 mt-1">Suggested from account history</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest pl-1 mb-1">{t.dailyCash}</label>
            <input
              type="number"
              name="dailyCash"
              placeholder="0"
              className="w-full px-4 py-3 rounded-2xl border border-emerald-100 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-900/10 font-black text-emerald-800 dark:text-emerald-200 transition-all focus:ring-2 focus:ring-emerald-500 outline-none"
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
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1 mb-1">{field.label}</label>
              <input
                type="number"
                name={field.name}
                placeholder="0"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 transition-all focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm"
                value={(formData as any)[field.name] === '' ? '' : (formData as any)[field.name]}
                onChange={handleChange}
              />
            </div>
          ))}
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl flex flex-wrap gap-12 items-center justify-center border border-slate-100 dark:border-slate-800 transition-colors shadow-inner">
          <div className="text-center group">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black mb-2 group-hover:text-rose-400 transition-colors">{t.totalExpenses}</p>
            <p className="text-3xl font-black text-rose-600 dark:text-rose-500">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="w-px h-12 bg-slate-200 dark:bg-slate-700 hidden sm:block" />
          <div className="text-center group">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black mb-2 group-hover:text-indigo-400 transition-colors">{t.totalBalance}</p>
            <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(totalBalance)}</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={!!dateError}
          className={`w-full ${dateError ? 'bg-slate-200 cursor-not-allowed opacity-50' : 'bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 dark:shadow-none'} text-white py-5 rounded-3xl font-black text-sm uppercase tracking-widest active:scale-[0.99] transition-all`}
        >
          {t.save}
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;
