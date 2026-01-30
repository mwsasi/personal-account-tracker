
import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { TrendingUp, Target, Calculator, Info, Calendar, ChevronDown, ArrowUpRight, BarChart4, Wallet } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface InvestmentTrackerProps {
  t: any;
  formatCurrency: (amount: number) => string;
  transactions: Transaction[];
}

const InvestmentTracker: React.FC<InvestmentTrackerProps> = ({ t, formatCurrency, transactions }) => {
  const isDark = document.documentElement.classList.contains('dark');
  
  // Get initial principal from total compoundInvestment transactions
  const currentTotalInvested = useMemo(() => {
    return transactions.reduce((sum, tx) => sum + (Number(tx.compoundInvestment) || 0), 0);
  }, [transactions]);

  const [principal, setPrincipal] = useState<number>(currentTotalInvested || 10000);
  const [contributionAmount, setContributionAmount] = useState<number>(1000);
  const [contributionFrequency, setContributionFrequency] = useState<'daily' | 'monthly'>('monthly');
  const [annualRate, setAnnualRate] = useState<number>(8);
  const [years, setYears] = useState<number>(10);
  const [compoundingFreq, setCompoundingFreq] = useState<number>(12); // Default to monthly compounding

  const projectionData = useMemo(() => {
    const data = [];
    let currentBalance = principal;
    let totalInvested = principal;
    
    const isDailyCompounding = compoundingFreq === 365;
    const ratePerDay = (annualRate / 100) / 365;
    const ratePerMonth = (annualRate / 100) / 12;

    // Start at Year 0
    data.push({
      year: 0,
      balance: Math.round(currentBalance),
      invested: Math.round(totalInvested),
      interest: 0
    });

    for (let year = 1; year <= years; year++) {
      // Simulate month by month for visualization
      for (let month = 1; month <= 12; month++) {
        // Handle Contribution
        if (contributionFrequency === 'daily') {
          // Add daily contribution for ~30.44 days
          const monthlyCont = contributionAmount * 30.44;
          currentBalance += monthlyCont;
          totalInvested += monthlyCont;
        } else {
          // Add monthly contribution
          currentBalance += contributionAmount;
          totalInvested += contributionAmount;
        }

        // Handle Compounding
        if (isDailyCompounding) {
          // Compound daily for approx 30.44 days each month
          currentBalance *= Math.pow(1 + ratePerDay, 30.44);
        } else {
          // Compound monthly
          currentBalance *= (1 + ratePerMonth);
        }
      }
      
      data.push({
        year,
        balance: Math.round(currentBalance),
        invested: Math.round(totalInvested),
        interest: Math.round(currentBalance - totalInvested)
      });
    }
    return data;
  }, [principal, contributionAmount, contributionFrequency, annualRate, years, compoundingFreq]);

  const results = projectionData[projectionData.length - 1];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-xl">
          <TrendingUp className="w-6 h-6 text-teal-700 dark:text-teal-400" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight">{t.investments}</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.compoundCalculator}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Serrated Calculator Form */}
        <div className="lg:col-span-5 relative group">
          <div 
            className="bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none p-8 transition-colors relative"
            style={{
              clipPath: 'polygon(0% 0%, 5% 1%, 10% 0%, 15% 1%, 20% 0%, 25% 1%, 30% 0%, 35% 1%, 40% 0%, 45% 1%, 50% 0%, 55% 1%, 60% 0%, 65% 1%, 70% 0%, 75% 1%, 80% 0%, 85% 1%, 90% 0%, 95% 1%, 100% 0%, 100% 100%, 95% 99%, 90% 100%, 85% 99%, 80% 100%, 75% 99%, 70% 100%, 65% 99%, 60% 100%, 55% 99%, 50% 100%, 45% 99%, 40% 100%, 35% 99%, 30% 100%, 25% 99%, 20% 100%, 15% 99%, 10% 100%, 5% 99%, 0% 100%)',
              paddingTop: '2.5rem',
              paddingBottom: '2.5rem'
            }}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-4 h-4 text-teal-500" />
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Projection Settings</h3>
              </div>

              {/* Principal Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">{t.principal}</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 select-none">Rs</div>
                  <input 
                    type="number" 
                    value={principal || ''} 
                    onChange={e => setPrincipal(Number(e.target.value))}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Investment Plan (Contribution Frequency + Amount) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Contribution Plan</label>
                  <div className="relative group">
                    <select 
                      value={contributionFrequency} 
                      onChange={e => setContributionFrequency(e.target.value as 'daily' | 'monthly')}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-teal-500 outline-none transition-all appearance-none cursor-pointer text-sm"
                    >
                      <option value="daily">{t.daily}</option>
                      <option value="monthly">{t.monthly}</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-teal-500 transition-colors" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Amount</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 select-none">Rs</div>
                    <input 
                      type="number" 
                      value={contributionAmount || ''} 
                      onChange={e => setContributionAmount(Number(e.target.value))}
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Rate & Years */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">{t.annualRate}</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={annualRate || ''} 
                    onChange={e => setAnnualRate(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">{t.years}</label>
                  <input 
                    type="number" 
                    value={years || ''} 
                    onChange={e => setYears(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* Compounding Frequency */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">{t.compoundingFrequency}</label>
                <div className="relative group">
                  <select 
                    value={compoundingFreq} 
                    onChange={e => setCompoundingFreq(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-teal-500 outline-none transition-all appearance-none cursor-pointer text-sm"
                  >
                    <option value={365}>{t.daily}</option>
                    <option value={12}>{t.monthly}</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-teal-500 transition-colors" />
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-dashed border-slate-200 dark:border-slate-800">
                <div className="bg-teal-50 dark:bg-teal-900/20 p-6 rounded-3xl border border-teal-100 dark:border-teal-900/50">
                  <p className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-1">{t.futureValue}</p>
                  <p className="text-3xl font-black text-teal-700 dark:text-teal-300 truncate">
                    {formatCurrency(results.balance)}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-start gap-4">
             <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl">
                <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
             </div>
             <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1">Wealth Tip</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Investing even Rs 100 daily is often more powerful than Rs 3000 monthly due to the consistency and earlier compounding.
                </p>
             </div>
          </div>
        </div>

        {/* Projection Visualization */}
        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
               <div className="flex items-center gap-2 mb-3">
                 <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                    <Target className="w-4 h-4 text-emerald-600" />
                 </div>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.totalInvested}</span>
               </div>
               <p className="text-xl font-black text-slate-800 dark:text-slate-100">{formatCurrency(results.invested)}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
               <div className="flex items-center gap-2 mb-3">
                 <div className="p-1.5 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                    <ArrowUpRight className="w-4 h-4 text-orange-600" />
                 </div>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.interestEarned}</span>
               </div>
               <p className="text-xl font-black text-orange-600 dark:text-orange-400">{formatCurrency(results.interest)}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <BarChart4 className="w-5 h-5 text-teal-500" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t.projection}</h3>
              </div>
            </div>
            
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                  <XAxis 
                    dataKey="year" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    stroke={isDark ? "#64748b" : "#94a3b8"}
                    label={{ value: 'Years', position: 'insideBottom', offset: -5, fontSize: 10, fontWeight: 'bold' }}
                  />
                  <YAxis 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    stroke={isDark ? "#64748b" : "#94a3b8"}
                    tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                      borderRadius: '16px', 
                      border: isDark ? '1px solid #1e293b' : 'none',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                      color: isDark ? '#f1f5f9' : '#1e293b',
                      fontWeight: 'bold'
                    }}
                    formatter={(val: number) => [formatCurrency(val), ""]}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area 
                    name={t.invested}
                    type="monotone" 
                    dataKey="invested" 
                    stroke="#6366f1" 
                    fillOpacity={1} 
                    fill="url(#colorInvested)" 
                    strokeWidth={3}
                  />
                  <Area 
                    name={t.futureValue}
                    type="monotone" 
                    dataKey="balance" 
                    stroke="#14b8a6" 
                    fillOpacity={1} 
                    fill="url(#colorBalance)" 
                    strokeWidth={4}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentTracker;
