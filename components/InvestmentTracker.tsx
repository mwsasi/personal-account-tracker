
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction } from '../types';
import { 
  TrendingUp, 
  Target, 
  Calculator, 
  ChevronDown, 
  ArrowUpRight, 
  BarChart4, 
  Wallet, 
  RotateCcw, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  History, 
  Zap 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';

interface InvestmentTrackerProps {
  t: any;
  formatCurrency: (amount: number) => string;
  transactions: Transaction[];
}

const STORAGE_KEY = 'finance_tracker_v3_investment_plan';

const InvestmentTracker: React.FC<InvestmentTrackerProps> = ({ t, formatCurrency, transactions }) => {
  const isDark = document.documentElement.classList.contains('dark');
  
  // 1. Calculate stats from dashboard for reference only
  const totalActualInvested = useMemo(() => {
    return transactions.reduce((sum, tx) => sum + (Number(tx.compoundInvestment) || 0), 0);
  }, [transactions]);

  const recentInvestments = useMemo(() => {
    return [...transactions]
      .filter(tx => Number(tx.compoundInvestment) > 0)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, [transactions]);

  const historicalMonthlyAverage = useMemo(() => {
    const monthTotals: Record<string, number> = {};
    transactions.forEach(tx => {
      if (tx.month && Number(tx.compoundInvestment) > 0) {
        monthTotals[tx.month] = (monthTotals[tx.month] || 0) + Number(tx.compoundInvestment);
      }
    });
    const totals = Object.values(monthTotals);
    if (totals.length === 0) return 0;
    return Math.round(totals.reduce((a, b) => a + b, 0) / totals.length);
  }, [transactions]);

  // Load saved settings from localStorage
  const savedSettings = useMemo(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  }, []);

  /**
   * INITIAL PRINCIPAL: 
   * As requested, this can ONLY change manually. 
   * It defaults to a static value (10000) or what the user saved last.
   * It DOES NOT automatically track 'totalActualInvested'.
   */
  const [principal, setPrincipal] = useState<number>(savedSettings?.principal ?? 10000);
  const [contributionAmount, setContributionAmount] = useState<number>(savedSettings?.contributionAmount ?? (historicalMonthlyAverage || 1000));
  const [contributionFrequency, setContributionFrequency] = useState<'daily' | 'monthly'>(savedSettings?.contributionFrequency ?? 'monthly');
  const [annualRate, setAnnualRate] = useState<number>(savedSettings?.annualRate ?? 8);
  const [years, setYears] = useState<number>(savedSettings?.years ?? 10);
  const [syncToast, setSyncToast] = useState(false);

  // Auto-save user adjustments to localStorage
  useEffect(() => {
    const settings = {
      principal,
      contributionAmount,
      contributionFrequency,
      annualRate,
      years
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [principal, contributionAmount, contributionFrequency, annualRate, years]);

  const handleReset = () => {
    if (window.confirm("Reset calculator to default values?")) {
      localStorage.removeItem(STORAGE_KEY);
      setPrincipal(10000);
      setContributionAmount(historicalMonthlyAverage || 1000);
      setContributionFrequency('monthly');
      setAnnualRate(8);
      setYears(10);
    }
  };

  // Explicit manual sync button for principal
  const handleSyncPrincipal = () => {
    setPrincipal(totalActualInvested);
    setSyncToast(true);
    setTimeout(() => setSyncToast(false), 2000);
  };

  const handleUseAverage = () => {
    setContributionAmount(historicalMonthlyAverage);
    setContributionFrequency('monthly');
  };

  const projectionData = useMemo(() => {
    const data = [];
    let currentBalance = principal;
    let totalInvested = principal;
    
    const ratePerMonth = (annualRate / 100) / 12;

    // Start at Year 0
    data.push({
      year: 0,
      balance: Math.round(currentBalance),
      invested: Math.round(totalInvested),
      interest: 0
    });

    for (let year = 1; year <= years; year++) {
      for (let month = 1; month <= 12; month++) {
        const monthlyCont = contributionFrequency === 'daily' ? contributionAmount * 30.44 : contributionAmount;
        currentBalance += monthlyCont;
        totalInvested += monthlyCont;
        currentBalance *= (1 + ratePerMonth);
      }
      
      data.push({
        year,
        balance: Math.round(currentBalance),
        invested: Math.round(totalInvested),
        interest: Math.round(currentBalance - totalInvested)
      });
    }
    return data;
  }, [principal, contributionAmount, contributionFrequency, annualRate, years]);

  const results = projectionData[projectionData.length - 1];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-2xl shadow-sm border border-teal-200 dark:border-teal-800">
            <TrendingUp className="w-8 h-8 text-teal-700 dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 leading-tight tracking-tight">{t.investments}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t.compoundCalculator}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{t.actualTotalInvested}</span>
            <span className="text-lg font-black text-teal-600 dark:text-teal-400">{formatCurrency(totalActualInvested)}</span>
          </div>
          <button 
            onClick={handleSyncPrincipal}
            className="flex items-center gap-2 px-5 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            <RefreshCw className={`w-4 h-4 ${syncToast ? 'animate-spin' : ''}`} />
            {t.syncFromDashboard}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/40 dark:shadow-none p-7 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-2">
                 <Calculator className="w-4 h-4 text-teal-500" />
                 <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Projection Setup</h3>
               </div>
               <button onClick={handleReset} className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-500 rounded-lg">
                 <RotateCcw className="w-4 h-4" />
               </button>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.principal}</label>
                  {principal === totalActualInvested && (
                    <span className="flex items-center gap-1 text-[9px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">
                      <Sparkles className="w-2.5 h-2.5" /> Synced
                    </span>
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300 group-focus-within:text-teal-500">{formatCurrency(0).replace(/[0.,\s]/g, '')}</div>
                  <input 
                    type="number" 
                    value={principal || ''} 
                    onChange={e => setPrincipal(Number(e.target.value))}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-black focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.monthlyContribution}</label>
                  {historicalMonthlyAverage > 0 && (
                    <button 
                      onClick={handleUseAverage}
                      className="flex items-center gap-1 text-[9px] font-black text-indigo-500 hover:text-indigo-600 uppercase tracking-tighter"
                    >
                      <Zap className="w-2.5 h-2.5" /> Use Avg ({formatCurrency(historicalMonthlyAverage)})
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative group flex-grow">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300 group-focus-within:text-indigo-500">{formatCurrency(0).replace(/[0.,\s]/g, '')}</div>
                    <input 
                      type="number" 
                      value={contributionAmount || ''} 
                      onChange={e => setContributionAmount(Number(e.target.value))}
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-black focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    />
                  </div>
                  <select 
                    value={contributionFrequency} 
                    onChange={e => setContributionFrequency(e.target.value as 'daily' | 'monthly')}
                    className="px-3 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-[10px] font-black uppercase tracking-widest cursor-pointer"
                  >
                    <option value="daily">{t.daily}</option>
                    <option value="monthly">{t.monthly}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">{t.annualRate}</label>
                  <input 
                    type="number" step="0.1"
                    value={annualRate || ''} 
                    onChange={e => setAnnualRate(Number(e.target.value))}
                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-black focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">{t.years}</label>
                  <input 
                    type="number" 
                    value={years || ''} 
                    onChange={e => setYears(Number(e.target.value))}
                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-black focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-emerald-50 dark:bg-emerald-950/20 rounded-3xl border border-emerald-100 dark:border-emerald-900/50 shadow-inner">
               <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1.5">{t.futureValue}</p>
               <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300 truncate tracking-tight">{formatCurrency(results.balance)}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-4 h-4 text-slate-400" />
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.recentInvestmentEntries}</h3>
            </div>
            <div className="space-y-3">
              {recentInvestments.map((tx, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="font-bold text-slate-500">{tx.date.split('-').reverse().slice(0, 2).join('/')}</span>
                  <span className="font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(Number(tx.compoundInvestment))}</span>
                </div>
              ))}
              {recentInvestments.length === 0 && (
                <p className="text-[10px] text-slate-400 italic text-center py-4">No recent dashboard entries found</p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
                    <BarChart4 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{t.projection}</h3>
               </div>
               <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invested</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance</span>
                  </div>
               </div>
            </div>

            <div className="h-[450px] w-full mt-4">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                    <XAxis 
                      dataKey="year" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      stroke={isDark ? "#475569" : "#94a3b8"}
                      label={{ value: t.year, position: 'insideBottom', offset: -5, fontSize: 10, fontWeight: '900', fill: '#94a3b8' }}
                    />
                    <YAxis 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      stroke={isDark ? "#475569" : "#94a3b8"}
                      tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                        borderRadius: '24px', 
                        border: isDark ? '1px solid #1e293b' : '1px solid #f1f5f9',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                        color: isDark ? '#f1f5f9' : '#1e293b',
                        fontWeight: '900',
                        fontSize: '12px'
                      }}
                      formatter={(val: number) => [formatCurrency(val), ""]}
                    />
                    <Area 
                      name={t.totalInvested}
                      type="monotone" 
                      dataKey="invested" 
                      stroke="#6366f1" 
                      fillOpacity={1} 
                      fill="url(#colorInvested)" 
                      strokeWidth={3}
                      strokeDasharray="5 5"
                    />
                    <Area 
                      name={t.futureValue}
                      type="monotone" 
                      dataKey="balance" 
                      stroke="#10b981" 
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                      strokeWidth={5}
                    />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-50 dark:border-slate-800/50">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <Target className="w-6 h-6 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.totalInvested}</p>
                    <p className="text-xl font-black text-slate-800 dark:text-slate-100">{formatCurrency(results.invested)}</p>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <ArrowUpRight className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.interestEarned}</p>
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(results.interest)}</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {syncToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 bg-emerald-600 text-white rounded-[2rem] shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-black text-xs uppercase tracking-widest">{t.syncSuccess}</span>
        </div>
      )}
    </div>
  );
};

export default InvestmentTracker;
