
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
  const [lang, setLang] = useState<Language>('en');
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

  const generateNotifications = useCallback(async (txs: Transaction[]) => {
    const budgets = await storageService.fetchBudgets();
    const bills = await storageService.fetchBills();
    const now = new Date();
    const currentMonthLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const currentMonthTxs = txs.filter(tx => tx.month === currentMonthLabel);
    const budget = budgets.find(b => b.month === currentMonthLabel);
    const newNotifications: Notification[] = [];

    // 1. Budget Alerts
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

    // 2. Bill Due Date System (7-Day Prioritized Lookahead)
    bills.forEach(bill => {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let dueDate = new Date(now.getFullYear(), now.getMonth(), bill.dueDay);
      
      // Target next month if day has passed
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
      // Sort: highest priority and newest first
      return [...added, ...prev]
        .filter(n => {
          // Cleanup logic: If it's a bill notification, ensure it's still relevant
          if (n.type === 'bill') {
            const billId = n.id.split('-')[1];
            return bills.some(b => b.id === billId);
          }
          return true;
        })
        .slice(0, 30);
    });
  }, [t]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await storageService.fetchTransactions();
      setTransactions(data);
      await generateNotifications(data);
      
      const savedLang = localStorage.getItem('lang');
      if (savedLang) setLang(savedLang as Language);

      const savedCurrency = localStorage.getItem('currency_settings');
      if (savedCurrency) setCurrencySettings(JSON.parse(savedCurrency));
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setIsLoading(false);
    }
  }, [generateNotifications]);

  const onAddTransaction = useCallback(async (data: Transaction) => {
    await storageService.addTransaction(data);
    loadData();
  }, [loadData]);

  const onUpdateTransaction = useCallback(async (id: string, data: Transaction) => {
    await storageService.updateTransaction(id, data);
    loadData();
  }, [loadData]);

  const onDeleteTransaction = useCallback(async (id: string) => {
    if (window.confirm(t.confirmDelete)) {
      await storageService.deleteTransaction(id);
      loadData();
    }
  }, [loadData, t.confirmDelete]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 md:pb-0 font-sans transition-colors duration-300">
      <nav className="hidden md:flex flex-col fixed h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 z-20 no-print transition-colors">
        <div className="flex items-center gap-3 mb-10">
          <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-bold text-lg text-slate-800 dark:text-slate-100 leading-tight">{t.title}</h1>
        </div>

        <div className="space-y-2 flex-grow">
          {[
            { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
            { id: 'analytics', label: t.charts, icon: BarChart3 },
            { id: 'budget', label: t.budgetPerformance, icon: Target },
            { id: 'bills', label: t.bills, icon: CreditCard },
            { id: 'history', label: t.history, icon: History },
          ].map(tab => (
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
          <button 
            onClick={() => setIsDark(!isDark)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {isDark ? t.lightMode : t.darkMode}
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'settings' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <Settings className="w-5 h-5" />
            {t.settings}
          </button>
          <button onClick={() => setLang(lang === 'en' ? 'si' : 'en')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">
            <Globe className="w-5 h-5" />
            {t.language}
          </button>
        </div>
      </nav>

      <header className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-30 no-print transition-colors">
        <div className="flex items-center gap-2">
          <Wallet className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <h1 className="font-bold text-sm text-slate-800 dark:text-slate-100">{t.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsNotificationOpen(true)} className="p-2 relative text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>}
          </button>
          <button onClick={() => setIsDark(!isDark)} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => setActiveTab('settings')} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><Settings className="w-5 h-5"/></button>
        </div>
      </header>

      <div className="hidden md:block fixed top-6 right-6 z-40 no-print">
        <button 
          onClick={() => setIsNotificationOpen(true)}
          className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl dark:shadow-none hover:bg-slate-50 dark:hover:bg-slate-800 transition-all relative group"
        >
          <Bell className="w-6 h-6 text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black h-5 w-5 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      <main className="md:pl-64 min-h-screen">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          {activeTab === 'settings' && (
            <SettingsPage 
              t={t} 
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

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around p-3 z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] no-print transition-colors">
        {[
          { id: 'dashboard', icon: LayoutDashboard },
          { id: 'analytics', icon: BarChart3 },
          { id: 'budget', icon: Target },
          { id: 'bills', icon: CreditCard },
          { id: 'history', icon: History },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === tab.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'}`}>
            <tab.icon className="w-6 h-6" />
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
