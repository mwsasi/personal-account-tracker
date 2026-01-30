
import React, { useMemo } from 'react';
import { Transaction, MonthlyBudget } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend
} from 'recharts';
import { Target, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Activity } from 'lucide-react';

interface BudgetPerformanceProps {
  t: any;
  transactions: Transaction[];
  budgets: MonthlyBudget[];
  formatCurrency: (amount: number) => string;
}

const CATEGORIES = [
  'groceries', 'vegetables', 'fishEgg', 'chicken', 'houseRent', 
  'electricity', 'water', 'travel', 'compoundInvestment', 'others'
];

const BudgetPerformance: React.FC<BudgetPerformanceProps> = ({ t, transactions, budgets, formatCurrency }) => {
  const isDark = document.documentElement.classList.contains('dark');

  const performanceData = useMemo(() => {
    const months = Array.from(new Set([
      ...transactions.map(tx => tx.month.trim()),
      ...budgets.map(b => b.month.trim())
    ])).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    return months.map(month => {
      const monthTxs = transactions.filter(tx => tx.month.trim() === month);
      const monthBudget = budgets.find(b => b.month.trim() === month);

      const actual = monthTxs.reduce((sum, tx) => sum + (Number(tx.totalExpenses) || 0), 0);
      const budget = monthBudget ? (Object.values(monthBudget.limits) as number[]).reduce((sum, limit) => sum + (Number(limit) || 0), 0) : 0;
      
      return {
        month,
        actual,
        budget,
        difference: budget - actual,
        status: (budget > 0) ? (actual <= budget ? 'under' : 'over') : 'no-budget'
      };
    }).filter(d => d.budget > 0 || d.actual > 0);
  }, [transactions, budgets]);

  if (performanceData.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-100 dark:border-slate-800 text-center transition-colors">
        <p className="text-slate-400 dark:text-slate-600">{t.noData}</p>
      </div>
    );
  }

  const latestPerformance = performanceData[performanceData.length - 1];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
            <Target className="w-6 h-6 text-indigo-700 dark:text-indigo-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{t.budgetPerformance}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Performance Bar Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-700 dark:text-slate-300">{t.budgetVsActual}</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">{t.budgetLimit}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">{t.actualSpending}</span>
              </div>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                <XAxis dataKey="month" fontSize={10} tickLine={false} axisLine={false} stroke={isDark ? "#64748b" : "#94a3b8"} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} stroke={isDark ? "#64748b" : "#94a3b8"} />
                <Tooltip 
                  cursor={{fill: isDark ? '#1e293b' : '#f8fafc'}}
                  contentStyle={{ 
                    backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                    borderRadius: '16px', 
                    border: isDark ? '1px solid #1e293b' : 'none', 
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                    color: isDark ? '#f1f5f9' : '#1e293b'
                  }}
                  formatter={(val: number) => [formatCurrency(val), ""]}
                />
                <Bar name={t.budgetLimit} dataKey="budget" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar name={t.actualSpending} dataKey="actual" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Current Month Status Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
             <div className="flex justify-between items-start mb-6">
               <div>
                 <h3 className="font-bold text-slate-700 dark:text-slate-300">{t.budgetStatus}</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{latestPerformance.month}</p>
               </div>
               {latestPerformance.status === 'under' ? (
                 <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                   <CheckCircle2 className="w-5 h-5" />
                 </div>
               ) : latestPerformance.status === 'over' ? (
                 <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
                   <AlertCircle className="w-5 h-5" />
                 </div>
               ) : null}
             </div>
             
             <div className="flex items-center gap-4 mb-8">
                <div className={`p-5 rounded-2xl ${latestPerformance.status === 'under' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'}`}>
                  {latestPerformance.status === 'under' ? (
                    <TrendingDown className="w-8 h-8 text-emerald-500" />
                  ) : (
                    <TrendingUp className="w-8 h-8 text-rose-500" />
                  )}
                </div>
                <div>
                   <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{latestPerformance.status === 'under' ? t.remaining : t.overspent}</p>
                   <p className={`text-3xl font-black ${latestPerformance.status === 'under' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {formatCurrency(Math.abs(latestPerformance.difference))}
                   </p>
                </div>
             </div>

             <div className="space-y-4">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight">{t.budgetLimit}</span>
                  <span className="font-black text-slate-800 dark:text-slate-100">{formatCurrency(latestPerformance.budget)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight">{t.actualSpending}</span>
                  <span className="font-black text-slate-800 dark:text-slate-100">{formatCurrency(latestPerformance.actual)}</span>
                </div>
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${latestPerformance.status === 'under' ? 'bg-indigo-500' : 'bg-rose-500'}`}
                    style={{ width: `${Math.min((latestPerformance.actual / latestPerformance.budget) * 100, 100)}%` }}
                  />
                </div>
             </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors overflow-hidden">
             <div className="flex items-center gap-2 mb-4">
               <Activity className="w-4 h-4 text-indigo-500" />
               <h3 className="font-bold text-slate-700 dark:text-slate-300">{t.historicalBudgetPerformance}</h3>
             </div>
             <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                {performanceData.slice().reverse().map((data, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
                     <div>
                       <p className="text-xs font-black text-slate-700 dark:text-slate-300">{data.month}</p>
                       <p className={`text-[9px] font-black uppercase tracking-tighter ${data.status === 'under' ? 'text-emerald-500' : 'text-rose-500'}`}>
                         {data.status === 'under' ? 'SAVINGS' : t.overspent}
                       </p>
                     </div>
                     <div className="text-right">
                       <p className={`text-sm font-black ${data.status === 'under' ? 'text-emerald-600' : 'text-rose-600'}`}>
                         {formatCurrency(Math.abs(data.difference))}
                       </p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetPerformance;
