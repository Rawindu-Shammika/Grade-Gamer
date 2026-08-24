import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, X, ShieldAlert, RefreshCw } from 'lucide-react';
import useAuth from '../../hooks/useAuth';

export const RegisterModal = ({ isOpen, onClose, onSwitchToLogin, onRegistered }) => {
  const { register, error, setError } = useAuth();
  const [fullName, setFullName] = useState('');
  const [inGameName, setInGameName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const ESPORTS_CATEGORIES = [
    'SIM RACING',
    'FPS SHOOTERS',
    'MOBA',
    'BATTLE ROYALE',
    'SPORTS GAMING'
  ];
  const [selectedCategories, setSelectedCategories] = useState(['FPS SHOOTERS']);

  if (!isOpen) return null;

  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedCategories.length === 0) {
      if (setError) setError('Please select at least one esports category.');
      return;
    }
    if (confirmPassword && password !== confirmPassword) {
      if (setError) setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const metadata = {
        fullName,
        gamerTag: inGameName,
        full_name: fullName,
        in_game_name: inGameName,
        phone,
        address,
        esports_categories: selectedCategories,
        primary_game: selectedCategories[0] || 'General'
      };
      const signedUpUser = await register(email, password, metadata);
      if (signedUpUser && onRegistered) {
        onRegistered(signedUpUser);
      }
      if (onClose) onClose();
    } catch (err) {
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 md:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
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
          <h2 className="text-xl font-black text-white tracking-tight">Register Onboarding</h2>
          <p className="text-xs text-slate-400">Establish metrics and register secure keys.</p>
        </div>

        {error && (
          <div className="text-xs px-4 py-3 rounded-xl flex items-start gap-3 border bg-red-500/10 border-red-500/30 text-red-400">
            <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Alex Morgan"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-white focus:border-[#00b4d8] focus:ring-1 focus:ring-[#00b4d8] transition-all text-xs font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">In-Game Name (IGN)</label>
            <input
              type="text"
              required
              placeholder="e.g. Phoenix_V"
              value={inGameName}
              onChange={(e) => setInGameName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-white focus:border-[#00b4d8] focus:ring-1 focus:ring-[#00b4d8] transition-all text-xs font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-white focus:border-[#00b4d8] focus:ring-1 focus:ring-[#00b4d8] transition-all text-xs font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="register-password"
                required
                placeholder="Create a secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 pr-12 transition-all text-xs font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-cyan-400 transition-colors focus:outline-none bg-transparent border-none cursor-pointer flex items-center justify-center"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-slate-400 hover:text-cyan-400" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-400 hover:text-cyan-400" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Telephone Number</label>
            <input
              type="tel"
              required
              placeholder="+1 234 567 8900"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-white focus:border-[#00b4d8] focus:ring-1 focus:ring-[#00b4d8] transition-all text-xs font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Residential Address / City</label>
            <input
              type="text"
              required
              placeholder="City, Country"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-white focus:border-[#00b4d8] focus:ring-1 focus:ring-[#00b4d8] transition-all text-xs font-medium"
            />
          </div>

          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                SELECT ESPORTS CATEGORIES
              </label>
              <span className="text-[10px] font-mono text-cyan-400 font-bold">
                {selectedCategories.length} SELECTED
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {ESPORTS_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-300'
                        : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00b4d8] hover:bg-[#00d8f6] text-slate-950 font-bold py-3 px-4 rounded-xl transition-all select-none active:scale-[0.99] border-none cursor-pointer uppercase tracking-wider text-xs font-black shadow-lg shadow-[#00b4d8]/10 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Complete Registration & Mint Keys'}
          </button>
        </form>

        {onSwitchToLogin && (
          <div className="text-center pt-2">
            <p className="text-xs text-slate-400">
              Already verified?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-[#00b4d8] hover:underline font-bold bg-transparent border-none cursor-pointer"
              >
                Sign In
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterModal;
