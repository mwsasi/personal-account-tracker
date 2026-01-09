
import React, { useState } from 'react';
import { MonthlyBudget } from '../types';

interface BudgetManagerProps {
  t: any;
  month: string;
  initialLimits: MonthlyBudget['limits'];
  onSubmit: (limits: MonthlyBudget['limits']) => void;
}

const BudgetManager: React.FC<BudgetManagerProps> = ({ t, month, initialLimits, onSubmit }) => {
  const [limits, setLimits] = useState(initialLimits);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLimits(prev => ({
      ...prev,
      [name]: value === '' ? 0 : parseFloat(value)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(limits);
  };

  const fields = [
    { name: 'groceries', label: t.groceries },
    { name: 'vegetables', label: t.vegetables },
    { name: 'fishEgg', label: t.fishEgg },
    { name: 'chicken', label: t.chicken },
    { name: 'houseRent', label: t.houseRent },
    { name: 'electricity', label: t.electricity },
    { name: 'water', label: t.water },
    { name: 'travel', label: t.travel },
    { name: 'others', label: t.others },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl mb-6 text-center transition-colors">
        <p className="text-[10px] font-black text-indigo-400 dark:text-indigo-500 uppercase tracking-widest mb-1">{t.month}</p>
        <p className="font-bold text-indigo-700 dark:text-indigo-300">{month}</p>
      </div>
      
      <div className="flex-grow space-y-2 overflow-y-auto pr-1 -mr-1 custom-scrollbar" style={{ maxHeight: 'calc(80vh - 250px)' }}>
        {fields.map(field => (
          <div key={field.name} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100/50 dark:border-slate-700/30 transition-colors">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex-grow pr-2">
              {field.label}
            </label>
            <div className="relative">
              <input
                type="number"
                name={field.name}
                placeholder="0"
                className="w-24 sm:w-28 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-right font-black text-indigo-600 dark:text-indigo-400 text-sm"
                value={(limits as any)[field.name] || ''}
                onChange={handleChange}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-6 mt-auto">
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all"
        >
          {t.save}
        </button>
      </div>
    </form>
  );
};

export default BudgetManager;
