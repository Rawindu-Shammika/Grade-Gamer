import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, Users, ShieldAlert, UserMinus } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import useAuth from '../hooks/useAuth';

export const NotificationCenter = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch pending invitations
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('roster_invitations')
        .select(`
          id,
          status,
          created_at,
          teams ( id, team_name, game_title ),
          sender:profiles!roster_invitations_sender_id_fkey ( unique_account_id, in_game_name )
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setInvitations(data);
      }

      // Fetch system alerts
      const { data: alertsData, error: alertsErr } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!alertsErr && alertsData) {
        setAlerts(alertsData);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (!user) return;

    // Realtime channel for instant invitation alerts
    const channel = supabase
      .channel('roster_invites_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'roster_invitations',
          filter: `receiver_id=eq.${user.id}`
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    // Realtime channel for system alerts
    const alertsChannel = supabase
      .channel('system_alerts_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(alertsChannel);
    };
  }, [user]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Accept/Decline
  const handleAction = async (inviteId, teamId, action) => {
    setLoading(true);
    try {
      if (action === 'accepted') {
        // 1. Update invitation status
        const { error: inviteErr } = await supabase
          .from('roster_invitations')
          .update({ status: 'accepted' })
          .eq('id', inviteId);
        if (inviteErr) throw inviteErr;

        // 2. Add user to team_members
        const { error: memberErr } = await supabase
          .from('team_members')
          .insert({ team_id: teamId, user_id: user?.id, role: 'Active Player' });
        if (memberErr) throw memberErr;
      } else {
        const { error: inviteErr } = await supabase
          .from('roster_invitations')
          .update({ status: 'rejected' })
          .eq('id', inviteId);
        if (inviteErr) throw inviteErr;
      }

      await fetchNotifications();
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissNotification = async (notificationId) => {
    // Optimistic UI update: remove immediately from state
    setAlerts((prev) => prev.filter((item) => item.id !== notificationId));

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Failed to delete notification:', error);
        // Re-fetch if deletion failed on server
        fetchNotifications();
      }
    } catch (err) {
      console.error('Delete exception:', err);
      fetchNotifications();
    }
  };

  const handleClearAll = async () => {
    if (!user?.id) return;
    
    // Optimistic UI clear
    setAlerts([]);

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Failed to clear all notifications:', error);
        fetchNotifications();
      }
    } catch (err) {
      console.error('Clear all exception:', err);
      fetchNotifications();
    }
  };

  const unreadCount = invitations.length + alerts.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-400 transition-all duration-200 cursor-pointer"
        title="Notifications"
      >
        <Bell className="w-5 h-5"/>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-mono font-bold text-slate-950 shadow-[0_0_8px_rgba(6,182,212,0.8)]">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-slate-950/95 border border-slate-800 backdrop-blur-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-900/40">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-cyan-400">
                Incoming Transmissions
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {unreadCount}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => fetchNotifications()}
                className="text-[11px] font-mono text-slate-400 hover:text-cyan-400 transition cursor-pointer bg-transparent border-none"
              >
                Refresh
              </button>
              {alerts.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-[11px] font-mono text-slate-405 hover:text-red-400 transition cursor-pointer bg-transparent border-none"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/50">
            {/* Render System / Roster Alerts */}
            {alerts.map((alertItem) => {
              if (alertItem.type === 'PLAYER_LEFT_ROSTER') {
                return (
                  <div key={alertItem.id} className="p-3.5 bg-slate-900/60 border-l-2 border-red-500 hover:bg-slate-900 transition flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-md bg-red-500/10 text-red-400 mt-0.5">
                        <UserMinus className="w-4 h-4"/>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-red-400 flex items-center gap-1.5 font-mono">
                          {alertItem.title}
                        </div>
                        <p className="text-xs text-slate-350 mt-1 leading-relaxed font-sans">{alertItem.message}</p>
                        <span className="text-[10px] font-mono text-slate-500 mt-1.5 block">
                          {new Date(alertItem.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(alertItem.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>                    {/* Clear / Dismiss Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismissNotification(alertItem.id);
                      }}
                      className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition cursor-pointer bg-transparent border-none font-bold"
                      title="Dismiss notification"
                    >
                      ✕
                    </button>
                  </div>
                );
              }
              return (
                <div key={alertItem.id} className="p-3.5 bg-slate-900/50 hover:bg-slate-900/80 transition border-l-2 border-amber-500">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5 font-mono">
                        <ShieldAlert className="w-3.5 h-3.5" /> {alertItem.title}
                      </div>
                      <p className="text-xs text-slate-300 mt-1 font-sans">{alertItem.message}</p>
                      <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                        {new Date(alertItem.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismissNotification(alertItem.id);
                      }}
                      className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition cursor-pointer bg-transparent border-none font-bold"
                      title="Dismiss notification"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Render Invitations */}
            {invitations.map((invite) => (
              <div key={invite.id} className="p-4 hover:bg-slate-900/20 transition-all flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-sans space-y-1">
                    <p className="text-xs text-slate-200">
                      Roster Invite to join <span className="font-bold text-cyan-400">"{invite.teams?.team_name || 'Roster'}"</span>
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Esports Title: <span className="font-mono text-[#00b4d8] font-bold uppercase">{invite.teams?.game_title}</span>
                    </p>
                    <p className="text-[9px] text-slate-500 font-mono">
                      From Captain: {invite.sender?.in_game_name} ({invite.sender?.unique_account_id})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end">
                  <button
                    onClick={() => handleAction(invite.id, invite.teams?.id, 'rejected')}
                    disabled={loading}
                    className="px-2.5 py-1 rounded bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Decline
                  </button>
                  <button
                    onClick={() => handleAction(invite.id, invite.teams?.id, 'accepted')}
                    disabled={loading}
                    className="px-2.5 py-1 rounded bg-cyan-950/20 hover:bg-[#00b4d8] hover:text-slate-950 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Accept
                  </button>
                </div>
              </div>
            ))}

            {invitations.length === 0 && alerts.length === 0 && (
              <div className="py-8 text-center px-4">
                <Users className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-60"/>
                <p className="text-xs text-slate-400 font-mono">No pending notifications</p>
                <p className="text-[11px] text-slate-600 mt-0.5 font-sans">You are up to date on all roster queues.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
