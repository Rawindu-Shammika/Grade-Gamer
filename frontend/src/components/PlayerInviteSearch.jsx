import React, { useState, useEffect, useRef } from 'react';
import { Search, UserPlus, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import useAuth from '../hooks/useAuth';

export const PlayerInviteSearch = ({ teamId, onInviteSent }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  // Debounced Supabase search on input change
  useEffect(() => {
    const fetchMatches = async () => {
      const query = searchTerm.trim();
      if (query.length < 2) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      setLoading(true);
      try {
        // Search by GradeGamer ID or In-Game Name, limit strictly to 5
        const { data, error } = await supabase
          .from('profiles')
          .select('id, unique_account_id, in_game_name, full_name, primary_game')
          .or(`unique_account_id.ilike.%${query}%,in_game_name.ilike.%${query}%`)
          .neq('id', user?.id) // Do not suggest the logged-in user
          .limit(5);

        if (!error && data) {
          setSuggestions(data);
          setShowDropdown(data.length > 0);
        }
      } catch (err) {
        console.error('Error fetching player suggestions:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchMatches, 250); // 250ms debounce
    return () => clearTimeout(timer);
  }, [searchTerm, user?.id]);

  // Click outside to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Send invitation handler
  const handleSendInvite = async (targetPlayer) => {
    setSendingId(targetPlayer.id);
    try {
      // 1. Check if already invited or member
      const { data: existingInvite } = await supabase
        .from('roster_invitations')
        .select('id')
        .eq('team_id', teamId)
        .eq('receiver_id', targetPlayer.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingInvite) {
        alert(`An active invitation has already been dispatched to ${targetPlayer.in_game_name || 'Teammate'}.`);
        return;
      }

      // 2. Dispatch invitation
      const { error } = await supabase.from('roster_invitations').insert({
        team_id: teamId,
        sender_id: user?.id,
        receiver_id: targetPlayer.id,
        status: 'pending'
      });

      if (error) throw error;

      // 3. Reset state & notify
      setSearchTerm('');
      setShowDropdown(false);
      onInviteSent();
    } catch (err) {
      alert('Failed to send invite: ' + (err.message || 'Unknown error'));
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 w-4 h-4 text-slate-500"/>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          placeholder="Search by GradeGamer ID (e.g. GG-683...) or IGN..."
          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-10 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition font-mono"
        />
        {loading && (
          <Loader2 className="absolute right-3.5 w-4 h-4 text-cyan-400 animate-spin"/>
        )}
      </div>

      {/* Predictive Autocomplete Dropdown Panel */}
      {showDropdown && (
        <div className="mt-2 w-full bg-slate-950 border border-cyan-500/40 rounded-xl overflow-hidden shadow-2xl z-50">
          <div className="px-4 py-2 bg-cyan-950/40 border-b border-cyan-500/20 flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
              SUGGESTED ATHLETES ({suggestions.length} OF MAX 5)
            </span>
            {loading && <span className="text-[10px] font-mono text-cyan-400 animate-pulse">Searching...</span>}
          </div>

          <div className="divide-y divide-slate-800">
            {suggestions.length === 0 && !loading ? (
              <div className="p-4 text-center text-xs font-mono text-slate-500">
                No matching GradeGamer athlete found.
              </div>
            ) : (
              suggestions.map((player) => (
                <div
                  key={player.id}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-900/80 transition-colors duration-150"
                >
                  {/* Athlete Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-mono text-xs font-bold text-cyan-400">
                      {(player.in_game_name || 'GG').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="font-sans">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{player.in_game_name || 'Anonymous Player'}</span>
                        {player.full_name && (
                          <span className="text-[11px] text-slate-400 font-normal">
                            • {player.full_name}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-cyan-400 mt-0.5 flex items-center gap-2">
                        <span className="bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/20">
                          {player.unique_account_id}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400 uppercase">{player.primary_game || 'Sim Racing'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Direct Invite Action Button */}
                  <button
                    type="button"
                    disabled={sendingId === player.id}
                    onClick={() => handleSendInvite(player)}
                    className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] disabled:opacity-50 cursor-pointer border-none"
                  >
                    <UserPlus className="w-3.5 h-3.5"/>
                    <span>{sendingId === player.id ? 'Sending...' : 'Invite'}</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerInviteSearch;
