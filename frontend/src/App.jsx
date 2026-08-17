import React, { useState, useEffect } from 'react';
import useAuth from './hooks/useAuth';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import { supabase } from './services/supabaseClient';
import RootLayout from './layouts/RootLayout';
import VerifiedProfile from './pages/VerifiedProfile';
import PeerReviews from './pages/PeerReviews';
import RosterManagement from './pages/RosterManagement';
import Messages from './pages/Messages';
import AboutGradeGamer from './pages/AboutGradeGamer';
import { 
  Mail, 
  Lock, 
  User as UserIcon, 
  Gamepad2, 
  BookOpen, 
  Check, 
  ShieldAlert,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

function App() {
  const { user, profile, refreshProfile, loading, error, login, register, logout, setError, deleteAccount } = useAuth();
  
  // View control: 'home' | 'auth' | 'dashboard' | 'reviews' | 'rosters' | 'profile' | 'messages' | 'register'
  const [view, setView] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.replace(/^\//, '');
      if (path === 'peer-reviews' || path === 'reviews') return 'reviews';
      if (path === 'roster-management' || path === 'rosters') return 'rosters';
      if (path === 'verified-resume' || path === 'profile') return 'profile';
      if (['messages', 'dashboard', 'home', 'register', 'about'].includes(path)) {
        return path;
      }
      const saved = localStorage.getItem('activeView');
      return saved || 'home';
    }
    return 'home';
  });
  
  // Tab control: 'signin' | 'signup'
  const [activeTab, setActiveTab] = useState('signin');

  const updateView = (newView) => {
    let targetView = newView;
    let targetPath = `/${newView}`;

    if (newView === 'peer-reviews') {
      targetView = 'reviews';
      targetPath = '/peer-reviews';
    } else if (newView === 'roster-management') {
      targetView = 'rosters';
      targetPath = '/roster-management';
    } else if (newView === 'verified-resume') {
      targetView = 'profile';
      targetPath = '/verified-resume';
    } else if (newView === 'home') {
      targetPath = '/';
    }

    setView(targetView);
    localStorage.setItem('activeView', targetView);
    if (typeof window !== 'undefined') {
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    }
  };

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const handlePopState = () => {
        const path = window.location.pathname.replace(/^\//, '');
        if (path === 'peer-reviews' || path === 'reviews') {
          setView('reviews');
        } else if (path === 'roster-management' || path === 'rosters') {
          setView('rosters');
        } else if (path === 'verified-resume' || path === 'profile') {
          setView('profile');
        } else if (['messages', 'dashboard', 'home', 'register', 'about'].includes(path)) {
          setView(path);
        } else {
          setView('home');
        }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, []);

  const [pendingInvites, setPendingInvites] = useState([]);
  const [notificationStatus, setNotificationStatus] = useState(null);

  useEffect(() => {
    if (notificationStatus) {
      const timer = setTimeout(() => setNotificationStatus(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notificationStatus]);

  const fetchPendingInvites = async () => {
    if (!user) return;
    try {
      const email = user.email;
      const gamerTag = user.user_metadata?.gamerTag;
      
      const { data, error } = await supabase
        .from('roster_invitations')
        .select('*, teams(team_name)')
        .eq('status', 'pending');
      
      if (error) throw error;
      
      const filtered = data?.filter(invite => 
        invite.receiver_id === user.id ||
        invite.receiver_platform_id?.toLowerCase() === email?.toLowerCase() ||
        invite.receiver_platform_id?.toLowerCase() === gamerTag?.toLowerCase()
      ) || [];
      
      setPendingInvites(filtered);
    } catch (err) {
      console.error('Error fetching pending invitations:', err);
    }
  };

  const handleAcceptInvite = async (invite) => {
    try {
      const { error: updateErr } = await supabase
        .from('roster_invitations')
        .update({ status: 'accepted' })
        .eq('id', invite.id);
        
      if (updateErr) throw updateErr;
      
      const { error: insertErr } = await supabase
        .from('team_members')
        .insert({
          team_id: invite.team_id,
          user_id: user.id,
          role: 'Player'
        });
        
      if (insertErr) throw insertErr;
      
      setNotificationStatus({
        type: 'success',
        message: `Enrolled successfully! You are now an active roster athlete for ${invite.teams?.team_name || 'the team'}.`
      });
      fetchPendingInvites();
    } catch (err) {
      console.error('Failed to accept invitation:', err);
      setNotificationStatus({
        type: 'error',
        message: err.message || 'Failed to join roster.'
      });
    }
  };

  const handleDeclineInvite = async (invite) => {
    try {
      const { error } = await supabase
        .from('roster_invitations')
        .update({ status: 'declined' })
        .eq('id', invite.id);
        
      if (error) throw error;
      
      setNotificationStatus({
        type: 'success',
        message: `Invitation to join ${invite.teams?.team_name || 'the team'} declined.`
      });
      fetchPendingInvites();
    } catch (err) {
      console.error('Failed to decline invitation:', err);
      setNotificationStatus({
        type: 'error',
        message: err.message || 'Failed to decline invitation.'
      });
    }
  };

  React.useEffect(() => {
    if (user) {
      fetchPendingInvites();
      const interval = setInterval(fetchPendingInvites, 10000);
      return () => clearInterval(interval);
    } else {
      setPendingInvites([]);
    }
  }, [user]);

  // Auto route transitions
  React.useEffect(() => {
    if (user) {
      // If user is logged in, they can view home or any tab.
      // Only redirect if they are currently on 'auth' or if there is a saved view.
      const saved = localStorage.getItem('activeView');
      if (saved && saved !== 'home' && saved !== 'auth') {
        setView(saved);
      } else if (view === 'auth') {
        updateView('dashboard');
      }
    } else {
      // If user is logged out, restrict to 'home' or 'auth'
      if (view !== 'home' && view !== 'auth') {
        updateView('home');
      }
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
    phone: '',
    address: '',
    inGameName: '',
    primaryGame: 'Valorant'
  });

  const ESPORTS_CATEGORIES = [
    'SIM RACING',
    'FPS SHOOTERS',
    'MOBA',
    'BATTLE ROYALE',
    'SPORTS GAMING'
  ];

  const [selectedCategories, setSelectedCategories] = useState(['FPS SHOOTERS']);

  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category]
    );
  };

  const [showRevealModal, setShowRevealModal] = useState(false);
  const [revealedGamerId, setRevealedGamerId] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyGamerId = () => {
    navigator.clipboard.writeText(revealedGamerId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
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
    if (selectedCategories.length === 0) {
      setError('Please select at least one esports category.');
      return;
    }

    try {
      setError('');
      const metadata = {
        fullName: registerForm.fullName,
        gamerTag: registerForm.inGameName,
        full_name: registerForm.fullName,
        in_game_name: registerForm.inGameName,
        phone: registerForm.phone,
        address: registerForm.address,
        esports_categories: selectedCategories,
        primary_game: selectedCategories[0] || 'General'
      };
      const signedUpUser = await register(registerForm.email, registerForm.password, metadata);
      
      if (signedUpUser) {
        let attempts = 0;
        let generatedId = '';
        while (attempts < 10 && !generatedId) {
          await new Promise((r) => setTimeout(r, 450));
          const { data: p } = await supabase
            .from('profiles')
            .select('unique_account_id')
            .eq('id', signedUpUser.id)
            .maybeSingle();
          if (p?.unique_account_id) {
            generatedId = p.unique_account_id;
          }
          attempts++;
        }
        
        setRevealedGamerId(generatedId || 'GG-394821');
        setShowRevealModal(true);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed.');
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
      profile={profile}
      refreshProfile={refreshProfile}
      logout={logout}
      deleteAccount={deleteAccount}
      activeView={view}
      onViewChange={(newView) => {
        if (!user && newView !== 'home') {
          setActiveTab('signin');
          updateView('auth');
        } else {
          updateView(newView);
        }
      }}
      onAuthClick={(mode) => {
        setActiveTab(mode);
        updateView('auth');
      }}
    >
      {/* Sleek UI Toast notification */}
      {notificationStatus && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[105] w-full max-w-md px-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 transition-all duration-300 ${
              notificationStatus.type === 'success'
                ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.15)] backdrop-blur-md'
                : 'bg-red-950/40 border-red-500/40 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.15)] backdrop-blur-md'
            }`}
          >
            <div
              className={`p-1.5 rounded-lg ${
                notificationStatus.type === 'success'
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {notificationStatus.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5"/>
              ) : (
                <AlertCircle className="w-5 h-5"/>
              )}
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                {notificationStatus.type === 'success' ? 'Roster Enrollment Verified' : 'Action Failed'}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{notificationStatus.message}</p>
            </div>
            <button
              onClick={() => setNotificationStatus(null)}
              className="text-slate-400 hover:text-white text-xs p-1 bg-transparent border-none cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}



      {view === 'home' && (
        <Home 
          user={user}
          logout={logout}
          onAuthClick={(mode) => {
            setActiveTab(mode);
            updateView('auth');
          }}
          onDashboardClick={() => {
            if (user) {
              updateView('dashboard');
            } else {
              setActiveTab('signin');
              updateView('auth');
            }
          }}
          onViewChange={updateView}
        />
      )}

      {view === 'dashboard' && user && (
        <Dashboard session={user} logout={logout} />
      )}

      {view === 'auth' && (
        <div className={`flex-grow flex items-center justify-center relative z-10 px-6 pt-28 pb-12 ${canvasBgClass}`}>
          {/* Ambient background glows */}
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-[#00b4d8]/10 to-transparent blur-[120px] pointer-events-none z-0"></div>
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-amber-500/5 to-transparent blur-[120px] pointer-events-none z-0"></div>

          <div className="w-full max-w-md space-y-6">
            
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

              <div className="text-center pt-2">
                <p className="text-xs text-slate-400">
                  New to GradeGamer?{' '}
                  <button
                    type="button"
                    onClick={() => updateView('register')}
                    className="text-[#00b4d8] hover:underline font-bold bg-transparent border-none cursor-pointer"
                  >
                    Create an Account
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'register' && (
        <div className={`flex-grow flex items-center justify-center relative z-10 px-6 pt-28 pb-12 ${canvasBgClass}`}>
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-[#00b4d8]/10 to-transparent blur-[120px] pointer-events-none z-0"></div>
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-amber-500/5 to-transparent blur-[120px] pointer-events-none z-0"></div>

          <div className="w-full max-w-md space-y-6">
            <div className={`${cardClass} p-6 md:p-8 rounded-2xl space-y-6`}>
              <div className="space-y-1">
                <h2 className="text-xl font-black text-white tracking-tight">Register Onboarding</h2>
                <p className="text-xs text-slate-400">Establish metrics and register secure keys.</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-4 py-3 rounded-xl flex items-start gap-3">
                  <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-550" />
                  <div>{error}</div>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Rawindu De Silva"
                    value={registerForm.fullName}
                    onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">In-Game Name (IGN)</label>
                  <input
                    type="text"
                    required
                    placeholder="Rawindu_IGL"
                    value={registerForm.inGameName}
                    onChange={(e) => setRegisterForm({ ...registerForm, inGameName: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="gamer@gradegamer.edu"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Telephone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+94 77 123 4567"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Residential Address / City</label>
                  <input
                    type="text"
                    required
                    placeholder="Colombo, Sri Lanka"
                    value={registerForm.address}
                    onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                    className={inputClass}
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
                  {selectedCategories.length === 0 && (
                    <p className="text-[10px] font-mono text-amber-400 mt-1">
                      * Please select at least one esports category.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#00b4d8] hover:bg-[#00d8f6] text-slate-950 font-bold py-3 px-4 rounded-xl transition-all select-none active:scale-[0.99] border-none cursor-pointer uppercase tracking-wider text-xs font-black shadow-lg shadow-[#00b4d8]/10 mt-2"
                >
                  Establish Account
                </button>
              </form>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-400">
                  Already registered?{' '}
                  <button
                    onClick={() => { updateView('auth'); setActiveTab('signin'); }}
                    className="text-[#00b4d8] hover:underline font-bold bg-transparent border-none cursor-pointer"
                  >
                    Sync Portal Credentials
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Welcome / GradeGamer ID Reveal Modal */}
      {showRevealModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#121620] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-6 text-center">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400 text-xl font-bold">
                ✓
              </div>
              <h3 className="text-sm font-black uppercase text-white tracking-wider font-mono">
                Account Created Successfully!
              </h3>
            </div>

            {/* GradeGamer ID Highlighted Box */}
            <div 
              onClick={handleCopyGamerId}
              className="p-4 bg-slate-950 border border-[#00b4d8]/35 rounded-xl cursor-pointer hover:border-[#00b4d8]/60 transition-all flex items-center justify-between"
            >
              <div className="text-left space-y-0.5">
                <span className="text-[8px] font-mono font-bold tracking-widest text-[#00b4d8] uppercase block">
                  Your GradeGamer ID
                </span>
                <span className="text-sm font-mono font-black text-white">{revealedGamerId}</span>
              </div>
              <span className="text-[10px] font-mono uppercase bg-[#00b4d8]/10 text-[#00b4d8] px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 hover:bg-[#00b4d8]/20 transition-all">
                {copiedId ? 'Copied!' : 'Copy ID'}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Share your GradeGamer ID with team captains to receive roster invites and direct messages.
            </p>

            <div className="pt-2">
              <button
                onClick={() => {
                  setShowRevealModal(false);
                  updateView('dashboard');
                }}
                className="w-full bg-[#00b4d8] hover:bg-[#00d8f6] text-slate-950 font-black py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md cursor-pointer border-none"
              >
                Continue to Dashboard
              </button>
            </div>
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

      {view === 'messages' && user && (
        <Messages currentUser={user} />
      )}

      {view === 'about' && (
        <AboutGradeGamer onViewChange={updateView} />
      )}

      {/* Footer */}
      <footer className="w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16 py-5 flex flex-col md:flex-row items-center justify-between border-t border-white/5 gap-4 mt-auto">
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
