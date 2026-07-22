import React, { useState } from 'react';
import useRosterManagement from '../hooks/useRosterManagement';
import { GAME_ROSTER_SCHEMAS } from '../utils/rosterLimits';
import { Users, Gamepad2, Plus, Calendar, AlertCircle, CheckCircle, RefreshCw, X, ShieldAlert } from 'lucide-react';

const DIVISION_TITLES = {
  'Sim Racing': ['F1 25', 'Assetto Corsa'],
  'FPS Shooters': ['Valorant', 'CS2', 'Overwatch 2'],
  'MOBA': ['Dota 2', 'League of Legends'],
  'Battle Royale': ['Apex Legends', 'PUBG'],
  'Sports Gaming': ['FC 26']
};

export const RosterManagement = () => {
  const {
    activeCategory,
    setActiveCategory,
    selectedTitle,
    setSelectedTitle,
    existingRosters,
    isLoading,
    createRoster
  } = useRosterManagement();

  // Mode: 'view' or 'create'
  const [mode, setMode] = useState('view');
  
  // Create form states
  const [teamName, setTeamName] = useState('');
  const [players, setPlayers] = useState([]);
  
  // Feedback states
  const [statusMessage, setStatusMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize players list based on title limits
  const initRosterForm = () => {
    const limits = GAME_ROSTER_SCHEMAS[selectedTitle] || { maxSlots: 5, defaultRoleLabel: 'Active Player' };
    const initialPlayers = Array.from({ length: limits.maxSlots }, (_) => ({
      name: '',
      role: limits.defaultRoleLabel
    }));
    setPlayers(initialPlayers);
    setTeamName('');
    setStatusMessage(null);
    setMode('create');
  };

  // Change chip category handler
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    const titles = DIVISION_TITLES[category] || [];
    setSelectedTitle(titles[0] || 'Valorant');
    setMode('view');
    setStatusMessage(null);
  };

  // Handle Player Field Change
  const handlePlayerChange = (index, field, value) => {
    const updated = [...players];
    updated[index][field] = value;
    setPlayers(updated);
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    // Filter out rows where player name is blank
    const validPlayers = players.filter(p => p.name.trim() !== '');
    if (validPlayers.length === 0) {
      setStatusMessage({ type: 'error', text: 'You must add at least one player name to submit.' });
      setIsSubmitting(false);
      return;
    }

    const result = await createRoster(teamName, validPlayers);
    setIsSubmitting(false);

    if (result.success) {
      setStatusMessage({ type: 'success', text: `Team Roster "${teamName}" created and synced successfully!` });
      setMode('view');
      setTeamName('');
    } else {
      setStatusMessage({ type: 'error', text: result.error || 'Failed to submit team.' });
    }
  };

  // Filter rosters based on active filters
  const filteredRosters = existingRosters.filter(
    (r) => r.game_category === activeCategory && r.game_title === selectedTitle
  );

  const cardClass = 'bg-[#121620] border border-slate-800 p-6 md:p-8 rounded-2xl shadow-xl space-y-6 relative overflow-hidden';
  const headerAccent = 'border-l-4 border-cyan-500 pl-4 py-1';

  return (
    <div className="bg-[#0b0f19] min-h-screen text-slate-200 p-8 font-sans space-y-6 pt-28 pb-16 w-full max-w-7xl mx-auto">
      
      {/* Block 1: Header Box */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className={`space-y-1.5 ${headerAccent}`}>
          <span className="text-[10px] font-mono tracking-widest text-[#00b4d8] font-bold uppercase block">
            TEAM MANAGEMENT
          </span>
          <h1 className="text-3xl font-black uppercase text-white tracking-tight leading-none">
            Roster Organization Matrix
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Dynamic Team Construct Engine and Skill Metric Registry
          </p>
        </div>
        
        {/* Far-Right Neon Tag */}
        <div className="flex-shrink-0 self-start md:self-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest border border-cyan-500/30 bg-cyan-950/20 text-[#00b4d8] animate-pulse">
            Pipeline ACTIVE
          </span>
        </div>
      </div>

      {/* Block 2: Category Tabs */}
      <div className="flex flex-wrap items-center gap-3 bg-[#121620]/40 border border-slate-800/80 p-3 rounded-2xl">
        {Object.keys(DIVISION_TITLES).map((category) => {
          const isActive = activeCategory === category;
          return (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer border-none ${
                isActive 
                  ? 'bg-[#00b4d8] text-slate-950 shadow-md shadow-cyan-500/10' 
                  : 'border border-slate-800 bg-[#121620]/30 text-slate-400 hover:text-white hover:bg-slate-800/20'
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* Block 3: Active Esports Dropdown */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-[#121620]/20 border border-slate-800/60 p-5 rounded-2xl">
        <div className="flex-1 space-y-2">
          <label className="text-[9px] font-mono font-bold tracking-widest text-[#00b4d8] uppercase block">
            SELECT ACTIVE ESPORTS TITLE
          </label>
          <select
            value={selectedTitle}
            onChange={(e) => {
              setSelectedTitle(e.target.value);
              setMode('view');
              setStatusMessage(null);
            }}
            className="w-full max-w-md bg-[#121620] border border-slate-800 text-slate-200 rounded-xl px-4 py-3.5 text-xs font-mono uppercase tracking-wide focus:outline-none focus:border-cyan-500 transition-all"
          >
            {(DIVISION_TITLES[activeCategory] || []).map((title) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setMode('view');
              setStatusMessage(null);
            }}
            className={`px-4 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer border ${
              mode === 'view'
                ? 'bg-slate-800 text-white border-slate-700'
                : 'border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            View Existing Rosters
          </button>
          <button
            onClick={initRosterForm}
            className={`px-4 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer border ${
              mode === 'create'
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                : 'bg-[#00b4d8] text-slate-950 border-none hover:bg-[#0096c7]'
            }`}
          >
            Create New Roster
          </button>
        </div>
      </div>

      {/* Global Status Message */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-start gap-2.5 border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Loader view */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3 bg-[#121620]/30 rounded-2xl border border-slate-800">
          <RefreshCw className="w-6 h-6 animate-spin text-[#00b4d8]" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
            Querying Division Matrices...
          </span>
        </div>
      ) : mode === 'create' ? (
        
        /* Interactive Creation Form */
        <form onSubmit={handleSubmit} className={cardClass}>
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-sm font-black uppercase text-white tracking-wide">
              Create {selectedTitle} Roster
            </h2>
            <button
              type="button"
              onClick={() => setMode('view')}
              className="text-slate-500 hover:text-white transition-all cursor-pointer border-none bg-transparent"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Team Name Input */}
          <div className="space-y-2">
            <label className="text-[9px] font-mono font-bold tracking-widest text-[#00b4d8] uppercase block">
              Team Roster Name
            </label>
            <input
              type="text"
              placeholder="e.g. SLIIT Telemetry Tigers"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
              className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all font-sans"
            />
          </div>

          {/* Roster Slots Configuration */}
          <div className="space-y-4">
            <span className="text-[9px] font-mono font-bold tracking-widest text-[#00b4d8] uppercase block">
              Assign Participant Roster Slots
            </span>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {players.map((player, index) => (
                <div key={index} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                      Slot #{index + 1}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[8px] font-mono text-slate-400 uppercase">
                      Slot Limit
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Player/Student Full Name"
                      value={player.name}
                      onChange={(e) => handlePlayerChange(index, 'name', e.target.value)}
                      className="w-full bg-[#121620] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all"
                    />
                    <input
                      type="text"
                      placeholder="Role Label"
                      value={player.role}
                      onChange={(e) => handlePlayerChange(index, 'role', e.target.value)}
                      className="w-full bg-[#121620] border border-slate-800 rounded-lg px-3 py-2 text-[10px] text-slate-400 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create Submit Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setMode('view')}
              className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white cursor-pointer bg-transparent border-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#00b4d8] hover:bg-[#0096c7] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer border-none shadow-md"
            >
              {isSubmitting ? 'Syncing...' : 'Sync New Team'}
            </button>
          </div>

        </form>

      ) : filteredRosters.length === 0 ? (
        
        /* Block 5: Saved Team Roster View - FALLBACK CASE */
        <div className="flex flex-col items-center justify-center p-12 bg-[#121620]/30 rounded-2xl border border-slate-800 border-dashed text-center min-h-[40vh] space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-[#00b4d8]/10 border border-[#00b4d8]/20 flex items-center justify-center text-[#00b4d8] shadow-inner">
            <Users className="w-8 h-8" />
          </div>
          
          <div className="space-y-1">
            <h2 className="text-base font-black uppercase text-white tracking-wide">
              No Saved Rosters Found
            </h2>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              You have not established any active rosters for this esports division. Initialize a clean team construct to sync and assign roles.
            </p>
          </div>

          <button
            onClick={initRosterForm}
            className="bg-[#00b4d8] hover:bg-[#0096c7] text-slate-950 font-black py-3 px-6 rounded-xl text-xs uppercase tracking-widest cursor-pointer border-none shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 active:scale-95 transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            Create New Roster
          </button>
        </div>

      ) : (
        
        /* Saved Team Roster View - DATA RECORDS LIST */
        <div className="space-y-4">
          {filteredRosters.map((team) => (
            <div key={team.id} className={cardClass}>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <h3 className="text-base font-black uppercase text-white tracking-tight">
                    {team.team_name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Gamepad2 className="w-3.5 h-3.5 text-slate-600" />
                      {team.game_title}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-600" />
                      Created: {new Date(team.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <span className="bg-cyan-500/10 border border-cyan-500/20 text-[#00b4d8] px-3.5 py-1.5 rounded-xl text-[9px] font-mono font-bold uppercase tracking-widest">
                    Slots Filled: {team.team_rosters?.length || 0}
                  </span>
                </div>
              </div>

              {/* Roster member slots rows */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                {team.team_rosters && team.team_rosters.length > 0 ? (
                  team.team_rosters.map((player) => (
                    <div key={player.id} className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
                      <span className="text-xs font-bold text-slate-200 block uppercase tracking-wide">
                        {player.player_name}
                      </span>
                      <span className="text-[9px] text-[#00b4d8] font-mono uppercase tracking-wider block">
                        {player.player_role}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-4 flex items-center justify-center gap-2 bg-slate-950/30 border border-slate-900 rounded-xl">
                    <ShieldAlert className="w-4 h-4 text-slate-600" />
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                      Roster assignments empty.
                    </span>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>

      )}

    </div>
  );
};

export default RosterManagement;
