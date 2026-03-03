
import React, { useState, useRef } from 'react';
import { CurrencySettings, Language, Transaction } from '../types';
import { Settings, Save, CheckCircle, Moon, Sun, Globe, Download, Upload, Database, AlertCircle, Cloud, CloudUpload, CloudDownload, RefreshCw, User, LogOut, Loader2, Link } from 'lucide-react';
import { storageService } from '../services/googleSheets';

interface SettingsPageProps {
  t: any;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  settings: CurrencySettings;
  isDark: boolean;
  onToggleDark: () => void;
  onSave: (settings: CurrencySettings) => void;
  onRefresh?: () => void;
  user: { name: string, email: string } | null;
  onLogout: () => Promise<void>;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ t, lang, onLanguageChange, settings, isDark, onToggleDark, onSave, onRefresh, user, onLogout }) => {
  const [localSettings, setLocalSettings] = useState<CurrencySettings>(settings);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    const result = await storageService.testConnection();
    triggerToast(result.message, result.success ? 'success' : 'error');
    setIsTesting(false);
  };

  const handleLogoutClick = async () => {
    setIsLoggingOut(true);
    try {
      await onLogout();
    } catch {
      setIsLoggingOut(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localSettings);
    triggerToast(t.settingsSaved);
  };

  const handleExport = async () => {
    try {
      const transactions = await storageService.fetchTransactions();
      const dataStr = JSON.stringify(transactions, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `finance_backup_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      triggerToast(t.exportSuccess);
    } catch (error) {
      console.error("Export failed", error);
      triggerToast("Export failed", "error");
    }
  };

  const handleCloudPush = async () => {
    setIsCloudSyncing(true);
    try {
      const transactions = await storageService.fetchTransactions();
      const success = await storageService.saveAllTransactions(transactions);
      if (success) {
        triggerToast(t.syncCompleted);
      } else {
        throw new Error("Sync failed");
      }
    } catch (error) {
      triggerToast("Cloud Sync failed. Check network.", "error");
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleCloudFetch = async () => {
    setIsCloudSyncing(true);
    try {
      await storageService.fetchTransactions();
      triggerToast(t.fetchCompleted);
      if (onRefresh) onRefresh();
    } catch (error) {
      triggerToast("Failed to fetch from cloud.", "error");
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm(t.importConfirm)) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as Transaction[];
        
        if (!Array.isArray(data)) throw new Error("Invalid format");
        
        await storageService.saveAllTransactions(data);
        triggerToast(t.importSuccess);
        if (onRefresh) onRefresh();
      } catch (err) {
        console.error("Import failed", err);
        triggerToast(t.importError, "error");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
          <Settings className="w-6 h-6 text-indigo-700 dark:text-indigo-400" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{t.settings}</h2>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Account Section */}
        {user && (
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <User className="w-32 h-32 text-indigo-500" />
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-100 dark:shadow-none">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">{user.name}</h3>
                  <p className="text-sm font-bold text-slate-400 dark:text-slate-500">{user.email}</p>
                </div>
              </div>
              <button 
                onClick={handleLogoutClick}
                disabled={isLoggingOut}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                {t.logout}
              </button>
            </div>
          </div>
        )}

        {/* Appearance and Language */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">{t.appearance}</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => !isDark && onToggleDark()}
                  className={`flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all ${isDark ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 shadow-inner' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'}`}
                >
                  <Moon className="w-5 h-5" />
                  <span className="font-bold">{t.darkMode}</span>
                </button>
                <button
                  type="button"
                  onClick={() => isDark && onToggleDark()}
                  className={`flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all ${!isDark ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 shadow-inner' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'}`}
                >
                  <Sun className="w-5 h-5" />
                  <span className="font-bold">{t.lightMode}</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">{t.language}</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => onLanguageChange('en')}
                  className={`flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all ${lang === 'en' ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 shadow-inner' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'}`}
                >
                  <span className="font-bold">English</span>
                </button>
                <button
                  type="button"
                  onClick={() => onLanguageChange('si')}
                  className={`flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all ${lang === 'si' ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 shadow-inner' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'}`}
                >
                  <span className="font-bold">සිංහල</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 pl-1">{t.currencySymbol}</label>
                <input
                  type="text"
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-black text-indigo-600 dark:text-indigo-400"
                  value={localSettings.symbol}
                  onChange={(e) => setLocalSettings({ ...localSettings, symbol: e.target.value })}
                  placeholder="e.g. $, LKR, Rs."
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 pl-1">{t.currencyPosition}</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setLocalSettings({ ...localSettings, position: 'before' })}
                    className={`flex-1 p-4 rounded-2xl border font-bold text-xs transition-all ${localSettings.position === 'before' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500'}`}
                  >
                    {t.positionBefore}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocalSettings({ ...localSettings, position: 'after' })}
                    className={`flex-1 p-4 rounded-2xl border font-bold text-xs transition-all ${localSettings.position === 'after' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500'}`}
                  >
                    {t.positionAfter}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all"
            >
              <Save className="w-5 h-5" />
              {t.saveSettings}
            </button>
          </form>
        </div>

        {/* Cloud Sync Section */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900 shadow-sm transition-colors overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <Cloud className="w-32 h-32 text-indigo-500" />
          </div>
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                <Cloud className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">{t.cloudBackup}</h3>
            </div>
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-800 transition-all disabled:opacity-50"
            >
              {isTesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link className="w-3 h-3" />}
              Test Connection
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              disabled={isCloudSyncing}
              onClick={handleCloudPush}
              className="group flex flex-col items-center justify-center gap-4 p-8 bg-indigo-50/50 dark:bg-indigo-950/20 border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-3xl text-indigo-700 dark:text-indigo-300 transition-all hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300 active:scale-95 disabled:opacity-50"
            >
              {isCloudSyncing ? <RefreshCw className="w-8 h-8 animate-spin" /> : <CloudUpload className="w-8 h-8 group-hover:-translate-y-1 transition-transform" />}
              <div className="text-center">
                <span className="block font-black uppercase tracking-widest text-[10px] mb-1">{t.pushToCloud}</span>
                <span className="text-[9px] font-bold text-indigo-400 uppercase opacity-70">Update Spreadsheet</span>
              </div>
            </button>
            
            <button
              type="button"
              disabled={isCloudSyncing}
              onClick={handleCloudFetch}
              className="group flex flex-col items-center justify-center gap-4 p-8 bg-teal-50/50 dark:bg-teal-950/20 border-2 border-dashed border-teal-200 dark:border-teal-800 rounded-3xl text-teal-700 dark:text-teal-300 transition-all hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:border-teal-300 active:scale-95 disabled:opacity-50"
            >
              {isCloudSyncing ? <RefreshCw className="w-8 h-8 animate-spin" /> : <CloudDownload className="w-8 h-8 group-hover:translate-y-1 transition-transform" />}
              <div className="text-center">
                <span className="block font-black uppercase tracking-widest text-[10px] mb-1">{t.fetchFromCloud}</span>
                <span className="text-[9px] font-bold text-teal-400 uppercase opacity-70">Download Latest</span>
              </div>
            </button>
          </div>
        </div>

        {/* Local JSON Backup */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <Database className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </div>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">{t.backupRestore} (Local)</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center justify-center gap-3 p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
            >
              <Download className="w-5 h-5 text-indigo-500" />
              {t.exportData}
            </button>
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-3 p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
            >
              <Upload className="w-5 h-5 text-emerald-500" />
              {t.importData}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".json" 
              onChange={handleImport} 
            />
          </div>
          <p className="mt-6 text-[10px] font-bold text-slate-400 dark:text-slate-500 italic uppercase text-center tracking-tight">
            * Use JSON files for offline storage or to move data between different browsers.
          </p>
        </div>
      </div>

      {showToast && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 px-8 py-4 rounded-[2rem] shadow-2xl animate-in fade-in slide-in-from-bottom-6 z-[100] ${toastType === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {toastType === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-black uppercase tracking-widest text-xs">{toastMsg}</span>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
