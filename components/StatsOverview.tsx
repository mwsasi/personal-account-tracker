
import React from 'react';
import { ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react';

interface StatsOverviewProps {
  t: any;
  stats: {
    totalSpent: number;
    totalReceived: number;
    lastBalance: number;
  };
  formatCurrency: (amount: number) => string;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ t, stats, formatCurrency }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
      <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-3 md:gap-4 transition-colors">
        <div className="p-2 md:p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl md:rounded-2xl">
          <ArrowUpCircle className="w-6 h-6 md:w-8 md:h-8 text-rose-500 dark:text-rose-400" />
        </div>
        <div>
          <p className="text-[10px] md:text-sm font-medium text-slate-400 dark:text-slate-500">{t.totalSpent}</p>
          <p className="text-lg md:text-2xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(stats.totalSpent)}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-3 md:gap-4 transition-colors">
        <div className="p-2 md:p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl md:rounded-2xl">
          <ArrowDownCircle className="w-6 h-6 md:w-8 md:h-8 text-emerald-500 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-[10px] md:text-sm font-medium text-slate-400 dark:text-slate-500">{t.totalReceived}</p>
          <p className="text-lg md:text-2xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(stats.totalReceived)}</p>
        </div>
      </div>

      <div className="bg-indigo-600 p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-xl shadow-indigo-200 dark:shadow-none flex items-center gap-3 md:gap-4 text-white">
        <div className="p-2 md:p-3 bg-white/20 rounded-xl md:rounded-2xl">
          <Wallet className="w-6 h-6 md:w-8 md:h-8 text-white" />
        </div>
        <div>
          <p className="text-[10px] md:text-sm font-medium text-white/70">{t.netBalance}</p>
          <p className="text-lg md:text-2xl font-bold">{formatCurrency(stats.lastBalance)}</p>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;
