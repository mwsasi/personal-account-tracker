
import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { AlertCircle, RefreshCw, BadgeAlert, TrendingUp, Sparkles, Fuel, Wrench, Package } from 'lucide-react';

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
    fuel: '' as any,
    bikeRepair: '' as any,
    parcel: '' as any,
    compoundInvestment: '' as any,
    others: '' as any,
    dailyCash: '' as any,
    broughtForward: '' as any,
  });

  const [dateError, setDateError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (initialData) {
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
        fuel: initialData.fuel || '',
        bikeRepair: initialData.bikeRepair || '',
        parcel: initialData.parcel || '',
        compoundInvestment: initialData.compoundInvestment || '',
        others: initialData.others || '',
        dailyCash: initialData.dailyCash || '',
        broughtForward: initialData.broughtForward,
      });
    } else {
      setIsSyncing(true);
      const bf = getStartingBalance(formData.date);
      setFormData(prev => ({
        ...prev,
        broughtForward: Number(bf) || 0
      }));
      setTimeout(() => setIsSyncing(false), 400);
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
    
    let val = value;
    if (type === 'number' && Number(value) < 0) {
      val = '0';
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (val === '' ? '' : Number(val)) : val
    }));
  };

  const val = (v: any) => {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  };

  // Standard expenses (Liquid Balance impact)
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
      fuel: val(formData.fuel),
      bikeRepair: val(formData.bikeRepair),
      parcel: val(formData.parcel),
      compoundInvestment: val(formData.compoundInvestment),
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
              className={`w-full px-4 py-3 rounded-2xl border ${dateError ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-sm`}
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
            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1 mb-1">
              {t.broughtForward}
            </label>
            <div className="relative group">
              <input
                type="number"
                name="broughtForward"
                placeholder="0"
                className={`w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-indigo-600 dark:text-indigo-400 transition-all focus:ring-2 focus:ring-indigo-500 outline-none font-black text-sm ${isSyncing ? 'animate-pulse' : ''}`}
                value={formData.broughtForward === '' ? '' : formData.broughtForward}
                onChange={handleChange}
              />
              <div className="flex items-center gap-1 mt-1 pl-1">
                {isSyncing ? (
                  <RefreshCw className="w-2.5 h-2.5 text-indigo-400 animate-spin" />
                ) : (
                  <BadgeAlert className="w-2.5 h-2.5 text-slate-300" />
                )}
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                  {isSyncing ? 'Recalculating sequence...' : 'Synced from previous day'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Liquid Funds Input */}
        <div className="p-5 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/30">
          <label className="block text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest pl-1 mb-2">{t.dailyCash}</label>
          <input
            type="number"
            name="dailyCash"
            placeholder="0"
            min="0"
            className="w-full px-4 py-3 rounded-2xl border border-emerald-100 dark:border-emerald-800 bg-white dark:bg-slate-900 font-black text-emerald-800 dark:text-emerald-200 transition-all focus:ring-2 focus:ring-emerald-500 outline-none"
            value={formData.dailyCash === '' ? '' : formData.dailyCash}
            onChange={handleChange}
          />
        </div>

        {/* Parallel Logs Section */}
        <div className="space-y-4">
           <div className="flex items-center gap-2 px-1">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.parallelLog} (Records Only)</h3>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Compound Investment */}
              <div className="relative group">
                <label className="block text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-1 pl-1">{t.compoundInvestment}</label>
                <div className="relative">
                  <input
                    type="number" name="compoundInvestment" placeholder="0" min="0"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/20 dark:bg-teal-900/10 font-black text-teal-700 dark:text-teal-300 outline-none text-xs"
                    value={formData.compoundInvestment === '' ? '' : formData.compoundInvestment} onChange={handleChange}
                  />
                  <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-teal-400" />
                </div>
              </div>

              {/* Fuel */}
              <div className="relative group">
                <label className="block text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1 pl-1">{t.fuel}</label>
                <div className="relative">
                  <input
                    type="number" name="fuel" placeholder="0" min="0"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-900/10 font-black text-amber-700 dark:text-amber-300 outline-none text-xs"
                    value={formData.fuel === '' ? '' : formData.fuel} onChange={handleChange}
                  />
                  <Fuel className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-400" />
                </div>
              </div>

              {/* Bike Repair */}
              <div className="relative group">
                <label className="block text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1 pl-1">{t.bikeRepair}</label>
                <div className="relative">
                  <input
                    type="number" name="bikeRepair" placeholder="0" min="0"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/20 dark:bg-blue-900/10 font-black text-blue-700 dark:text-blue-300 outline-none text-xs"
                    value={formData.bikeRepair === '' ? '' : formData.bikeRepair} onChange={handleChange}
                  />
                  <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-400" />
                </div>
              </div>

              {/* Parcel */}
              <div className="relative group">
                <label className="block text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1 pl-1">{t.parcel}</label>
                <div className="relative">
                  <input
                    type="number" name="parcel" placeholder="0" min="0"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/20 dark:bg-purple-900/10 font-black text-purple-700 dark:text-purple-300 outline-none text-xs"
                    value={formData.parcel === '' ? '' : formData.parcel} onChange={handleChange}
                  />
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-purple-400" />
                </div>
              </div>
           </div>
        </div>

        {/* Daily Expenses Section */}
        <div className="space-y-4">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Standard Daily Expenses</h3>
           <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1 mb-1">{field.label}</label>
                <input
                  type="number"
                  name={field.name}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 transition-all focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-xs"
                  value={(formData as any)[field.name] === '' ? '' : (formData as any)[field.name]}
                  onChange={handleChange}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl flex flex-wrap gap-12 items-center justify-center border border-slate-100 dark:border-slate-800 transition-colors shadow-inner">
          <div className="text-center group">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black mb-2 group-hover:text-rose-400 transition-colors">{t.totalSpent}</p>
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
