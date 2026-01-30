
import React, { useState, useRef } from 'react';
import { CurrencySettings, Language, Transaction } from '../types';
import { Settings, Save, CheckCircle, Moon, Sun, Globe, Download, Upload, Database, AlertCircle } from 'lucide-react';
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
}

const SettingsPage: React.FC<SettingsPageProps> = ({ t, lang, onLanguageChange, settings, isDark, onToggleDark, onSave, onRefresh }) => {
  const [localSettings, setLocalSettings] = useState<CurrencySettings>(settings);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
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
        
        // Basic validation: must be an array
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

      <div className="max-w-2xl space-y-6">
        {/* Visual Settings Form */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">{t.appearance}</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => !isDark && onToggleDark()}
                  className={`flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all ${isDark ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'}`}
                >
                  <Moon className="w-5 h-5" />
                  <span className="font-bold">{t.darkMode}</span>
                </button>
                <button
                  type="button"
                  onClick={() => isDark && onToggleDark()}
                  className={`flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all ${!isDark ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'}`}
                >
                  <Sun className="w-5 h-5" />
                  <span className="font-bold">{t.lightMode}</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-500" />
                  {t.language} Settings
                </div>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => onLanguageChange('en')}
                  className={`flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all ${lang === 'en' ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'}`}
                >
                  <span className="font-bold">English</span>
                </button>
                <button
                  type="button"
                  onClick={() => onLanguageChange('si')}
                  className={`flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all ${lang === 'si' ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'}`}
                >
                  <span className="font-bold">සිංහල</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t.currencySymbol}</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-indigo-600 dark:text-indigo-400"
                value={localSettings.symbol}
                onChange={(e) => setLocalSettings({ ...localSettings, symbol: e.target.value })}
                placeholder="e.g. $, LKR, Rs."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">{t.currencyPosition}</label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    className="w-5 h-5 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500"
                    name="position"
                    checked={localSettings.position === 'before'}
                    onChange={() => setLocalSettings({ ...localSettings, position: 'before' })}
                  />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{t.positionBefore}</span>
                </label>
                
                <label className="flex items-center gap-3 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    className="w-5 h-5 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500"
                    name="position"
                    checked={localSettings.position === 'after'}
                    onChange={() => setLocalSettings({ ...localSettings, position: 'after' })}
                  />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{t.positionAfter}</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all"
            >
              <Save className="w-5 h-5" />
              {t.saveSettings}
            </button>
          </form>
        </div>

        {/* Backup and Restore Section */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t.backupRestore}</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center justify-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
            >
              <Download className="w-5 h-5 text-indigo-500" />
              {t.exportData}
            </button>
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
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
          <p className="mt-4 text-xs text-slate-400 dark:text-slate-500 italic">
            * Use JSON files to move your data between devices or keep manual backups.
          </p>
        </div>
      </div>

      {showToast && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-3 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-4 z-[100] ${toastType === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {toastType === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-bold">{toastMsg}</span>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
