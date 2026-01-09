
import React, { useState } from 'react';
import { CurrencySettings } from '../types';
import { Settings, Save, CheckCircle, Moon, Sun, Monitor } from 'lucide-react';

interface SettingsPageProps {
  t: any;
  settings: CurrencySettings;
  isDark: boolean;
  onToggleDark: () => void;
  onSave: (settings: CurrencySettings) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ t, settings, isDark, onToggleDark, onSave }) => {
  const [localSettings, setLocalSettings] = useState<CurrencySettings>(settings);
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localSettings);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
          <Settings className="w-6 h-6 text-indigo-700 dark:text-indigo-400" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{t.settings}</h2>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm max-w-2xl transition-colors">
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

      {showToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle className="w-5 h-5" />
          <span className="font-bold">{t.settingsSaved}</span>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
