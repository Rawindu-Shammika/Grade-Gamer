import React, { useState } from 'react';
import useAuth from './hooks/useAuth';
import HomeDashboard from './components/dashboard/HomeDashboard';
import Home from './pages/Home';
import RootLayout from './layouts/RootLayout';
import VerifiedProfile from './pages/VerifiedProfile';
import PeerReviews from './pages/PeerReviews';
import RosterManagement from './pages/RosterManagement';
import { 
  Mail, 
  Lock, 
  User as UserIcon, 
  Gamepad2, 
  BookOpen, 
  Check, 
  ShieldAlert
} from 'lucide-react';

function App() {
  const { user, loading, error, login, register, logout, setError } = useAuth();
  
  // View control: 'home' | 'auth' | 'dashboard'
  const [view, setView] = useState('home');
  
  // Tab control: 'signin' | 'signup'
  const [activeTab, setActiveTab] = useState('signin');

  // Auto route transitions
  React.useEffect(() => {
    if (user) {
      setView('dashboard');
    } else {
      setView('home');
    }
  }, [user]);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Registration form state
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    email: '',
    password: '',
    eduLevel: 'Undergraduate',
    institution: '',
    gamerTag: '',
    titles: []
  });

  const handleTitleCheckboxChange = (title) => {
    setRegisterForm(prev => {
      const titles = prev.titles.includes(title)
        ? prev.titles.filter(t => t !== title)
        : [...prev.titles, title];
      return { ...prev, titles };
    });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(loginEmail, loginPassword);
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const metadata = {
        fullName: registerForm.fullName,
        eduLevel: registerForm.eduLevel,
        institution: registerForm.institution,
        gamerTag: registerForm.gamerTag,
        titles: registerForm.titles
      };
      await register(registerForm.email, registerForm.password, metadata);
      setError('Registration successful! Please check your email inbox to verify your account before logging in.');
      setActiveTab('signin');
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  // Helper styles
  const canvasBgClass = 'bg-[#0b0f19] text-[#f8fafc]';
  const cardClass = 'bg-slate-900/50 backdrop-blur-xl border border-white/10 shadow-2xl';
  const inputClass = 'w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-white focus:border-[#00b4d8] focus:ring-1 focus:ring-[#00b4d8] transition-all text-xs font-medium';

  if (loading) {
    return (
      <div className="bg-[#0b0f19] min-h-screen w-full flex flex-col items-center justify-center space-y-6 text-[#f8fafc] font-sans relative overflow-hidden animate-pulse">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg shadow-cyan-500/5">
          <Gamepad2 className="w-6 h-6 text-[#00b4d8]" />
        </div>
        <div className="h-4 w-32 rounded bg-slate-900/60"></div>
        <div className="h-3 w-48 rounded bg-slate-900/60"></div>
      </div>
    );
  }

  return (
    <RootLayout
      user={user}
      logout={logout}
      activeView={view}
      onViewChange={(newView) => {
        if (!user && newView !== 'home') {
          setActiveTab('signin');
          setView('auth');
        } else {
          setView(newView);
        }
      }}
      onAuthClick={(mode) => {
        setActiveTab(mode);
        setView('auth');
      }}
    >
      {view === 'home' && (
        <Home 
          user={user}
          logout={logout}
          onAuthClick={(mode) => {
            setActiveTab(mode);
            setView('auth');
          }}
          onDashboardClick={() => {
            if (user) {
              setView('dashboard');
            } else {
              setActiveTab('signin');
              setView('auth');
            }
          }}
          onViewChange={setView}
        />
      )}

      {view === 'dashboard' && user && (
        <HomeDashboard session={user} logout={logout} />
      )}

      {view === 'auth' && (
        <div className={`flex-grow flex items-center justify-center relative z-10 px-6 pt-28 pb-12 ${canvasBgClass}`}>
          {/* Ambient background glows */}
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-[#00b4d8]/10 to-transparent blur-[120px] pointer-events-none z-0"></div>
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-amber-500/5 to-transparent blur-[120px] pointer-events-none z-0"></div>

          <div className="w-full max-w-md space-y-6">
            
            {/* Tab selector */}
            <div className="flex p-1 rounded-xl bg-slate-950/60 border border-white/5">
              <button
                onClick={() => { setActiveTab('signin'); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all border-none cursor-pointer ${
                  activeTab === 'signin' 
                    ? 'bg-gradient-to-r from-[#00b4d8] to-cyan-500 text-slate-950 font-black shadow-md shadow-[#00b4d8]/10' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setActiveTab('signup'); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all border-none cursor-pointer ${
                  activeTab === 'signup' 
                    ? 'bg-gradient-to-r from-[#00b4d8] to-cyan-500 text-slate-950 font-black shadow-md shadow-[#00b4d8]/10' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className={`text-xs px-4 py-3 rounded-xl flex items-start gap-3 border ${
                error.includes('successful') 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                <ShieldAlert className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  error.includes('successful') ? 'text-emerald-500' : 'text-red-500'
                }`} />
                <div>
                  <span className="font-bold">{error.includes('successful') ? 'System Notice:' : 'Security Incident:'}</span> {error}
                </div>
              </div>
            )}

            {/* Sign In View */}
            {activeTab === 'signin' && (
              <div className={`${cardClass} p-6 md:p-8 rounded-2xl space-y-6`}>
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-white tracking-tight">Sync Portal Credentials</h2>
                  <p className="text-xs text-slate-400">Unlock your gamer telemetry baseline profile.</p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="e.g. gamer@gradegamer.edu"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#00b4d8] hover:bg-[#00d8f6] text-slate-950 font-bold py-3 px-4 rounded-xl transition-all select-none active:scale-[0.99] border-none cursor-pointer uppercase tracking-wider text-xs font-black shadow-lg shadow-[#00b4d8]/10"
                  >
                    Authenticate Session
                  </button>
                </form>
              </div>
            )}

            {/* Sign Up View */}
            {activeTab === 'signup' && (
              <div className={`${cardClass} p-6 md:p-8 rounded-2xl space-y-6`}>
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-white tracking-tight">Register Onboarding</h2>
                  <p className="text-xs text-slate-400">Establish metrics and register secure keys.</p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                      <div className="relative">
                        <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          required
                          placeholder="Rawindu De Silva"
                          value={registerForm.fullName}
                          onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="space-y-1 col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Gamer Tag</label>
                      <div className="relative">
                        <Gamepad2 className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          required
                          placeholder="Rawindu_IGL"
                          value={registerForm.gamerTag}
                          onChange={(e) => setRegisterForm({ ...registerForm, gamerTag: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Student Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="gamer@institution.edu"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Account Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••••••"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Institution</label>
                      <div className="relative">
                        <BookOpen className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. SLIIT City Uni"
                          value={registerForm.institution}
                          onChange={(e) => setRegisterForm({ ...registerForm, institution: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="space-y-1 col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Academic Level</label>
                      <select
                        value={registerForm.eduLevel}
                        onChange={(e) => setRegisterForm({ ...registerForm, eduLevel: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-white focus:border-[#00b4d8] focus:ring-1 focus:ring-[#00b4d8] transition-all text-xs font-medium"
                      >
                        <option value="High School">High School</option>
                        <option value="Undergraduate">Undergraduate</option>
                        <option value="Postgraduate">Postgraduate</option>
                        <option value="Academy">Academy</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Competitive Genres</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {['Sim Racing', 'FPS Shooters', 'MOBA', 'Battle Royale', 'Sports'].map((genre) => {
                        const isChecked = registerForm.titles.includes(genre);
                        return (
                          <label
                            key={genre}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer select-none transition-all ${
                              isChecked 
                                ? 'bg-[#00b4d8]/10 border-[#00b4d8] text-white' 
                                : 'bg-slate-950 border-white/5 text-slate-400 hover:border-white/10'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTitleCheckboxChange(genre)}
                              className="hidden"
                            />
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                              isChecked ? 'bg-[#00b4d8] border-[#00b4d8]' : 'border-white/20'
                            }`}>
                              {isChecked && <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />}
                            </div>
                            {genre}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#00b4d8] hover:bg-[#00d8f6] text-slate-950 font-bold py-3 px-4 rounded-xl transition-all select-none active:scale-[0.99] border-none cursor-pointer uppercase tracking-wider text-xs font-black shadow-lg shadow-[#00b4d8]/10"
                  >
                    Establish Account
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fallback route handles for tabs in progress */}
      {view === 'reviews' && user && (
        <PeerReviews />
      )}

      {view === 'rosters' && user && (
        <RosterManagement />
      )}

      {view === 'profile' && user && (
        <VerifiedProfile />
      )}

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between border-t border-white/5 gap-4 mt-auto">
        <p className="text-[10px] text-slate-500 font-medium">
          © {new Date().getFullYear()} GradeGamer Platform. All rights reserved.
        </p>
        <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <a href="#terms" className="hover:text-white transition-all">Terms of Session</a>
          <a href="#privacy" className="hover:text-white transition-all">Privacy Telemetry</a>
          <a href="#help" className="hover:text-white transition-all">Support Gateway</a>
        </div>
      </footer>
    </RootLayout>
  );
}

export default App;
