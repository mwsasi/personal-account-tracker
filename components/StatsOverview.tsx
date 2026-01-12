
import React from 'react';
import { ArrowUpCircle, ArrowDownCircle, Wallet, TrendingUp, TrendingDown } from 'lucide-react';

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
  const isNegative = stats.lastBalance < 0;

  // Helper to format number with 2 decimals and thousands separators without the symbol
  const formatNumberOnly = (num: number) => {
    return Math.abs(num).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      {/* Total Spent Card */}
      <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 transition-all duration-300 hover:shadow-md group">
        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-2xl shrink-0 group-hover:scale-110 transition-transform">
          <ArrowDownCircle className="w-6 h-6 md:w-8 md:h-8 text-rose-500 dark:text-rose-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] md:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{t.totalSpent}</p>
          <p className="text-base md:text-lg font-black text-slate-800 dark:text-slate-100 whitespace-nowrap overflow-visible leading-tight">
            {formatNumberOnly(stats.totalSpent)}
          </p>
        </div>
      </div>

      {/* Total Received Card */}
      <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 transition-all duration-300 hover:shadow-md group">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl shrink-0 group-hover:scale-110 transition-transform">
          <ArrowUpCircle className="w-6 h-6 md:w-8 md:h-8 text-emerald-500 dark:text-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] md:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{t.totalReceived}</p>
          <p className="text-base md:text-lg font-black text-slate-800 dark:text-slate-100 whitespace-nowrap overflow-visible leading-tight">
            {formatNumberOnly(stats.totalReceived)}
          </p>
        </div>
      </div>

      {/* Net Balance Card - Dynamic Color */}
      <div className={`p-4 md:p-6 rounded-3xl shadow-xl transition-all duration-500 flex items-center gap-4 group ${
        isNegative 
          ? 'bg-rose-600 shadow-rose-200 dark:shadow-none text-white' 
          : 'bg-indigo-600 shadow-indigo-200 dark:shadow-none text-white'
      }`}>
        <div className="p-3 bg-white/20 rounded-2xl shrink-0 group-hover:rotate-12 transition-transform">
          <Wallet className="w-6 h-6 md:w-8 md:h-8 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-[10px] md:text-xs font-black text-white/80 uppercase tracking-widest">{t.netBalance}</p>
            {isNegative ? <TrendingDown className="w-3 h-3 text-white/60" /> : <TrendingUp className="w-3 h-3 text-white/60" />}
          </div>
          <p className="text-base md:text-lg font-black whitespace-nowrap overflow-visible leading-tight">
            {isNegative ? '-' : ''}{formatNumberOnly(stats.lastBalance)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;
