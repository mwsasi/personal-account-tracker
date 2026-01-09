
import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { Edit2, Trash2, FileSpreadsheet, Printer, Search, X, Calendar as CalendarIcon, Filter, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface HistoryTableProps {
  t: any;
  transactions: Transaction[];
  allTransactions?: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
  formatCurrency: (amount: number) => string;
}

const HistoryTable: React.FC<HistoryTableProps> = ({ t, transactions, allTransactions, onEdit, onDelete, isLoading, formatCurrency }) => {
  const [stagedSearch, setStagedSearch] = useState('');
  const [stagedStart, setStagedStart] = useState('');
  const [stagedEnd, setStagedEnd] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [activeStart, setActiveStart] = useState('');
  const [activeEnd, setActiveEnd] = useState('');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (activeStart && tx.date < activeStart) return false;
      if (activeEnd && tx.date > activeEnd) return false;
      if (activeSearch) {
        const lowerSearch = activeSearch.toLowerCase();
        if (tx.date.includes(activeSearch)) return true;
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
        if (tx.totalExpenses.toString().includes(activeSearch)) return true;
        if (tx.dailyCash.toString().includes(activeSearch)) return true;
        return false;
      }
      return true;
    });
  }, [transactions, activeSearch, activeStart, activeEnd, t]);
  
  const formatForExcel = (data: Transaction[]) => {
    return data.map(tx => ({
      [t.date]: tx.date,
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
  };

  const exportAllToExcel = () => {
    const dataToExport = allTransactions || transactions;
    if (dataToExport.length === 0) return;
    const workbook = XLSX.utils.book_new();
    const sortedData = [...dataToExport].sort((a,b) => a.date.localeCompare(b.date));
    const fullData = formatForExcel(sortedData);
    const wsFull = XLSX.utils.json_to_sheet(fullData);
    XLSX.utils.book_append_sheet(workbook, wsFull, "Transaction Details");
    const monthlySummary: any[] = [];
    const months = [...new Set(sortedData.map(tx => tx.month))];
    months.forEach(m => {
      const txs = sortedData.filter(tx => tx.month === m);
      const sortedTxs = [...txs].sort((a,b) => a.date.localeCompare(b.date));
      const firstInMonth = sortedTxs[0];
      const monthBF = firstInMonth ? Number(firstInMonth.broughtForward) : 0;
      const monthIncome = txs.reduce((acc, curr) => acc + (Number(curr.dailyCash) || 0), 0) + monthBF;
      const monthSpent = txs.reduce((acc, curr) => acc + (Number(curr.totalExpenses) || 0), 0);
      
      monthlySummary.push({
        [t.month]: m,
        [t.totalIncome]: monthIncome,
        [t.totalExpenses]: monthSpent,
        [t.totalBalance]: monthIncome - monthSpent
      });
    });
    const wsSummary = XLSX.utils.json_to_sheet(monthlySummary);
    XLSX.utils.book_append_sheet(workbook, wsSummary, "Monthly Summary");
    XLSX.writeFile(workbook, `Finance_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handlePrint = () => { window.print(); };
  const applyFilters = () => {
    setActiveSearch(stagedSearch);
    setActiveStart(stagedStart);
    setActiveEnd(stagedEnd);
  };
  const clearFilters = () => {
    setStagedSearch(''); setStagedStart(''); setStagedEnd('');
    setActiveSearch(''); setActiveStart(''); setActiveEnd('');
  };

  if (isLoading) return <div className="p-12 text-center text-slate-400 dark:text-slate-600">Loading records...</div>;

  const sortedFiltered = [...filteredTransactions].sort((a, b) => a.date.localeCompare(b.date));
  const firstTx = sortedFiltered[0];
  const initialBF = firstTx ? (Number(firstTx.broughtForward) || 0) : 0;
  const totalCashIn = filteredTransactions.reduce((s, tx) => s + (Number(tx.dailyCash) || 0), 0);
  const totalIncome = initialBF + totalCashIn;
  const totalOut = filteredTransactions.reduce((s, tx) => s + (Number(tx.totalExpenses) || 0), 0);
  const selectedMonth = transactions[0]?.month || '';

  return (
    <div className="flex flex-col">
      <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 space-y-4 no-print transition-colors">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Keyword Search</label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input type="text" placeholder={t.search} className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-sm shadow-sm" value={stagedSearch} onChange={(e) => setStagedSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyFilters()} />
              {stagedSearch && <button onClick={() => setStagedSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"><X className="w-3.5 h-3.5 text-slate-400" /></button>}
            </div>
          </div>
          <div className="lg:col-span-5">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">{t.date} Range</label>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-1 shadow-sm">
              <div className="flex-1 relative flex items-center bg-white dark:bg-slate-800 rounded-xl px-3 py-2 border border-slate-100 dark:border-slate-700/50">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase absolute -top-2 left-2 bg-white dark:bg-slate-800 px-1">From</span>
                <CalendarIcon className="w-3.5 h-3.5 text-slate-300 mr-2" />
                <input type="date" className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-200 outline-none w-full" value={stagedStart} onChange={(e) => setStagedStart(e.target.value)} />
              </div>
              <span className="text-slate-400 font-bold px-1">→</span>
              <div className="flex-1 relative flex items-center bg-white dark:bg-slate-800 rounded-xl px-3 py-2 border border-slate-100 dark:border-slate-700/50">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase absolute -top-2 left-2 bg-white dark:bg-slate-800 px-1">To</span>
                <CalendarIcon className="w-3.5 h-3.5 text-slate-300 mr-2" />
                <input type="date" className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-200 outline-none w-full" value={stagedEnd} onChange={(e) => setStagedEnd(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="lg:col-span-3 flex items-end gap-3 h-full">
            <button onClick={applyFilters} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 py-3 rounded-2xl transition-all shadow-lg shadow-indigo-100 dark:shadow-none active:scale-95"><Filter className="w-4 h-4" />{t.applyFilters}</button>
            <button onClick={clearFilters} disabled={!stagedSearch && !stagedStart && !stagedEnd && !activeSearch && !activeStart && !activeEnd} className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-700" title={t.clearFilters}><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex gap-2">
            {(activeSearch || activeStart || activeEnd) && <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-800 animate-in fade-in zoom-in-95"><CheckCircle className="w-3 h-3" />Filters Applied</div>}
          </div>
          <div className="flex gap-3">
            <button onClick={handlePrint} className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95"><Printer className="w-3.5 h-3.5" />{t.printReport}</button>
            <button onClick={exportAllToExcel} className="flex items-center gap-2 bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-100 dark:shadow-none active:scale-95"><FileSpreadsheet className="w-3.5 h-3.5" />{t.exportExcel}</button>
          </div>
        </div>
      </div>

      <div className="print-only mb-6 text-center">
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <h2 className="text-xl text-slate-600">{selectedMonth}</h2>
        <div className="flex justify-center gap-8 mt-4 border-y py-2">
           <div><span className="font-bold">{t.totalIncome}:</span> {formatCurrency(totalIncome)}</div>
           <div><span className="font-bold">{t.totalSpent}:</span> {formatCurrency(totalOut)}</div>
           <div><span className="font-bold">{t.totalBalance}:</span> {formatCurrency(totalIncome - totalOut)}</div>
        </div>
      </div>

      <div className="overflow-x-auto transition-colors">
        <table className="w-full text-left min-w-[1200px] border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-200 dark:border-slate-800">
              <th className="px-6 py-4 border-r border-slate-100 dark:border-slate-800">{t.date}</th>
              <th className="px-6 py-4 border-r border-slate-100 dark:border-slate-800">{t.dailyCash}</th>
              <th className="px-6 py-4">{t.groceries}</th>
              <th className="px-6 py-4">{t.vegetables}</th>
              <th className="px-6 py-4">{t.fishEgg}</th>
              <th className="px-6 py-4">{t.chicken}</th>
              <th className="px-6 py-4">{t.houseRent}</th>
              <th className="px-6 py-4">{t.electricity}</th>
              <th className="px-6 py-4">{t.water}</th>
              <th className="px-6 py-4">{t.travel}</th>
              <th className="px-6 py-4">{t.others}</th>
              <th className="px-6 py-4 border-l border-slate-100 dark:border-slate-800">{t.totalExpenses}</th>
              <th className="px-6 py-4 bg-indigo-50/30 dark:bg-indigo-900/10 text-indigo-700 dark:text-indigo-400 border-l border-slate-100 dark:border-slate-800">{t.totalBalance}</th>
              <th className="px-6 py-4 text-center no-print">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {sortedFiltered.map((tx) => (
              <tr key={tx.id || tx.timestamp} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap border-r border-slate-50 dark:border-slate-800">{tx.date.split('-').reverse().join('/')}</td>
                <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400 border-r border-slate-50 dark:border-slate-800">{formatCurrency(Number(tx.dailyCash))}</td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{Number(tx.groceries || 0).toLocaleString()}</td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{Number(tx.vegetables || 0).toLocaleString()}</td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{Number(tx.fishEgg || 0).toLocaleString()}</td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{Number(tx.chicken || 0).toLocaleString()}</td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{Number(tx.houseRent || 0).toLocaleString()}</td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{Number(tx.electricity || 0).toLocaleString()}</td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{Number(tx.water || 0).toLocaleString()}</td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{Number(tx.travel || 0).toLocaleString()}</td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{Number(tx.others || 0).toLocaleString()}</td>
                <td className="px-6 py-4 font-bold text-rose-500 dark:text-rose-400 border-l border-slate-50 dark:border-slate-800">{formatCurrency(Number(tx.totalExpenses))}</td>
                <td className="px-6 py-4 font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-900/5 border-l border-slate-50 dark:border-slate-800">{formatCurrency(Number(tx.totalBalance))}</td>
                <td className="px-6 py-4 no-print whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => onEdit(tx)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => tx.id && onDelete(tx.id)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sortedFiltered.length === 0 && (
          <div className="p-20 text-center flex flex-col items-center gap-3">
             <Filter className="w-12 h-12 text-slate-200 dark:text-slate-800" />
             <p className="text-slate-400 dark:text-slate-600 font-bold italic">{t.noResults}</p>
             <button onClick={clearFilters} className="text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:underline">{t.clearFilters}</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryTable;
