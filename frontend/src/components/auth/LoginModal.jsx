import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, X, ShieldAlert, RefreshCw } from 'lucide-react';
import useAuth from '../../hooks/useAuth';

export const LoginModal = ({ isOpen, onClose, onSwitchToRegister }) => {
  const { login, error, setError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      if (onClose) onClose();
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 md:p-8 shadow-2xl space-y-6 relative">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="space-y-1">
          <h2 className="text-xl font-black text-white tracking-tight">Sync Portal Credentials</h2>
          <p className="text-xs text-slate-400">Unlock your gamer telemetry baseline profile.</p>
        </div>

        {error && (
          <div className="text-xs px-4 py-3 rounded-xl flex items-start gap-3 border bg-red-500/10 border-red-500/30 text-red-400">
            <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="e.g. gamer@gradegamer.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-white focus:border-[#00b4d8] focus:ring-1 focus:ring-[#00b4d8] transition-all text-xs font-medium"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="login-password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-white focus:border-[#00b4d8] focus:ring-1 focus:ring-[#00b4d8] transition-all text-xs font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-cyan-400 transition-colors focus:outline-none bg-transparent border-none cursor-pointer flex items-center justify-center"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-slate-400 hover:text-cyan-400 transition-colors" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-400 hover:text-cyan-400 transition-colors" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00b4d8] hover:bg-[#00d8f6] text-slate-950 font-bold py-3 px-4 rounded-xl transition-all select-none active:scale-[0.99] border-none cursor-pointer uppercase tracking-wider text-xs font-black shadow-lg shadow-[#00b4d8]/10 flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Authenticate Session'}
          </button>
        </form>

        {onSwitchToRegister && (
          <div className="text-center pt-2">
            <p className="text-xs text-slate-400">
              New to GradeGamer?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-[#00b4d8] hover:underline font-bold bg-transparent border-none cursor-pointer"
              >
                Create an Account
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginModal;
