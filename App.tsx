
import React, { useState, useEffect, useCallback } from 'react';
import { Transaction, Language, CurrencySettings, Notification } from './types';
import { translations } from './translations';
import { storageService } from './services/googleSheets';
import Dashboard from './components/Dashboard';
import SettingsPage from './components/SettingsPage';
import NotificationDrawer from './components/NotificationDrawer';
import BillManager from './components/BillManager';
import AuthForm from './components/AuthForm';
import { Globe, Wallet, LayoutDashboard, History, BarChart3, Target, Settings, Bell, CreditCard, Sun, Moon, LogOut, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<{name: string, email: string} | null>(() => {
    const saved = localStorage.getItem('finance_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('lang') as Language) || 'en');
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'history' | 'budget' | 'settings' | 'bills'>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [currencySettings, setCurrencySettings] = useState<CurrencySettings>(() => {
    const saved = localStorage.getItem('currency_settings');
    return saved ? JSON.parse(saved) : { symbol: 'Rs', position: 'before' };
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

  const handleLogout = () => {
    if (window.confirm(t.logout + "?")) {
      localStorage.removeItem('finance_user');
      setUser(null);
    }
  };

  const handleLogin = async (email: string, pass: string) => {
    const dummyUser = { name: email.split('@')[0], email };
    localStorage.setItem('finance_user', JSON.stringify(dummyUser));
    setUser(dummyUser);
  };

  const handleRegister = async (name: string, email: string, pass: string) => {
    const dummyUser = { name, email };
    localStorage.setItem('finance_user', JSON.stringify(dummyUser));
    setUser(dummyUser);
  };

  const formatCurrency = useCallback((amount: number) => {
    const formattedAmount = amount.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
    return currencySettings.position === 'before' 
      ? `${currencySettings.symbol} ${formattedAmount}`
      : `${formattedAmount} ${currencySettings.symbol}`;
  }, [currencySettings]);

  /**
   * RECALCULATE CHAIN
   * This is the core integrity function. It ensures that every record's "Brought Forward"
   * is strictly the "Total Balance" of the chronologically previous record.
   * This propagates changes across the entire history when any record is edited or inserted.
   */
  const recalculateChain = useCallback((txs: Transaction[]) => {
    if (txs.length === 0) return [];
    
    // Sort primarily by calendar date, then by entry timestamp
    const sorted = [...txs].sort((a, b) => {
      const dateDiff = a.date.localeCompare(b.date);
      if (dateDiff !== 0) return dateDiff;
      return (a.timestamp || '').localeCompare(b.timestamp || '');
    });

    const categories = ['groceries', 'vegetables', 'fishEgg', 'chicken', 'houseRent', 'electricity', 'water', 'travel', 'others'];

    let runningBalance = 0;
    return sorted.map((tx, index) => {
      // The absolute first entry in the database defines the starting BF.
      // Every subsequent record is forced to follow the running balance of history.
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
   * GET STARTING BALANCE
   * Used by the Transaction Form to suggest the opening balance for a specific date.
   * It finds the closing balance (Total Balance) of the immediately preceding record in history.
   */
  const getStartingBalance = useCallback((targetDate: string) => {
    if (!transactions || transactions.length === 0) return 0;
    
    // Sort transactions chronologically
    const sorted = [...transactions].sort((a, b) => {
      const dateDiff = a.date.localeCompare(b.date);
      if (dateDiff !== 0) return dateDiff;
      return (a.timestamp || '').localeCompare(b.timestamp || '');
    });

    // Case 1: If a record already exists for this date, return its current BF (useful for merges)
    const sameDayEntry = sorted.find(tx => tx.date === targetDate);
    if (sameDayEntry) return Number(sameDayEntry.broughtForward || 0);
    
    // Case 2: Find the record with the latest date BEFORE the target date
    const lastValidEntry = [...sorted].reverse().find(tx => tx.date < targetDate);
    
    // Return the closing balance of that preceding day
    if (lastValidEntry) return Number(lastValidEntry.totalBalance || 0);
    
    // Case 3: Earliest record or empty
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
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setIsLoading(false);
    }
  }, [generateNotifications, recalculateChain]);

  const onAddTransaction = useCallback(async (data: Transaction) => {
    setIsSyncing(true);
    // Fetch fresh copy to avoid race conditions with local state
    const freshTransactions = await storageService.fetchTransactions();
    const existingIndex = freshTransactions.findIndex(tx => tx.date === data.date);
    
    let newList;
    if (existingIndex !== -1) {
      // If adding a record for a date that already exists, MERGE the amounts
      const existing = freshTransactions[existingIndex];
      const categories = ['groceries', 'vegetables', 'fishEgg', 'chicken', 'houseRent', 'electricity', 'water', 'travel', 'others'];
      const merged: Transaction = {
        ...existing,
        dailyCash: Number(existing.dailyCash || 0) + Number(data.dailyCash || 0),
        timestamp: new Date().toISOString() // Update timestamp for chronological priority if same date
      };
      categories.forEach(cat => {
        (merged as any)[cat] = Number((existing as any)[cat] || 0) + Number((data as any)[cat] || 0);
      });
      newList = [...freshTransactions];
      newList[existingIndex] = merged;
    } else {
      // Brand new calendar date entry
      newList = [...freshTransactions, { ...data, id: crypto.randomUUID(), timestamp: new Date().toISOString() }];
    }
    
    // CRITICAL: Re-propagate all balances across history to ensure the new data correctly shifts future records
    const rebalanced = recalculateChain(newList);
    await storageService.saveAllTransactions(rebalanced);
    await loadData();
    setIsSyncing(false);
  }, [loadData, recalculateChain]);

  const onUpdateTransaction = useCallback(async (id: string, data: Transaction) => {
    setIsSyncing(true);
    const freshTransactions = await storageService.fetchTransactions();
    const updatedList = freshTransactions.map(tx => tx.id === id ? { ...data, id } : tx);
    // CRITICAL: Re-propagate balances in case this edit changed the closing balance of this day
    const rebalanced = recalculateChain(updatedList);
    await storageService.saveAllTransactions(rebalanced);
    await loadData();
    setIsSyncing(false);
  }, [loadData, recalculateChain]);

  const onDeleteTransaction = useCallback(async (id: string) => {
    if (window.confirm(t.confirmDelete)) {
      setIsSyncing(true);
      const freshTransactions = await storageService.fetchTransactions();
      const updatedList = freshTransactions.filter(tx => tx.id !== id);
      // CRITICAL: Re-propagate balances because removing a day changes the starting point for all next days
      const rebalanced = recalculateChain(updatedList);
      await storageService.saveAllTransactions(rebalanced);
      await loadData();
      setIsSyncing(false);
    }
  }, [loadData, t.confirmDelete, recalculateChain]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  if (!user) {
    return <AuthForm t={t} onLogin={handleLogin} onRegister={handleRegister} />;
  }

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
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-bold rounded-xl transition-all mt-4">
            <LogOut className="w-5 h-5" />
            {t.logout}
          </button>
        </div>
      </nav>

      {/* Syncing Indicator */}
      {isSyncing && (
        <div className="fixed top-4 right-4 z-[100] bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl shadow-xl border border-indigo-100 dark:border-indigo-900 flex items-center gap-3 animate-in fade-in slide-in-from-right duration-300">
          <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />
          <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-tighter">{t.calculating}</span>
        </div>
      )}

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
