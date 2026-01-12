
import React, { useState, useMemo } from 'react';
import { Transaction, MonthlyBudget } from '../types';
import { Edit2, Trash2, FileSpreadsheet, Printer, Search, X, Calendar as CalendarIcon, Filter, PieChart, AlertCircle, TrendingDown } from 'lucide-react';
import * as XLSX from 'xlsx';

interface HistoryTableProps {
  t: any;
  transactions: Transaction[];
  allTransactions?: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
  formatCurrency: (amount: number) => string;
  budgets?: MonthlyBudget[];
}

const HistoryTable: React.FC<HistoryTableProps> = ({ t, transactions, allTransactions = [], onEdit, onDelete, isLoading, formatCurrency, budgets = [] }) => {
  const [stagedSearch, setStagedSearch] = useState('');
  const [stagedStart, setStagedStart] = useState('');
  const [stagedEnd, setStagedEnd] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [activeStart, setActiveStart] = useState('');
  const [activeEnd, setActiveEnd] = useState('');

  const filteredTransactions = useMemo(() => {
    const lowerSearch = activeSearch.toLowerCase().trim();
    // If any filter is active, we search the entire database (allTransactions).
    // Otherwise, we show the month-filtered transactions passed as the main prop.
    const source = (activeSearch || activeStart || activeEnd) ? allTransactions : transactions;
    
    return source.filter(tx => {
      if (activeStart && tx.date < activeStart) return false;
      if (activeEnd && tx.date > activeEnd) return false;
      
      if (lowerSearch) {
        const formattedDate = tx.date.split('-').reverse().join('/');
        const dateMatch = tx.date.includes(lowerSearch) || formattedDate.includes(lowerSearch);
        if (dateMatch) return true;
        
        const categories = [
          { key: 'groceries', label: t.groceries },
          { key: 'vegetables', label: t.vegetables },
          { key: 'fishEgg', label: t.fishEgg },
          { key: 'chicken', label: t.chicken },
          { key: 'houseRent', label: t.houseRent },
          { key: 'electricity', label: t.electricity },
          { key: 'water', label: t.water },
          { key: 'travel', label: t.travel },
          { key: 'others', label: t.others },
        ];
        
        const matchesCategory = categories.some(cat => 
          cat.label.toLowerCase().includes(lowerSearch) && Number((tx as any)[cat.key]) > 0
        );
        if (matchesCategory) return true;
        
        const numericMatch = 
          tx.totalExpenses.toString().includes(lowerSearch) || 
          tx.dailyCash.toString().includes(lowerSearch) || 
          tx.totalBalance.toString().includes(lowerSearch);
        
        return numericMatch;
      }
      return true;
    });
  }, [transactions, allTransactions, activeSearch, activeStart, activeEnd, t]);

  const sortedFiltered = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => 
      a.date.localeCompare(b.date) || (a.timestamp || '').localeCompare(b.timestamp || '')
    );
  }, [filteredTransactions]);

  const summary = useMemo(() => {
    if (sortedFiltered.length === 0) return null;
    
    const totalIncome = sortedFiltered.reduce((sum, tx) => sum + (Number(tx.dailyCash) || 0), 0);
    const totalExpenses = sortedFiltered.reduce((sum, tx) => sum + (Number(tx.totalExpenses) || 0), 0);
    
    const startBF = Number(sortedFiltered[0].broughtForward) || 0;
    const endBalance = startBF + totalIncome - totalExpenses;
    
    const catKeys = ['groceries', 'vegetables', 'fishEgg', 'chicken', 'houseRent', 'electricity', 'water', 'travel', 'others'];
    const catTotals: Record<string, { actual: number, limit: number }> = {};
    
    const monthsInView = new Set(sortedFiltered.map(tx => tx.month));
    const isSingleMonth = monthsInView.size === 1;
    const currentMonthLabel = Array.from(monthsInView)[0];
    const activeBudget = isSingleMonth ? budgets.find(b => b.month === currentMonthLabel) : null;

    catKeys.forEach(key => {
      catTotals[key] = {
        actual: sortedFiltered.reduce((sum, tx) => sum + (Number((tx as any)[key]) || 0), 0),
        limit: activeBudget ? (activeBudget.limits as any)[key] : 0
      };
    });

    const budgetAlerts = isSingleMonth ? catKeys.map(key => {
      const { actual: spent, limit } = catTotals[key];
      const isOver = limit > 0 && spent > limit;
      const progress = limit > 0 ? (spent / limit) * 100 : 0;
      return { key, label: (t as any)[key], spent, limit, isOver, progress };
    }).filter(a => a.isOver || (a.limit > 0 && a.progress >= 85)) : [];

    return {
      startBF,
      totalIncome,
      totalExpenses,
      endBalance,
      isSingleMonth,
      currentMonthLabel,
      catTotals,
      budgetAlerts
    };
  }, [sortedFiltered, budgets, t]);

  const exportToExcel = () => {
    if (sortedFiltered.length === 0) return;
    const workbook = XLSX.utils.book_new();
    
    // 1. Transactions Sheet
    const formattedData = sortedFiltered.map(tx => ({
      [t.date]: tx.date,
      [t.broughtForward]: tx.broughtForward,
      [t.dailyCash]: tx.dailyCash,
      [t.groceries]: tx.groceries,
      [t.vegetables]: tx.vegetables,
      [t.fishEgg]: tx.fishEgg,
      [t.chicken]: tx.chicken,
      [t.houseRent]: tx.houseRent,
      [t.electricity]: tx.electricity,
      [t.water]: tx.water,
      [t.travel]: tx.travel,
      [t.others]: tx.others,
      [t.totalExpenses]: tx.totalExpenses,
      [t.totalBalance]: tx.totalBalance,
    }));
    const ws = XLSX.utils.json_to_sheet(formattedData);
    XLSX.utils.book_append_sheet(workbook, ws, "Transactions");

    // 2. Monthly Summary Sheet (Fixed layout using Array of Arrays)
    if (summary) {
      const summaryAOA = [
        ["FINANCIAL SUMMARY REPORT"],
        ["Generated Date", new Date().toLocaleString()],
        ["Month / Period", summary.isSingleMonth ? summary.currentMonthLabel : "Filtered Range"],
        [],
        ["SUMMARY METRICS", "AMOUNT"],
        [t.broughtForward, summary.startBF],
        [t.totalIncome, summary.totalIncome],
        [t.totalExpenses, summary.totalExpenses],
        [t.totalBalance, summary.endBalance],
        [],
        ["CATEGORY BREAKDOWN", "TOTAL SPENT"],
      ];

      // Fix: Cast val to any or [string, any] to avoid "Property 'actual' does not exist on type 'unknown'" error.
      Object.entries(summary.catTotals).forEach(([key, val]: [string, any]) => {
        summaryAOA.push([(t as any)[key], val.actual]);
      });

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryAOA);
      XLSX.utils.book_append_sheet(workbook, wsSummary, "Monthly Summary");
    }
    
    XLSX.writeFile(workbook, `Finance_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const clearFilters = () => {
    setStagedSearch(''); setStagedStart(''); setStagedEnd('');
    setActiveSearch(''); setActiveStart(''); setActiveEnd('');
  };

  if (isLoading) return <div className="p-12 text-center text-slate-400">Loading records...</div>;

  return (
    <div className="flex flex-col">
      {/* Dynamic Summary Section */}
      {summary && (
        <div className="p-4 md:p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 md:mb-6">
            <div className="flex items-center gap-2">
               <PieChart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
               <h3 className="font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-widest">
                 {summary.isSingleMonth ? `${summary.currentMonthLabel} ${t.summary}` : 'Filtered View Summary'}
               </h3>
            </div>
            
            {summary.budgetAlerts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {summary.budgetAlerts.map((alert, idx) => (
                  <div key={idx} className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${alert.isOver ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30'}`}>
                    <AlertCircle className="w-3 h-3" />
                    {alert.label}: {alert.isOver ? t.overspent : 'Near Limit'}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="bg-white dark:bg-slate-900 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
               <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">{t.broughtForward}</p>
               <p className="text-sm md:text-lg font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(summary.startBF)}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
               <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">{t.totalIncome}</p>
               <div className="flex items-center gap-1 md:gap-2">
                 <TrendingDown className="w-3 md:w-4 h-3 md:h-4 text-emerald-500 rotate-180" />
                 <p className="text-sm md:text-lg font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(summary.totalIncome)}</p>
               </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
               <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">{t.totalExpenses}</p>
               <div className="flex items-center gap-1 md:gap-2">
                 <TrendingDown className="w-3 md:w-4 h-3 md:h-4 text-rose-500" />
                 <p className="text-sm md:text-lg font-black text-rose-600 dark:text-rose-400">{formatCurrency(summary.totalExpenses)}</p>
               </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 md:p-4 rounded-xl md:rounded-2xl border border-indigo-100 dark:border-indigo-900 shadow-sm bg-indigo-50/20 dark:bg-indigo-900/10">
               <p className="text-[10px] font-black text-indigo-400 uppercase mb-1 tracking-wider">{t.totalBalance}</p>
               <p className="text-sm md:text-lg font-black text-indigo-700 dark:text-indigo-300">{formatCurrency(summary.endBalance)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
             {/* Fix: Explicitly type entries to avoid Property 'actual' does not exist on type 'unknown' error. */}
             {Object.entries(summary.catTotals).map(([key, value]: [string, any]) => (
               <div key={key} className="bg-white/50 dark:bg-slate-900/50 p-2 md:p-3 rounded-lg md:rounded-xl border border-slate-100/50 dark:border-slate-800/50">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{(t as any)[key]}</p>
                  <div className="flex flex-col">
                    <p className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300">{formatCurrency(value.actual)}</p>
                    {value.limit > 0 && (
                      <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 mt-0.5">
                        {t.budget}: {formatCurrency(value.limit)}
                      </p>
                    )}
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 space-y-4 no-print transition-colors">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          <div className="lg:col-span-4 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder={t.search} 
              className="w-full pl-11 pr-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-sm shadow-sm" 
              value={stagedSearch} 
              onChange={(e) => setStagedSearch(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && setActiveSearch(stagedSearch)} 
            />
          </div>
          <div className="lg:col-span-5 flex items-center gap-2">
            <div className="flex-1 relative flex items-center bg-white dark:bg-slate-800 rounded-lg md:rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700">
              <CalendarIcon className="w-3.5 h-3.5 text-slate-300 mr-2" />
              <input type="date" className="bg-transparent border-none text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-200 outline-none w-full" value={stagedStart} onChange={(e) => setStagedStart(e.target.value)} />
            </div>
            <span className="text-slate-400 font-bold px-1">→</span>
            <div className="flex-1 relative flex items-center bg-white dark:bg-slate-800 rounded-lg md:rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700">
              <CalendarIcon className="w-3.5 h-3.5 text-slate-300 mr-2" />
              <input type="date" className="bg-transparent border-none text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-200 outline-none w-full" value={stagedEnd} onChange={(e) => setStagedEnd(e.target.value)} />
            </div>
          </div>
          <div className="lg:col-span-3 flex items-end gap-2 md:gap-3 h-full">
            <button 
              onClick={() => { setActiveSearch(stagedSearch); setActiveStart(stagedStart); setActiveEnd(stagedEnd); }} 
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold text-xs md:text-sm hover:bg-indigo-700 py-2.5 md:py-3 rounded-xl md:rounded-2xl transition-all shadow-lg active:scale-95"
            >
              <Filter className="w-3.5 md:w-4 h-3.5 md:h-4" />
              {t.applyFilters}
            </button>
            <button onClick={clearFilters} className="p-2.5 md:p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl md:rounded-2xl transition-all border border-slate-200 dark:border-slate-700">
              <X className="w-4 md:w-5 h-4 md:h-5" />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2 md:gap-3">
             <button onClick={() => window.print()} className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px] md:text-xs hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl transition-all"><Printer className="w-3 md:w-3.5 h-3 md:h-3.5" />{t.printReport}</button>
             <button onClick={exportToExcel} className="flex items-center gap-2 bg-emerald-600 text-white font-bold text-[10px] md:text-xs hover:bg-emerald-700 px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl transition-all"><FileSpreadsheet className="w-3 md:w-3.5 h-3 md:h-3.5" />{t.exportExcel}</button>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[1400px] border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-200 dark:border-slate-800">
              <th className="px-6 py-4">{t.date}</th>
              <th className="px-6 py-4">{t.broughtForward}</th>
              <th className="px-6 py-4">{t.dailyCash}</th>
              <th className="px-4 py-4">{t.groceries}</th>
              <th className="px-4 py-4">{t.vegetables}</th>
              <th className="px-4 py-4">{t.fishEgg}</th>
              <th className="px-4 py-4">{t.chicken}</th>
              <th className="px-4 py-4">{t.houseRent}</th>
              <th className="px-4 py-4">{t.electricity}</th>
              <th className="px-4 py-4">{t.water}</th>
              <th className="px-4 py-4">{t.travel}</th>
              <th className="px-4 py-4">{t.others}</th>
              <th className="px-6 py-4">{t.totalExpenses}</th>
              <th className="px-6 py-4 bg-indigo-50/30 dark:bg-indigo-900/10 text-indigo-700 dark:text-indigo-400">{t.totalBalance}</th>
              <th className="px-6 py-4 text-center no-print">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {sortedFiltered.map((tx) => (
              <tr key={tx.id || tx.timestamp} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">{tx.date.split('-').reverse().join('/')}</td>
                <td className="px-6 py-4 font-bold text-indigo-500 dark:text-indigo-400">{formatCurrency(Number(tx.broughtForward))}</td>
                <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(Number(tx.dailyCash))}</td>
                <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{Number(tx.groceries || 0).toLocaleString()}</td>
                <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{Number(tx.vegetables || 0).toLocaleString()}</td>
                <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{Number(tx.fishEgg || 0).toLocaleString()}</td>
                <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{Number(tx.chicken || 0).toLocaleString()}</td>
                <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{Number(tx.houseRent || 0).toLocaleString()}</td>
                <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{Number(tx.electricity || 0).toLocaleString()}</td>
                <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{Number(tx.water || 0).toLocaleString()}</td>
                <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{Number(tx.travel || 0).toLocaleString()}</td>
                <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{Number(tx.others || 0).toLocaleString()}</td>
                <td className="px-6 py-4 font-bold text-rose-500 dark:text-rose-400">{formatCurrency(Number(tx.totalExpenses))}</td>
                <td className="px-6 py-4 font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-900/5">{formatCurrency(Number(tx.totalBalance))}</td>
                <td className="px-6 py-4 no-print whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => onEdit(tx)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => tx.id && onDelete(tx.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sortedFiltered.length === 0 && (
          <div className="p-20 text-center flex flex-col items-center gap-4 text-slate-400">
             <Filter className="w-12 h-12 opacity-10" />
             <p className="font-bold italic">{t.noResults}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryTable;
