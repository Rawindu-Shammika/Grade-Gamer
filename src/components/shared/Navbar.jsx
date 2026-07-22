import React, { useState, useRef, useEffect } from 'react';
import { Gamepad2, User, LogOut, Settings, Sun, Moon, HelpCircle } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

/**
 * Shared Global Navigation Component (Refactored)
 * 
 * - Styled in unified premium dark cyber-theme.
 * - Central Link Strip contains 5 items: Home, Dashboard, Peer Reviews, Verified Profile, Roster Management.
 * - Right Zone features a circular avatar GG toggling a functional 4-option dropdown menu.
 */
export const Navbar = ({ 
  activeView = 'dashboard', 
  onViewChange, 
  user = null, 
  logout, 
  onAuthClick 
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const dropdownRef = useRef(null);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'reviews', label: 'Peer Reviews' },
    { id: 'profile', label: 'Verified Resumes' },
    { id: 'rosters', label: 'Roster Management' }
  ];

  const handleNavClick = (id) => {
    if (onViewChange) {
      onViewChange(id);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (isDark) {
      document.body.classList.add('light-mode-override');
      document.body.style.backgroundColor = '#f8fafc';
      document.body.style.color = '#0f172a';
    } else {
      document.body.classList.remove('light-mode-override');
      document.body.style.backgroundColor = '#0b0f19';
      document.body.style.color = '#f8fafc';
    }
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
    <header className="bg-[#0b0f19]/80 backdrop-blur-md border-b border-slate-800 fixed top-0 left-0 right-0 z-50 px-8 py-4 flex items-center justify-between shadow-md select-none">
      
      {/* Left Section: Brand Logo & Title */}
      <div 
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => handleNavClick('home')}
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

      {/* Center Section: Horizontal Navigation links (5 links in chronological order) */}
      <nav className="hidden md:flex items-center justify-center">
        {navItems.map((item) => {
          const isActive = user && activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
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
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => {
            if (user) {
              setIsDropdownOpen(!isDropdownOpen);
            } else {
              if (onAuthClick) onAuthClick('signin');
            }
          }}
          className="w-10 h-10 rounded-full border-2 border-slate-700 bg-slate-900 flex items-center justify-center transition-all cursor-pointer shadow-md overflow-hidden select-none active:scale-95"
        >
          {user ? (
            <div className="w-full h-full bg-gradient-to-br from-[#00b4d8]/20 to-[#00b4d8]/5 flex items-center justify-center text-[#00b4d8] text-xs font-black font-mono">
              GG
            </div>
          ) : (
            <User className="w-4 h-4 text-slate-400 hover:text-[#00b4d8]" />
          )}
        </button>

        {/* Dropdown Menu Card overlay */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2.5 w-56 bg-[#161b26] border border-slate-800 rounded-xl shadow-2xl py-2 z-50 text-slate-200 text-sm font-sans animate-in fade-in slide-in-from-top-2 duration-150">
            
            {/* 1. Settings */}
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                alert("Web Platform Settings console active: operational parameters normal.");
              }}
              className="w-full px-4 py-2 hover:bg-slate-800/80 text-left transition-colors flex items-center gap-3 cursor-pointer border-none bg-transparent text-slate-200"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              Web Platform Settings
            </button>

            {/* 2. Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="w-full px-4 py-2 hover:bg-slate-800/80 text-left transition-colors flex items-center justify-between cursor-pointer border-none bg-transparent text-slate-200"
            >
              <div className="flex items-center gap-3">
                {isDark ? (
                  <>
                    <Moon className="w-4 h-4 text-slate-400" />
                    <span>Dark Mode</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Light Mode</span>
                  </>
                )}
              </div>
              <span className={`text-[8.5px] font-bold font-mono uppercase px-1.5 py-0.5 rounded ${
                isDark ? 'bg-slate-900 text-[#00b4d8] border border-[#00b4d8]/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              }`}>
                {isDark ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* 3. FAQ */}
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                alert("GradeGamer FAQ & Documentation terminal route active.");
              }}
              className="w-full px-4 py-2 hover:bg-slate-800/80 text-left transition-colors flex items-center gap-3 cursor-pointer border-none bg-transparent text-slate-200"
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              FAQ
            </button>

            <div className="h-[1px] bg-slate-800/80 my-1"></div>

            {/* 4. Log Out */}
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 hover:bg-red-500/10 hover:text-red-400 text-left transition-all flex items-center gap-3 cursor-pointer border-none bg-transparent text-slate-300 font-bold"
            >
              <LogOut className="w-4 h-4 text-red-500/80" />
              Log Out
            </button>

          </div>
        )}
      </div>

    </header>
  );
};

export default Navbar;
