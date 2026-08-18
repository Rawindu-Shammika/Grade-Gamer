import React, { useState, useRef, useEffect } from 'react';
import { Gamepad2, User, LogOut, Settings, Sun, Moon, HelpCircle, Bell, Check, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import ProfileDropdown from '../ProfileDropdown';
import EditProfileModal from '../EditProfileModal';
import { NotificationCenter } from '../NotificationCenter';

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
  user: propUser = null, 
  logout, 
  onAuthClick 
}) => {
  const { user: authUser } = useAuth();
  const user = propUser || authUser;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);
  const [receivedInvites, setReceivedInvites] = useState([]);
  const [activityAlerts, setActivityAlerts] = useState([]);
  const [activeNotificationTab, setActiveNotificationTab] = useState('invites');
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [navbarProfile, setNavbarProfile] = useState({ inGameName: '', gradeGamerId: '' });
  const [notificationStatus, setNotificationStatus] = useState(null);

  useEffect(() => {
    if (notificationStatus) {
      const timer = setTimeout(() => setNotificationStatus(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notificationStatus]);

  const fetchNavbarProfile = async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('in_game_name, unique_account_id')
        .eq('id', user.id)
        .maybeSingle();
      if (data) {
        setNavbarProfile({
          inGameName: data.in_game_name || user.user_metadata?.gamerTag || 'Player',
          gradeGamerId: data.unique_account_id || ''
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNavbarProfile();
  }, [user]);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'game-data', label: 'Game Data' },
    { id: 'reviews', label: 'Peer Reviews' },
    { id: 'profile', label: 'Verified Resumes' },
    { id: 'rosters', label: 'Roster Management' },
    { id: 'messages', label: 'Direct Messages' }
  ];

  const fetchBellInvites = async () => {
    if (!user) return;
    try {
      // 1. Fetch Received Invites
      const { data: received, error: recError } = await supabase
        .from('roster_invitations')
        .select(`
          *,
          teams ( team_name ),
          sender:profiles!roster_invitations_sender_id_fkey ( in_game_name )
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      if (recError) throw recError;
      setReceivedInvites(received || []);

      // 2. Fetch Sent Status Updates
      const { data: activity, error: actError } = await supabase
        .from('roster_invitations')
        .select(`
          *,
          teams ( team_name ),
          receiver:profiles!roster_invitations_receiver_id_fkey ( in_game_name )
        `)
        .eq('sender_id', user.id)
        .in('status', ['accepted', 'rejected'])
        .eq('is_read', false);

      if (actError) throw actError;
      setActivityAlerts(activity || []);
    } catch (err) {
      console.error('Error fetching bell invitations:', err);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchBellInvites();

    // Subscribe to updates on roster_invitations table
    const channel = supabase
      .channel('roster_invitations_realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'roster_invitations'
      }, () => {
        fetchBellInvites();
      })
      .subscribe();

    const interval = setInterval(fetchBellInvites, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user]);

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
      fetchBellInvites();
      if (onViewChange) onViewChange('reviews');
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
        .update({ status: 'rejected' })
        .eq('id', invite.id);

      if (error) throw error;
      setNotificationStatus({
        type: 'success',
        message: `Invitation to join ${invite.teams?.team_name || 'the team'} declined.`
      });
      fetchBellInvites();
    } catch (err) {
      console.error('Failed to decline invitation:', err);
      setNotificationStatus({
        type: 'error',
        message: err.message || 'Failed to decline invitation.'
      });
    }
  };

  const handleMarkAsRead = async (inviteId) => {
    try {
      const { error } = await supabase
        .from('roster_invitations')
        .update({ is_read: true })
        .eq('id', inviteId);

      if (error) throw error;
      fetchBellInvites();
    } catch (err) {
      console.error('Failed to mark invite as read:', err);
    }
  };

  useEffect(() => {
    const handleClickOutsideBell = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideBell);
    return () => document.removeEventListener('mousedown', handleClickOutsideBell);
  }, []);

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
    <header className="bg-white/80 dark:bg-[#0b0f19]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 fixed top-0 left-0 right-0 z-50 px-8 py-4 flex items-center justify-between shadow-sm dark:shadow-md select-none">
      
      {/* Left Section: Brand Logo & Title */}
      <div 
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => handleNavClick('home')}
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 dark:from-[#00b4d8] to-cyan-400 dark:to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 dark:shadow-[#00b4d8]/20">
          <Gamepad2 className="w-4.5 h-4.5 text-white dark:text-slate-950 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-xs font-black tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-slate-900 dark:from-white to-slate-600 dark:to-slate-400 leading-none">
            GradeGamer
          </h1>
          <p className="text-[7.5px] font-bold text-cyan-600 dark:text-[#00b4d8] tracking-widest uppercase mt-0.5 font-mono">Telemetry Portal</p>
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
                  ? 'bg-cyan-500 dark:bg-[#00b4d8] text-white dark:text-slate-950 font-black px-4 py-1.5 rounded-lg shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-transparent font-medium py-1.5 px-3'
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

        {user && (
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">
              {navbarProfile.inGameName}
            </span>
            {navbarProfile.gradeGamerId && (
              <span className="text-[9px] font-mono text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-wider">
                GradeGamer ID: {navbarProfile.gradeGamerId}
              </span>
            )}
          </div>
        )}

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              if (user) {
                setIsDropdownOpen(!isDropdownOpen);
              } else {
                if (onAuthClick) onAuthClick('signin');
              }
            }}
            className="w-10 h-10 rounded-full border-2 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 flex items-center justify-center transition-all cursor-pointer shadow-md overflow-hidden select-none active:scale-95"
          >
            {user ? (
              <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 dark:from-[#00b4d8]/20 to-cyan-500/5 dark:to-[#00b4d8]/5 flex items-center justify-center text-cyan-600 dark:text-[#00b4d8] text-xs font-black font-mono">
                {navbarProfile.inGameName ? navbarProfile.inGameName.slice(0, 2).toUpperCase() : 'GG'}
              </div>
            ) : (
              <User className="w-4 h-4 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-[#00b4d8]" />
            )}
          </button>

          {/* Dropdown Menu Card overlay */}
          {isDropdownOpen && user && (
            <ProfileDropdown
              user={user}
              onClose={() => setIsDropdownOpen(false)}
              onOpenEditProfile={() => setIsEditProfileOpen(true)}
              onViewChange={onViewChange}
              onLogout={handleLogout}
            />
          )}
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => {
          setIsEditProfileOpen(false);
          fetchNavbarProfile();
        }}
        user={user}
        refreshProfile={fetchNavbarProfile}
      />

    </header>
  );
};

export default Navbar;
