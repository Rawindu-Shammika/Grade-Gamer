import React, { useState } from 'react';
import { X, Calendar, Users } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export const ScheduleMatchModal = ({ isOpen, onClose, team, currentUser, onScheduled }) => {
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState('Scrim');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !team) return null;

  // Initialize selected members with team members if not set
  const members = team.team_members || [];

  const handleToggleMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedMembers.length === members.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(members.map((m) => m.user_id).filter(Boolean));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!eventName.trim()) {
      setError('Please provide an event name.');
      return;
    }
    if (selectedMembers.length === 0) {
      setError('Please select at least one participating athlete for the lineup.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Insert the match
      const { data: matchData, error: matchError } = await supabase
        .from('roster_matches')
        .insert([
          {
            team_id: team.id,
            event_name: eventName.trim(),
            event_type: eventType.trim() || 'Custom Match',
            status: 'SCHEDULED',
            game_title: team.game_title,
            created_by: currentUser.id
          }
        ])
        .select()
        .single();

      if (matchError) throw matchError;

      // 2. Insert match_lineup entries
      const lineupEntries = selectedMembers.map((userId) => ({
        match_id: matchData.id,
        user_id: userId
      }));

      const { error: lineupError } = await supabase
        .from('match_lineup')
        .insert(lineupEntries);

      if (lineupError) throw lineupError;

      // 3. Clear and callback
      setEventName('');
      setSelectedMembers([]);
      if (onScheduled) onScheduled();
      onClose();
    } catch (err) {
      console.error('Failed to schedule match event:', err);
      setError(err.message || 'Failed to save event schedule details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#121620] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-850 p-5">
          <div className="space-y-0.5">
            <h3 className="text-sm font-black uppercase text-white tracking-wider font-mono flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Schedule Squad Event / Match
            </h3>
            <p className="text-[10px] text-[#00b4d8] font-mono tracking-widest uppercase">
              IGL Lineup Calibration Interface
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl transition-all bg-transparent border-none cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-grow">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs">
              {error}
            </div>
          )}

          {/* Event Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold tracking-widest text-[#00b4d8] uppercase">
              Event Name / Stage
            </label>
            <input
              type="text"
              required
              placeholder="e.g. SLIIT Championship Stage 1, Scrim vs GG"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-350 focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>

          {/* Event Type */}
          <div className="space-y-2">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
              EVENT TYPE CATEGORY
            </label>
            <input
              type="text"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              placeholder="e.g. Scrim, Tournament Finals, League Stage, LAN Qualifier"
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
            />
          </div>

          {/* Lineup Checkboxes */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono font-bold tracking-widest text-[#00b4d8] uppercase flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Select Participating Lineup
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[9px] font-mono uppercase font-bold text-cyan-400 bg-transparent border-none cursor-pointer hover:underline"
              >
                {selectedMembers.length === members.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2">
              {members.map((member) => {
                const inGameName = member.profiles?.in_game_name || 'Athlete';
                const accountId = member.profiles?.unique_account_id || 'GG-000000';
                const isChecked = selectedMembers.includes(member.user_id);
                return (
                  <label
                    key={member.id}
                    className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                        : 'bg-transparent border-slate-900 text-slate-400 hover:border-slate-850'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleMember(member.user_id)}
                        className="accent-cyan-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold font-mono ml-2">{inGameName}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{accountId}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Save Footer */}
          <div className="flex justify-end pt-3 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white transition-all text-xs font-mono uppercase font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#00b4d8] hover:bg-cyan-400 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all border-none cursor-pointer shadow-md"
            >
              {isLoading ? 'Scheduling...' : 'Save Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleMatchModal;
