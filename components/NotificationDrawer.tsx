
import React from 'react';
import { Notification } from '../types';
import { X, Bell, AlertTriangle, TrendingUp, Calendar, CheckCircle } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onRead: (id: string) => void;
  onReadAll: () => void;
  t: any;
}

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose, notifications, onRead, onReadAll, t }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">{t.notifications}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 gap-3">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-full">
                <Bell className="w-8 h-8 opacity-20" />
              </div>
              <p className="font-bold text-sm italic">{t.noNotifications}</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div 
                key={n.id} 
                onClick={() => onRead(n.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                  n.read 
                    ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-60' 
                    : 'bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20'
                }`}
              >
                {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />}
                <div className="flex gap-4">
                  <div className={`p-2 rounded-xl h-fit ${
                    n.type === 'budget' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' : 
                    n.type === 'bill' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 
                    'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  }`}>
                    {n.type === 'budget' ? <AlertTriangle className="w-4 h-4" /> : 
                     n.type === 'bill' ? <Calendar className="w-4 h-4" /> : 
                     <TrendingUp className="w-4 h-4" />}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{n.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={onReadAll}
              className="w-full py-3 flex items-center justify-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              {t.markAllRead}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDrawer;
