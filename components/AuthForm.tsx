
import React, { useState } from 'react';
import { Wallet, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

interface AuthFormProps {
  t: any;
  onLogin: (email: string, pass: string) => Promise<void>;
  onRegister: (name: string, email: string, pass: string) => Promise<void>;
}

const AuthForm: React.FC<AuthFormProps> = ({ t, onLogin, onRegister }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await onLogin(formData.email, formData.password);
      } else {
        await onRegister(formData.name, formData.email, formData.password);
      }
    } catch (err) {
      setError(t.authError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
      <div className="w-full max-w-md">
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-6 duration-700">
          <div className="inline-flex p-4 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-200 dark:shadow-none mb-6">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{t.title}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">{isLogin ? t.welcomeBack : t.createAccount}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none animate-in zoom-in-95 duration-500">
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">{t.fullName}</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    required
                    type="text"
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">{t.email}</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  required
                  type="email"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">{t.password}</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  required
                  type="password"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            {error && <p className="text-rose-500 text-xs font-bold text-center animate-shake">{error}</p>}

            <button
              disabled={loading}
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? t.login : t.register}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors"
            >
              {isLogin ? t.noAccount : t.hasAccount}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
