
import React, { useState } from 'react';
import { Wallet, Mail, Lock, User, ArrowRight, Loader2, AlertCircle, Eye, EyeOff, CheckCircle2, RefreshCw } from 'lucide-react';
import { supabase } from '../supabaseClient.ts';

interface AuthFormProps {
  t: any;
  onLogin: (email: string, pass: string) => Promise<void>;
  onRegister: (name: string, email: string, pass: string) => Promise<void>;
}

const AuthForm: React.FC<AuthFormProps> = ({ t, onLogin, onRegister }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showResend, setShowResend] = useState(false);

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email) {
      setError("Please enter your email address first.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
      });
      if (error) throw error;
      setSuccess("Verification email has been resent. Please check your inbox!");
      setShowResend(false);
    } catch (err: any) {
      setError(err.message || "Failed to resend verification email.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setShowResend(false);
    
    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!isLogin && !formData.name.trim()) {
      setError("Full name is required.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await onLogin(formData.email, formData.password);
      } else {
        await onRegister(formData.name, formData.email, formData.password);
        
        // After successful registration:
        setSuccess("Your account has been created! Please check your email and click the verification link before logging in.");
        setFormData(prev => ({ ...prev, password: '' }));
        setIsLogin(true);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let errMsg = err.message || "Authentication failed. Please try again.";
      
      // Friendly handling for common Supabase errors
      if (errMsg === "Invalid login credentials") {
        errMsg = "The email or password you entered is incorrect. Please try again.";
      } else if (errMsg === "Email not confirmed") {
        errMsg = "Your email address has not been verified yet. Please check your inbox for the confirmation link.";
        setShowResend(true);
      }
      
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setShowResend(false);
    setFormData(prev => ({ ...prev, password: '' }));
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
          {error && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50 rounded-2xl animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-tight mb-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> Error
              </div>
              <p className="text-xs text-rose-700 dark:text-rose-300 font-semibold leading-relaxed">
                {error}
              </p>
              {showResend && (
                <button 
                  onClick={handleResendVerification}
                  className="mt-3 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest hover:underline"
                >
                  <RefreshCw className="w-3 h-3" /> Resend verification email
                </button>
              )}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl flex items-start gap-3 text-emerald-600 dark:text-emerald-400 text-xs font-bold leading-relaxed animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> 
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">{t.fullName}</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    required type="text"
                    name="name"
                    autoComplete="name"
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold"
                    placeholder="John Doe" value={formData.name}
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
                  required type="email"
                  name="email"
                  autoComplete="email"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold"
                  placeholder="name@example.com" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">{t.password}</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  required type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold"
                  placeholder="••••••••" value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button 
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 transition-colors">{t.rememberMe}</span>
              </label>
            </div>

            <button
              disabled={loading || googleLoading} type="submit"
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

          <div className="mt-6 mb-6 flex items-center gap-4">
            <div className="flex-grow h-px bg-slate-100 dark:bg-slate-800" />
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t.or}</span>
            <div className="flex-grow h-px bg-slate-100 dark:bg-slate-800" />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-3.5 rounded-2xl font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50 active:scale-[0.98] disabled:opacity-70 shadow-sm"
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {t.continueWithGoogle}
              </>
            )}
          </button>

          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              onClick={toggleAuthMode}
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
