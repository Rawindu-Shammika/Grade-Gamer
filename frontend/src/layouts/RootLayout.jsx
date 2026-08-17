import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Gamepad2, User, Menu, X } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import AccountSettings from '../components/profile/AccountSettings';
import { useTheme } from '../context/ThemeContext';
import FAQModal from '../components/help/FAQModal';
import ProfileSettingsModal from '../components/profile/ProfileSettingsModal';
import { NotificationCenter } from '../components/NotificationCenter';
import EsportsTitlesModal from '../components/EsportsTitlesModal';

/**
 * RootLayout - Global Unified Layout Wrapper
 * 
 * - The single source of truth for the top navigation bar.
 * - Displays brand logo, central 5 links, and right avatar dropdown.
 * - Wraps pages dynamically to prevent component unmounting, layout shift, or text jumps.
 */
export const RootLayout = ({ 
  user = null, 
  profile = null,
  refreshProfile,
  logout, 
  deleteAccount,
  onAuthClick, 
  activeView = 'home', 
  onViewChange, 
  children 
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFAQOpen, setIsFAQOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEsportsSettingsOpen, setIsEsportsSettingsOpen] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);

  useEffect(() => {
    if (user && profile && (!profile.esports_titles || profile.esports_titles.length === 0)) {
      setIsFirstTime(true);
      setIsEsportsSettingsOpen(true);
    }
  }, [user, profile]);
  
  // Grace Period Deletion states
  const [isDeleting, setIsDeleting] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [showCancelToast, setShowCancelToast] = useState(false);

  const { theme, toggleTheme } = useTheme();
  const dropdownRef = useRef(null);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'reviews', label: 'Peer Reviews' },
    { id: 'profile', label: 'Verified Resumes' },
    { id: 'rosters', label: 'Roster Management' }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePermanentDelete = useCallback(async () => {
    try {
      if (deleteAccount) {
        await deleteAccount();
      } else {
        const { error } = await supabase.rpc('delete_user_account');
        if (error) {
          console.warn('RPC delete_user_account failed, executing manual fallback:', error);
          await supabase.from('player_profiles').delete().eq('user_id', user.id);
          await supabase.from('teams').delete().eq('user_id', user.id);
        }
        await supabase.auth.signOut();
      }
      if (logout) {
        await logout();
      }
      window.location.href = "/";
    } catch (err) {
      console.error('Final deletion workflow error:', err);
    }
  }, [user?.id, logout, deleteAccount]);

  // React Effect & Unmount Safety for Deletion Countdown
  useEffect(() => {
    let timer;
    if (isDeleting && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isDeleting && countdown === 0) {
      // Countdown finished: Hide toast and execute permanent deletion
      setIsDeleting(false);
      handlePermanentDelete();
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isDeleting, countdown, handlePermanentDelete]);

  const startDeletionCountdown = () => {
    setCountdown(10);
    setIsDeleting(true);
    setShowCancelToast(false);
  };

  const handleUndo = () => {
    setIsDeleting(false);
    setCountdown(10);
    setShowCancelToast(true);
    setTimeout(() => {
      setShowCancelToast(false);
    }, 3000);
  };

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    try {
      await supabase.auth.signOut();
      if (logout) {
        await logout();
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="bg-[#0b0f19] min-h-screen text-slate-100 flex flex-col relative overflow-hidden">
      
      {/* Unified Top Navigation Bar (Single Source of Truth) */}
      <header className="bg-[#0b0f19]/80 backdrop-blur-md border-b border-slate-800 fixed top-0 left-0 right-0 z-50 px-8 py-4 flex items-center justify-between shadow-md select-none">
        
        {/* Left Section: Brand Logo */}
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => onViewChange && onViewChange('home')}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00b4d8] to-cyan-400 flex items-center justify-center shadow-lg shadow-[#00b4d8]/20">
            <Gamepad2 className="w-4.5 h-4.5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 leading-none">
              GradeGamer
            </h1>
            <p className="text-[7.5px] font-bold text-[#00b4d8] tracking-widest uppercase mt-0.5 font-mono">Telemetry Portal</p>
          </div>
        </div>

        {/* Center Section: Horizontal navigation Links */}
        <nav className="hidden md:flex items-center justify-center">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange && onViewChange(item.id)}
                className={`transition-colors text-xs font-mono uppercase tracking-wider border-none cursor-pointer mx-2 ${
                  isActive
                    ? 'bg-[#00b4d8] text-slate-950 font-black px-4 py-1.5 rounded-lg shadow-md'
                    : 'text-slate-400 hover:text-slate-100 bg-transparent font-medium py-1.5 px-3'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Section: Profile avatar dropdown trigger (width 10, height 10, rounded-full, border-2 border-slate-700) */}
        <div className="flex items-center gap-3">
          {user && <NotificationCenter />}
          
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => {
                if (user) {
                  setIsDropdownOpen(!isDropdownOpen);
                } else {
                  if (onAuthClick) onAuthClick('signin');
                }
              }}
              className="w-10 h-10 rounded-full border-2 border-slate-700 bg-slate-900 flex items-center justify-center transition-all cursor-pointer shadow-md overflow-hidden select-none active:scale-95 animate-none"
            >
              {user ? (
                <div className="w-full h-full bg-gradient-to-br from-[#00b4d8]/20 to-[#00b4d8]/5 flex items-center justify-center text-[#00b4d8] text-xs font-black font-mono">
                  GG
                </div>
              ) : (
                <User className="w-4 h-4 text-slate-400 hover:text-[#00b4d8]" />
              )}
            </button>

            {/* Floating dropdown overlay */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-12 mt-2 w-48 bg-[#111622] border border-slate-800 rounded-xl py-3 px-4 shadow-2xl space-y-3 flex flex-col items-start z-50 text-slate-200 text-sm font-sans animate-in fade-in duration-100">
                
                {/* Option 1: My Profile */}
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsProfileSettingsOpen(true);
                  }}
                  className="w-full text-left font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
                >
                  My Profile
                </button>

                {/* Option 2: Account Settings */}
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsSettingsOpen(true);
                  }}
                  className="w-full text-left font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
                >
                  Account Settings
                </button>

                {/* Option 2.5: Esports Preferences */}
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsFirstTime(false);
                    setIsEsportsSettingsOpen(true);
                  }}
                  className="w-full text-left font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
                >
                  Settings & Esports Titles
                </button>

                {/* Option 3: FAQ */}
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsFAQOpen(true);
                  }}
                  className="w-full text-left font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
                >
                  FAQ
                </button>

                {/* Option 4: Switch to Light/Dark Mode */}
                <button
                  onClick={toggleTheme}
                  className="w-full text-left font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
                >
                  {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                </button>

                {/* Solid horizontal rule divider */}
                <div className="w-full border-t border-slate-800/80 my-2"></div>

                {/* Option 5: Log Out */}
                <button
                  onClick={handleLogout}
                  className="w-full text-left text-red-500 font-semibold hover:text-red-400 transition-colors cursor-pointer border-none bg-transparent"
                >
                  Log Out
                </button>

              </div>
            )}
            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer min-w-[44px] min-h-[44px]"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

      </header>

      {/* Mobile Drawer Backdrop & Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden bg-slate-950/95 backdrop-blur-xl pt-24 px-6 pb-8 flex flex-col justify-between animate-in fade-in duration-200 overflow-y-auto">
          <div className="space-y-4">
            <p className="text-[10px] font-mono font-bold tracking-widest text-[#00b4d8] uppercase mb-2">
              NAVIGATION DIRECTORY
            </p>
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (onViewChange) onViewChange(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left py-3.5 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all border-none cursor-pointer flex items-center justify-between ${
                    isActive
                      ? 'bg-[#00b4d8] text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900/80 border border-slate-800 text-slate-300 hover:border-cyan-500/50'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <span className="text-[10px] font-bold">● ACTIVE</span>}
                </button>
              );
            })}

            {!user && (
              <button
                onClick={() => {
                  if (onAuthClick) onAuthClick('signin');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full mt-4 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono font-black text-xs uppercase tracking-wider py-4 px-4 rounded-xl border-none cursor-pointer shadow-lg shadow-cyan-400/20"
              >
                Sign In / Establish Account
              </button>
            )}
          </div>

          {user && (
            <div className="pt-6 border-t border-slate-800 space-y-3">
              <p className="text-[10px] font-mono text-slate-500 uppercase">ACCOUNT ACTIONS</p>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsProfileSettingsOpen(true);
                }}
                className="w-full text-left py-2.5 text-xs font-sans text-slate-300 hover:text-white border-none bg-transparent"
              >
                My Profile
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsSettingsOpen(true);
                }}
                className="w-full text-left py-2.5 text-xs font-sans text-slate-300 hover:text-white border-none bg-transparent"
              >
                Account Settings
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsFirstTime(false);
                  setIsEsportsSettingsOpen(true);
                }}
                className="w-full text-left py-2.5 text-xs font-sans text-slate-300 hover:text-white border-none bg-transparent"
              >
                Settings & Esports Titles
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left py-2.5 text-xs font-sans text-red-400 font-bold border-none bg-transparent"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main children rendering view */}
      <div className="flex-grow flex flex-col relative z-10">
        {children}
      </div>

      {/* Floating Settings Modal Wrapper */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <AccountSettings 
            user={user} 
            onClose={() => setIsSettingsOpen(false)} 
            onStartDeletion={() => {
              setIsSettingsOpen(false);
              startDeletionCountdown();
            }}
          />
        </div>
      )}

      {/* Esports Titles Modal */}
      <EsportsTitlesModal 
        isOpen={isEsportsSettingsOpen} 
        onClose={() => setIsEsportsSettingsOpen(false)}
        userId={user?.id}
        initialTitles={profile?.esports_titles || []}
        onSaved={() => {
          if (refreshProfile) refreshProfile();
        }}
        isFirstTime={isFirstTime}
      />

      {/* Floating FAQ Modal Wrapper */}
      {isFAQOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <FAQModal onClose={() => setIsFAQOpen(false)} />
        </div>
      )}

      {/* Floating Profile Settings Modal Wrapper */}
      {isProfileSettingsOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <ProfileSettingsModal 
            user={user} 
            onClose={() => setIsProfileSettingsOpen(false)} 
          />
        </div>
      )}

      {/* Grace Period Countdown Floating Toast */}
      {isDeleting && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] bg-[#161b26] border border-red-500/50 shadow-2xl rounded-xl px-6 py-4 flex items-center gap-4 text-slate-100 animate-slide-up">
          <span className="text-sm font-semibold">
            Account scheduled for deletion in {countdown}s...
          </span>
          <button
            onClick={handleUndo}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-1.5 rounded-lg text-xs uppercase tracking-wider transition-all border-none cursor-pointer"
          >
            UNDO
          </button>
        </div>
      )}

      {/* Cancelled Deletion Floating Toast */}
      {showCancelToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] bg-emerald-950/80 border border-emerald-500/30 shadow-2xl rounded-xl px-6 py-4 text-slate-100 text-sm font-semibold animate-slide-up">
          Account deletion cancelled.
        </div>
      )}

    </div>
  );
};

export default RootLayout;
