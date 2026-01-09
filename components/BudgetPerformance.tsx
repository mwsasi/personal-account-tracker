


import React, { useMemo } from 'react';
import { Transaction, MonthlyBudget } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell
} from 'recharts';
import { Target, TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react';

interface BudgetPerformanceProps {
  t: any;
  transactions: Transaction[];
  budgets: MonthlyBudget[];
  formatCurrency: (amount: number) => string;
}

const BudgetPerformance: React.FC<BudgetPerformanceProps> = ({ t, transactions, budgets, formatCurrency }) => {
  const performanceData = useMemo(() => {
    const months = Array.from(new Set([
      ...transactions.map(tx => tx.month.trim()),
      ...budgets.map(b => b.month.trim())
    ])).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    return months.map(month => {
      const monthTxs = transactions.filter(tx => tx.month.trim() === month);
      const monthBudget = budgets.find(b => b.month.trim() === month);

      // Fix: Explicitly type 'sum' as number to resolve 'unknown' type errors during accumulation
      const actual: number = monthTxs.reduce((sum: number, tx) => sum + (Number(tx.totalExpenses) || 0), 0);
      // Fix: Explicitly type 'sum' as number to resolve 'unknown' type errors during accumulation
      const budget: number = monthBudget ? Object.values(monthBudget.limits).reduce((sum: number, limit) => sum + (Number(limit) || 0), 0) : 0;

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
      <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center">
        <p className="text-slate-400">{t.noData}</p>
      </div>
    );
  }

  const latestPerformance = performanceData[performanceData.length - 1];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-100 rounded-xl">
          <Target className="w-6 h-6 text-indigo-700" />
        </div>
        <h2 className="text-2xl font-black text-slate-800">{t.historicalBudgetPerformance}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-700 mb-6">{t.budgetVsActual}</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" />
                <Bar name={t.budgetLimit} dataKey="budget" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar name={t.actualSpending} dataKey="actual" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
             <div className="flex justify-between items-start mb-4">
               <h3 className="font-bold text-slate-700">{t.budgetStatus} - {latestPerformance.month}</h3>
               {latestPerformance.status === 'under' ? (
                 <span className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">
                   <CheckCircle2 className="w-3 h-3" /> Safe
                 </span>
               ) : latestPerformance.status === 'over' ? (
                 <span className="flex items-center gap-1 text-[10px] font-black uppercase text-rose-500 bg-rose-50 px-2 py-1 rounded-lg">
                   <AlertCircle className="w-3 h-3" /> Over Budget
                 </span>
               ) : null}
             </div>
             
             <div className="flex items-center gap-4 mb-6">
                <div className={`p-4 rounded-2xl ${latestPerformance.status === 'under' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                  {latestPerformance.status === 'under' ? (
                    <TrendingDown className="w-8 h-8 text-emerald-500" />
                  ) : (
                    <TrendingUp className="w-8 h-8 text-rose-500" />
                  )}
                </div>
                <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{latestPerformance.status === 'under' ? t.remaining : t.overspent}</p>
                   <p className={`text-2xl font-black ${latestPerformance.status === 'under' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency(Math.abs(latestPerformance.difference))}
                   </p>
                </div>
             </div>

             <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{t.budgetLimit}</span>
                  <span className="font-bold">{formatCurrency(latestPerformance.budget)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{t.actualSpending}</span>
                  <span className="font-bold">{formatCurrency(latestPerformance.actual)}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${latestPerformance.status === 'under' ? 'bg-indigo-500' : 'bg-rose-500'}`}
                    style={{ width: `${Math.min((latestPerformance.actual / latestPerformance.budget) * 100, 100)}%` }}
                  />
                </div>
             </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
             <h3 className="font-bold text-slate-700 mb-4">{t.historicalBudgetPerformance}</h3>
             <div className="space-y-3 max-h-[150px] overflow-y-auto pr-2">
                {performanceData.slice().reverse().map((data, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                     <div>
                       <p className="text-xs font-bold text-slate-700">{data.month}</p>
                       <p className="text-[10px] text-slate-400 uppercase font-black">{data.status === 'under' ? 'Saved' : 'Exceeded'}</p>
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
