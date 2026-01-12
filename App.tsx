
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, Language, CurrencySettings, Notification, MonthlyBudget, Bill } from './types';
import { translations } from './translations';
import { storageService } from './services/googleSheets';
import Dashboard from './components/Dashboard';
import SettingsPage from './components/SettingsPage';
import NotificationDrawer from './components/NotificationDrawer';
import BillManager from './components/BillManager';
import { Globe, Wallet, LayoutDashboard, History, BarChart3, Target, Settings, Bell, CreditCard, Sun, Moon } from 'lucide-react';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('lang') as Language) || 'en');
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'history' | 'budget' | 'settings' | 'bills'>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [currencySettings, setCurrencySettings] = useState<CurrencySettings>({
    symbol: 'LKR',
    position: 'before'
  });

  const t = translations[lang];

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const formatCurrency = useCallback((amount: number) => {
    const formattedAmount = amount.toLocaleString();
    return currencySettings.position === 'before' 
      ? `${currencySettings.symbol} ${formattedAmount}`
      : `${formattedAmount} ${currencySettings.symbol}`;
  }, [currencySettings]);

  /**
   * Recalculates the entire transaction history to ensure balance continuity.
   * Every record's BF is strictly derived from the previous record's total balance.
   */
  const recalculateChain = useCallback((txs: Transaction[]) => {
    if (txs.length === 0) return [];
    
    // Sort strictly by date, then by timestamp
    const sorted = [...txs].sort((a, b) => {
      const dateDiff = a.date.localeCompare(b.date);
      if (dateDiff !== 0) return dateDiff;
      return (a.timestamp || '').localeCompare(b.timestamp || '');
    });

    const categories = ['groceries', 'vegetables', 'fishEgg', 'chicken', 'houseRent', 'electricity', 'water', 'travel', 'others'];

    let runningBalance = 0;
    return sorted.map((tx, index) => {
      // For the very first entry, we use its own BF if it exists, otherwise 0.
      // For all subsequent entries, the BF is the closing balance (runningBalance) of the previous entry.
      const bf = index === 0 ? Number(tx.broughtForward || 0) : runningBalance;
      
      const income = Number(tx.dailyCash || 0);
      const expense = categories.reduce((sum, cat) => sum + (Number((tx as any)[cat]) || 0), 0);
      const totalBalance = bf + income - expense;
      
      runningBalance = totalBalance;
      
      return {
        ...tx,
        broughtForward: bf,
        totalExpenses: expense,
        totalBalance: totalBalance
      };
    });
  }, []);

  /**
   * Finds the closing balance of the last recorded date BEFORE the target date.
   */
  const getStartingBalance = useCallback((targetDate: string) => {
    if (!transactions || transactions.length === 0) return 0;
    
    const sorted = [...transactions].sort((a, b) => {
      const d = a.date.localeCompare(b.date);
      if (d !== 0) return d;
      return (a.timestamp || '').localeCompare(b.timestamp || '');
    });

    // Find the absolute latest transaction that occurred before the targetDate
    const lastValidEntry = [...sorted].reverse().find(tx => tx.date < targetDate);
    
    if (lastValidEntry) {
      return Number(lastValidEntry.totalBalance || 0);
    }
    
    // If no entries exist before this date, and an entry already exists on this date,
    // we return its Brought Forward value to keep consistency.
    const sameDayEntry = sorted.find(tx => tx.date === targetDate);
    if (sameDayEntry) return Number(sameDayEntry.broughtForward || 0);
    
    return 0;
  }, [transactions]);

  const generateNotifications = useCallback(async (txs: Transaction[]) => {
    const budgets = await storageService.fetchBudgets();
    const bills = await storageService.fetchBills();
    const now = new Date();
    const currentMonthLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const currentMonthTxs = txs.filter(tx => tx.month === currentMonthLabel);
    const budget = budgets.find(b => b.month === currentMonthLabel);
    const newNotifications: Notification[] = [];

    if (budget) {
      const categories = ['groceries', 'vegetables', 'fishEgg', 'chicken', 'houseRent', 'electricity', 'water', 'travel', 'others'];
      categories.forEach(cat => {
        const limit = (budget.limits as any)[cat];
        const spent = currentMonthTxs.reduce((sum, tx) => sum + ((tx as any)[cat] || 0), 0);
        if (limit > 0 && spent / limit >= 0.85) {
          newNotifications.push({
            id: `budget-${cat}-${currentMonthLabel}`,
            type: 'budget',
            title: t.lowBudgetAlert,
            message: t.lowBudgetMsg.replace('{percent}', Math.round((spent/limit)*100).toString()).replace('{category}', (t as any)[cat]),
            timestamp: now.toISOString(),
            read: false,
            priority: spent >= limit ? 'high' : 'medium'
          });
        }
      });
    }

    bills.forEach(bill => {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let dueDate = new Date(now.getFullYear(), now.getMonth(), bill.dueDay);
      if (dueDate < today) {
        dueDate = new Date(now.getFullYear(), now.getMonth() + 1, bill.dueDay);
      }
      const diffTime = dueDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (daysLeft >= 0 && daysLeft <= 7) {
        newNotifications.push({
          id: `bill-${bill.id}-${dueDate.toISOString().split('T')[0]}`,
          type: 'bill',
          title: bill.name,
          message: daysLeft === 0 ? t.dueToday : t.billDueIn.replace('{days}', daysLeft.toString()),
          timestamp: now.toISOString(),
          read: false,
          priority: daysLeft === 0 ? 'high' : (daysLeft <= 3 ? 'medium' : 'low')
        });
      }
    });

    setNotifications(prev => {
      const existingIds = new Set(prev.map(n => n.id));
      const added = newNotifications.filter(n => !existingIds.has(n.id));
      return [...added, ...prev].slice(0, 30);
    });
  }, [t]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await storageService.fetchTransactions();
      const rebalanced = recalculateChain(data);
      setTransactions(rebalanced);
      await generateNotifications(rebalanced);
      
      const savedCurrency = localStorage.getItem('currency_settings');
      if (savedCurrency) setCurrencySettings(JSON.parse(savedCurrency));
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setIsLoading(false);
    }
  }, [generateNotifications, recalculateChain]);

  const onAddTransaction = useCallback(async (data: Transaction) => {
    const freshTransactions = await storageService.fetchTransactions();
    // Search for an existing entry for this specific date
    const existingIndex = freshTransactions.findIndex(tx => tx.date === data.date);
    
    let newList;
    if (existingIndex !== -1) {
      const existing = freshTransactions[existingIndex];
      const categories = ['groceries', 'vegetables', 'fishEgg', 'chicken', 'houseRent', 'electricity', 'water', 'travel', 'others'];
      
      // When merging, we sum everything but keep the original BF to preserve chain integrity
      const merged: Transaction = {
        ...existing,
        dailyCash: Number(existing.dailyCash || 0) + Number(data.dailyCash || 0),
        timestamp: new Date().toISOString() // Update timestamp to reflect newest activity
      };
      
      categories.forEach(cat => {
        (merged as any)[cat] = Number((existing as any)[cat] || 0) + Number((data as any)[cat] || 0);
      });
      
      newList = [...freshTransactions];
      newList[existingIndex] = merged;
    } else {
      // New date - create fresh entry
      newList = [...freshTransactions, { ...data, id: crypto.randomUUID(), timestamp: new Date().toISOString() }];
    }
    
    // Always rebalance the entire chain before saving to ensure any insertion or update propagates correctly
    const rebalanced = recalculateChain(newList);
    await storageService.saveAllTransactions(rebalanced);
    loadData();
  }, [loadData, recalculateChain]);

  const onUpdateTransaction = useCallback(async (id: string, data: Transaction) => {
    const freshTransactions = await storageService.fetchTransactions();
    const updatedList = freshTransactions.map(tx => tx.id === id ? { ...data, id } : tx);
    const rebalanced = recalculateChain(updatedList);
    await storageService.saveAllTransactions(rebalanced);
    loadData();
  }, [loadData, recalculateChain]);

  const onDeleteTransaction = useCallback(async (id: string) => {
    if (window.confirm(t.confirmDelete)) {
      const freshTransactions = await storageService.fetchTransactions();
      const updatedList = freshTransactions.filter(tx => tx.id !== id);
      const rebalanced = recalculateChain(updatedList);
      await storageService.saveAllTransactions(rebalanced);
      loadData();
    }
  }, [loadData, t.confirmDelete, recalculateChain]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'analytics', label: t.charts, icon: BarChart3 },
    { id: 'budget', label: t.budget, icon: Target },
    { id: 'bills', label: t.bills, icon: CreditCard },
    { id: 'history', label: t.history, icon: History },
    { id: 'settings', label: t.settings, icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 md:pb-0 font-sans transition-colors duration-300">
      <nav className="hidden md:flex flex-col fixed h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 z-20 no-print transition-colors">
        <div className="flex items-center gap-3 mb-10">
          <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-bold text-lg text-slate-800 dark:text-slate-100 leading-tight">{t.title}</h1>
        </div>

        <div className="space-y-2 flex-grow">
          {navItems.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === tab.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-auto space-y-2 border-t border-slate-100 dark:border-slate-800 pt-6">
          <button onClick={() => setIsDark(!isDark)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {isDark ? t.lightMode : t.darkMode}
          </button>
          <button onClick={() => setLang(lang === 'en' ? 'si' : 'en')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">
            <Globe className="w-5 h-5" />
            {t.language}
          </button>
        </div>
      </nav>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 py-3 z-50 no-print flex justify-around items-center transition-colors">
        {navItems.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center gap-1 transition-all flex-1 min-w-0 ${activeTab === tab.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}
          >
            <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'scale-110' : 'scale-100'}`} />
            <span className="text-[9px] font-bold uppercase tracking-tight truncate w-full text-center">{tab.label}</span>
          </button>
        ))}
      </nav>

      <header className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between sticky top-0 z-30 no-print transition-colors shadow-sm">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h1 className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate max-w-[150px]">{t.title}</h1>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsNotificationOpen(true)} className="p-2 relative text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <Bell className="w-4 h-4" />
            {notifications.filter(n => !n.read).length > 0 && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>}
          </button>
          <button onClick={() => setIsDark(!isDark)} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <main className="md:pl-64 min-h-screen">
        <div className="max-w-6xl mx-auto p-3 md:p-8">
          {activeTab === 'settings' && (
            <SettingsPage 
              t={t} 
              lang={lang}
              onLanguageChange={setLang}
              settings={currencySettings} 
              isDark={isDark}
              onToggleDark={() => setIsDark(!isDark)}
              onSave={(s) => { setCurrencySettings(s); localStorage.setItem('currency_settings', JSON.stringify(s)); }} 
            />
          )}
          {activeTab === 'bills' && <BillManager t={t} formatCurrency={formatCurrency} transactions={transactions} onRefresh={loadData} />}
          {activeTab !== 'settings' && activeTab !== 'bills' && (
            <Dashboard 
              activeTab={activeTab} 
              setActiveTab={setActiveTab}
              t={t} 
              transactions={transactions} 
              onAdd={onAddTransaction}
              onUpdate={onUpdateTransaction}
              onDelete={onDeleteTransaction}
              onRefresh={loadData}
              isLoading={isLoading}
              formatCurrency={formatCurrency}
              notifications={notifications}
              getStartingBalance={getStartingBalance}
            />
          )}
        </div>
      </main>

      <NotificationDrawer 
        isOpen={isNotificationOpen} 
        onClose={() => setIsNotificationOpen(false)} 
        notifications={notifications}
        onRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? {...n, read: true} : n))}
        onReadAll={() => setNotifications(prev => prev.map(n => ({...n, read: true})))}
        t={t}
      />
    </div>
  );
};

export default App;
