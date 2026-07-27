import React, { useState, useEffect, useCallback } from 'react';
import useRosterManagement from '../hooks/useRosterManagement';
import { GAME_ROSTER_SCHEMAS } from '../utils/rosterLimits';
import { Users, Gamepad2, Plus, Calendar, AlertCircle, CheckCircle, RefreshCw, X, ShieldAlert, Trash2, Pencil } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { getUiImageUrl } from '../utils/supabaseAssets';

const DIVISION_TITLES = {
  'Sim Racing': ['F1 25', 'Assetto Corsa'],
  'FPS Shooters': ['Valorant', 'CS2', 'Overwatch 2'],
  'MOBA': ['Dota 2', 'League of Legends'],
  'Battle Royale': ['Apex Legends', 'PUBG'],
  'Sports Gaming': ['FC 26']
};

const rawBaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const cleanBaseUrl = rawBaseUrl.replace(/\/rest\/v1\/?$/, '');
const SUPABASE_LOGO_BASE = `${cleanBaseUrl}/storage/v1/object/public/Logo`;

const GAME_LOGO_MAP = {
  // Sim Racing
  'assetto corsa': 'ASSETO CORSA LOGO.jpg',
  'assetto': 'ASSETO CORSA LOGO.jpg',
  'f1 25': 'F1 LOGO.png',
  'f1 game series': 'F1 LOGO.png',
  'f1': 'F1 LOGO.png',
  'sim racing': 'F1 LOGO.png',
  'assetto corsa competizione': 'ASSETO CORSA LOGO.jpg',

  // Sports Gaming
  'ea sports fc': 'FC LOGO.png',
  'fc 25': 'FC LOGO.png',
  'fc': 'FC LOGO.png',
  'fifa': 'FC LOGO.png',

  // FPS & Battle Royale
  'counter-strike 2': 'CS 2 LOGO.webp',
  'cs2': 'CS 2 LOGO.webp',
  'valorant': 'VALORANT LOGO.jpg',
  'apex legends': 'APEX LOGO.jpg',
  'apex': 'APEX LOGO.jpg',
  'overwatch 2': 'OVERWATCH 2 LOGO.jpg',
  'overwatch': 'OVERWATCH 2 LOGO.jpg',
  'pubg': 'PUBG LOGO.webp',
  'pubg mobile': 'PUBG LOGO.webp',

  // MOBA
  'dota 2': 'DOTA 2 LOGO.jpg',
  'dota': 'DOTA 2 LOGO.jpg',
  'league of legends': 'LOL LOGO.jpg',
  'lol': 'LOL LOGO.jpg'
};

const getGameLogoUrl = (gameTitle) => {
  if (!gameTitle) return `${SUPABASE_LOGO_BASE}/F1%20LOGO.png`;

  // 1. Strip extra spaces, lowercase, and remove parenthetical details like "(Racing Simulation)"
  const cleanedTitle = gameTitle
    .toLowerCase()
    .replace(/\s+/g, ' ')               // Collapse multiple spaces into single space
    .replace(/\(.*\)/g, '')             // Strip anything inside parentheses
    .trim();

  // 2. Check direct map key or partial match
  let matchedFilename = GAME_LOGO_MAP[cleanedTitle];

  if (!matchedFilename) {
    const foundKey = Object.keys(GAME_LOGO_MAP).find((key) => cleanedTitle.includes(key));
    matchedFilename = foundKey ? GAME_LOGO_MAP[foundKey] : 'F1 LOGO.png';
  }

  return `${SUPABASE_LOGO_BASE}/${encodeURIComponent(matchedFilename)}`;
};

const SUPABASE_UI_BASE = `${cleanBaseUrl}/storage/v1/object/public/UI`;
const VALORANT_BANNER_URL = `${SUPABASE_UI_BASE}/VALORANT%20i.jpg`;
const ROSTER_BANNERS = ['ROSTER i.jpg', 'ROSTER ii.jpg', 'ROSTER iii.webp'];

const getGameBannerUrl = (gameTitle) => {
  if (!gameTitle) return '';
  const title = gameTitle.toLowerCase().trim();

  // Map F1 titles explicitly to F1 i image in UI bucket
  if (title.includes('f1') || title.includes('formula 1')) {
    return `${SUPABASE_UI_BASE}/F1%20i.avif`;
  }

  if (title.includes('valorant')) {
    return `${SUPABASE_UI_BASE}/VALORANT%20i.jpg`;
  }

  if (title.includes('dota')) {
    return `${SUPABASE_UI_BASE}/DOTA%20iii.avif`;
  }

  if (title.includes('assetto')) {
    return `${SUPABASE_UI_BASE}/AC%20iii.jpg`;
  }

  return '';
};

const GAME_ART_MAP = {
  'F1 25': {
    banner: getUiImageUrl('AC i.jpg'),
    icon: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=150&h=150&q=80',
    genre: 'Racing Simulation'
  },
  'Assetto Corsa': {
    banner: getUiImageUrl('AC iii.jpg'),
    icon: 'https://images.unsplash.com/photo-1605558202138-0c7f68865844?auto=format&fit=crop&w=150&h=150&q=80',
    genre: 'Racing Simulation'
  },
  'Valorant': {
    banner: VALORANT_BANNER_URL,
    icon: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=150&h=150&q=80',
    genre: 'Tactical Shooter'
  },
  'CS2': {
    banner: getUiImageUrl('PUBG i.jpg'),
    icon: 'https://images.unsplash.com/photo-1553481187-be93c21490a9?auto=format&fit=crop&w=150&h=150&q=80',
    genre: 'Tactical Shooter'
  },
  'Overwatch 2': {
    banner: getUiImageUrl('OVERWATCH 2 i.jpg'),
    icon: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=150&h=150&q=80',
    genre: 'Hero Shooter'
  },
  'Dota 2': {
    banner: getUiImageUrl('DOTA i.webp'),
    icon: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=150&h=150&q=80',
    genre: 'MOBA'
  },
  'League of Legends': {
    banner: getUiImageUrl('LOL ii.webp'),
    icon: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=150&h=150&q=80',
    genre: 'MOBA'
  },
  'Apex Legends': {
    banner: getUiImageUrl('APEX iii.jpg'),
    icon: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=150&h=150&q=80',
    genre: 'Battle Royale'
  },
  'PUBG': {
    banner: getUiImageUrl('PUBG ii.jpg'),
    icon: 'https://images.unsplash.com/photo-1553481187-be93c21490a9?auto=format&fit=crop&w=150&h=150&q=80',
    genre: 'Battle Royale'
  },
  'FC 26': {
    banner: getUiImageUrl('FC ii.jpg'),
    icon: 'https://images.unsplash.com/photo-1579952360673-2a04154024be?auto=format&fit=crop&w=150&h=150&q=80',
    genre: 'Sports Simulation'
  }
};

export const RosterManagement = () => {
  const {
    activeCategory,
    setActiveCategory,
    selectedTitle,
    setSelectedTitle,
    existingRosters: rosters,
    setExistingRosters: setRosters,
    isLoading,
    createRoster
  } = useRosterManagement();

  const [bannerIndex, setBannerIndex] = useState(0);

  const handleNextBanner = useCallback(() => {
    setBannerIndex((prev) => (prev + 1) % ROSTER_BANNERS.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(handleNextBanner, 10000);
    return () => clearInterval(timer);
  }, [handleNextBanner]);

  // Mode: 'view' or 'create'
  const [mode, setMode] = useState('view');

  // Create form states
  const [teamName, setTeamName] = useState('');
  const [players, setPlayers] = useState([]);

  // Feedback states
  const [statusMessage, setStatusMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auth Context User state
  const [currentUserId, setCurrentUserId] = useState(null);

  // Custom Roster Deletion confirmation states
  const [confirmDeleteRoster, setConfirmDeleteRoster] = useState(null);
  const [rosterToUndoDelete, setRosterToUndoDelete] = useState(null);
  const [undoCountdown, setUndoCountdown] = useState(10);
  const [isUndoDeleting, setIsUndoDeleting] = useState(false);
  const [showRosterCancelToast, setShowRosterCancelToast] = useState(false);

  // Custom Roster Edit states
  const [editingRoster, setEditingRoster] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', game_title: '', team_members: [] });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getUser();
  }, []);

  const userHasRosterForGame = (gameTitle) => {
    if (!currentUserId || !gameTitle) return false;
    return rosters.some(
      (roster) =>
        (roster.created_by === currentUserId || roster.user_id === currentUserId) &&
        roster.game_title?.toLowerCase() === gameTitle.toLowerCase()
    );
  };

  const hasExistingRoster = userHasRosterForGame(selectedTitle);

  // Initialize players list based on title limits
  const initRosterForm = () => {
    if (hasExistingRoster) {
      setStatusMessage({
        type: 'error',
        text: `Roster Limit Exceeded: You can only create one team roster per game title ("${selectedTitle}"). Delete your existing roster for this title to establish a new one.`
      });
      return;
    }
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

  // Start the 10-second undo countdown workflow
  const startUndoDeleteTimer = (roster) => {
    setRosterToUndoDelete(roster);
    setUndoCountdown(10);
    setIsUndoDeleting(true);
    setShowRosterCancelToast(false);
  };

  const handleUndoRosterDelete = () => {
    setIsUndoDeleting(false);
    setUndoCountdown(10);
    setRosterToUndoDelete(null);
    setShowRosterCancelToast(true);
    setTimeout(() => {
      setShowRosterCancelToast(false);
    }, 3000);
  };

  const executeRosterDelete = useCallback(async (rosterId) => {
    try {
      // 1. Delete associated team members first if stored in a relational table
      await supabase.from('team_rosters').delete().eq('team_id', rosterId);

      // 2. Delete the main roster entry
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', rosterId);

      if (error) {
        console.error("Supabase Roster Delete Error:", error.message, error.details);
        alert(`Failed to delete roster: ${error.message}`);
        return;
      }

      // 3. Immediately filter local state so the UI updates without requiring page reload
      setRosters((prevRosters) => prevRosters.filter((r) => r.id !== rosterId));

      console.log("Roster deleted successfully!");
    } catch (err) {
      console.error("Unexpected error during deletion:", err);
    }
  }, [setRosters]);

  useEffect(() => {
    let timer;
    if (isUndoDeleting && undoCountdown > 0) {
      timer = setInterval(() => {
        setUndoCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isUndoDeleting && undoCountdown === 0) {
      setIsUndoDeleting(false);
      if (rosterToUndoDelete) {
        executeRosterDelete(rosterToUndoDelete.id);
      }
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isUndoDeleting, undoCountdown, rosterToUndoDelete, executeRosterDelete]);

  // Edit Roster Handlers
  const startEditingRoster = (team) => {
    setEditingRoster(team);

    // Resolve limits for the title to see how many slots are allowed
    const limits = GAME_ROSTER_SCHEMAS[team.game_title] || { maxSlots: 5, defaultRoleLabel: 'Active Player' };

    // Map existing members to slots, pad with empty slots if needed to reach maxSlots
    const currentMembers = team.team_rosters || [];
    const paddedPlayers = Array.from({ length: limits.maxSlots }, (_, index) => {
      const existing = currentMembers[index];
      return {
        name: existing ? existing.player_name : '',
        role: existing ? existing.player_role : limits.defaultRoleLabel
      };
    });

    setEditFormData({
      name: team.team_name,
      game_title: team.game_title,
      team_members: paddedPlayers
    });
  };

  const handleEditPlayerChange = (index, field, value) => {
    const updatedMembers = [...editFormData.team_members];
    updatedMembers[index][field] = value;
    setEditFormData({
      ...editFormData,
      team_members: updatedMembers
    });
  };

  const handleUpdateRosterSubmit = async (e) => {
    e.preventDefault();
    if (!editingRoster) return;

    if (!editFormData.name || editFormData.name.trim() === '') {
      setStatusMessage({ type: 'error', text: 'Roster team name is required.' });
      return;
    }

    const validPlayers = editFormData.team_members.filter(p => p.name.trim() !== '');
    if (validPlayers.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please add at least one player name to the roster.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      // 1. Update the team name in 'teams'
      const { error: teamErr } = await supabase
        .from('teams')
        .update({ team_name: editFormData.name.trim() })
        .eq('id', editingRoster.id);

      if (teamErr) throw teamErr;

      // 2. Clear old members of this team
      await supabase
        .from('team_rosters')
        .delete()
        .eq('team_id', editingRoster.id);

      // 3. Insert new members
      const limits = GAME_ROSTER_SCHEMAS[editingRoster.game_title] || { maxSlots: 5, defaultRoleLabel: 'Active Player' };
      const rosterRows = validPlayers.map(player => ({
        team_id: editingRoster.id,
        player_name: player.name.trim(),
        player_role: player.role || limits.defaultRoleLabel
      }));

      const { error: rosterErr, data: insertedRosters } = await supabase
        .from('team_rosters')
        .insert(rosterRows)
        .select();

      if (rosterErr) throw rosterErr;

      // 4. Update the local state so the UI updates instantly
      setRosters((prevRosters) =>
        prevRosters.map((team) => {
          if (team.id === editingRoster.id) {
            return {
              ...team,
              team_name: editFormData.name.trim(),
              team_rosters: insertedRosters || rosterRows
            };
          }
          return team;
        })
      );

      setEditingRoster(null);
      setStatusMessage({ type: 'success', text: `Team Roster "${editFormData.name}" updated successfully.` });
    } catch (err) {
      console.error('Failed to update team roster:', err);
      setStatusMessage({ type: 'error', text: `Failed to save changes: ${err.message || err}` });
    } finally {
      setIsSubmitting(false);
    }
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
  const filteredRosters = rosters.filter(
    (r) => r.game_category === activeCategory && r.game_title === selectedTitle
  );

  const cardClass = 'bg-[#121620] border border-slate-800 p-6 md:p-8 rounded-2xl shadow-xl space-y-6 relative overflow-hidden';

  return (
    <div className="bg-[#0b0f19] min-h-screen text-slate-200 p-8 font-sans space-y-6 pt-28 pb-16 w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16">

      {/* High-tech Backdrop Hero Banner */}
      <div
        onClick={handleNextBanner}
        className="relative w-full min-h-[320px] md:min-h-[400px] rounded-3xl overflow-hidden border border-cyan-500/30 bg-[#111622] shadow-2xl cursor-pointer group mb-8 select-none transition-all hover:border-cyan-400/60"
      >
        {/* Animated Background Banner with Top-Focused Framing */}
        {ROSTER_BANNERS.map((banner, index) => (
          <div
            key={banner}
            className={`absolute inset-0 bg-cover bg-[center_top_15%] transition-all duration-1000 ease-in-out pointer-events-none transform group-hover:scale-102 ${index === bannerIndex ? 'opacity-40 scale-100' : 'opacity-0 scale-105'
              }`}
            style={{ backgroundImage: `url(${SUPABASE_UI_BASE}/${encodeURIComponent(banner)})` }}
          />
        ))}

        {/* High-Contrast Cyber Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#111622]/90 via-[#111622]/50 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111622] via-transparent to-transparent pointer-events-none" />

        {/* Overlay Content & Controls */}
        <div className="relative z-10 h-full p-6 md:p-10 flex flex-col justify-between pointer-events-none min-h-[320px] md:min-h-[400px]">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              TEAM MANAGEMENT
            </span>

          </div>

          <div className="mt-auto pt-8">
            <h2 className="text-2xl md:text-4xl font-black text-white tracking-wide uppercase drop-shadow-lg">
              Roster Organization Matrix
            </h2>
            <p className="text-xs md:text-sm text-slate-200 mt-1.5 max-w-xl drop-shadow-md">
              Register active players, edit dynamic roster details, and assign dedicated positions for optimized esports performance.
            </p>
          </div>

          {/* Pagination Indicators */}
          <div className="flex items-center gap-1.5 pt-4">
            {ROSTER_BANNERS.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === bannerIndex
                    ? 'w-8 bg-cyan-400 shadow-sm shadow-cyan-400/50'
                    : 'w-2 bg-slate-700/80'
                  }`}
              />
            ))}
          </div>
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
              className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer border-none ${isActive
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
            className={`px-4 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer border ${mode === 'view'
              ? 'bg-slate-800 text-white border-slate-700'
              : 'border-slate-800 text-slate-400 hover:text-white'
              }`}
          >
            View Existing Rosters
          </button>
          <button
            onClick={initRosterForm}
            disabled={hasExistingRoster}
            className={`px-4 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all border ${hasExistingRoster
              ? 'bg-slate-800 text-slate-500 border-slate-900 cursor-not-allowed opacity-50'
              : mode === 'create'
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 cursor-pointer'
                : 'bg-[#00b4d8] text-slate-950 border-none hover:bg-[#0096c7] cursor-pointer'
              }`}
          >
            Create New Roster
          </button>
        </div>
      </div>

      {/* Roster Limit Notification Alert banner */}
      {hasExistingRoster && mode === 'view' && (
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 text-amber-200 text-xs leading-relaxed animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Roster Limit Reached:</span> You have already established a synced team roster for the game title <span className="font-semibold text-cyan-400">"{selectedTitle}"</span>. To manage a different team for this game title, you must delete your existing roster first.
          </div>
        </div>
      )}

      {/* Global Status Message */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-start gap-2.5 border ${statusMessage.type === 'success'
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
            disabled={hasExistingRoster}
            className={`font-black py-3 px-6 rounded-xl text-xs uppercase tracking-widest border-none transition-all inline-flex items-center gap-2 ${hasExistingRoster
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
              : 'bg-[#00b4d8] hover:bg-[#0096c7] text-slate-950 cursor-pointer shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 active:scale-95'
              }`}
          >
            <Plus className="w-4 h-4" />
            Create New Roster
          </button>
        </div>

      ) : (

        /* Saved Team Roster View - DATA RECORDS LIST */
        <div className="space-y-4">
          {filteredRosters.map((team) => {
            const art = GAME_ART_MAP[team.game_title] || {
              banner: 'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?auto=format&fit=crop&w=800&q=80',
              icon: 'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?auto=format&fit=crop&w=150&h=150&q=80',
              genre: 'Competitive eSports'
            };
            return (
              <div key={team.id} className="relative overflow-hidden rounded-2xl bg-[#121620]/60 border border-slate-800 p-6 md:p-8 shadow-xl space-y-6 group hover:border-cyan-500/50 transition-all duration-300 backdrop-blur-md">
                {/* Background Game Art Layer */}
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-10 group-hover:opacity-25 transition-opacity duration-300 pointer-events-none"
                  style={{ backgroundImage: `url(${getGameBannerUrl(team.game_title) || art.banner})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#121620] via-[#121620]/95 to-transparent pointer-events-none" />

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-4">
                    <img src={getGameLogoUrl(team.game_title)} alt={team.game_title} className="w-12 h-12 rounded-xl object-cover border border-cyan-500/30 shadow-md flex-shrink-0 bg-slate-900/80" />
                    <div className="space-y-1">
                      <h3 className="text-base font-black uppercase text-white tracking-tight flex flex-wrap items-center gap-2.5">
                        {team.team_name}
                        {team.user_id === currentUserId && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 uppercase tracking-wider shadow-sm shadow-cyan-500/20 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                            Owned
                          </span>
                        )}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Gamepad2 className="w-3.5 h-3.5 text-slate-500" />
                          {team.game_title} ({art.genre})
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          Created: {new Date(team.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="bg-cyan-500/10 border border-cyan-500/20 text-[#00b4d8] px-3.5 py-1.5 rounded-xl text-[9px] font-mono font-bold uppercase tracking-widest">
                      Slots Filled: {team.team_rosters?.length || 0}
                    </span>
                    {team.user_id === currentUserId && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEditingRoster(team)}
                          className="border border-slate-700 text-slate-300 hover:bg-slate-800 p-2 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center bg-transparent"
                          title="Edit Roster"
                        >
                          <Pencil className="w-4.5 h-4.5 text-cyan-400" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteRoster({ id: team.id, name: team.team_name })}
                          className="border border-red-500/30 text-red-400 hover:bg-red-500/10 p-2 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center bg-transparent"
                          title="Delete Roster"
                        >
                          <Trash2 className="w-4.5 h-4.5 text-red-500" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Roster member slots rows */}
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                  {team.team_rosters && team.team_rosters.length > 0 ? (
                    team.team_rosters.map((player) => (
                      <div key={player.id} className="p-4 bg-slate-950/40 backdrop-blur-sm border border-slate-800/60 rounded-xl flex items-center gap-3 hover:border-cyan-500/30 transition-all">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs uppercase shadow-inner">
                          {player.player_name.slice(0, 2)}
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-200 block uppercase tracking-wide">
                            {player.player_name}
                          </span>
                          <span className="text-[9px] text-[#00b4d8] font-mono uppercase tracking-wider block">
                            {player.player_role}
                          </span>
                        </div>
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
            );
          })}
        </div>

      )}

      {/* Custom Roster Deletion confirmation modal matching dark cyber theme */}
      {confirmDeleteRoster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          {/* Modal Card */}
          <div className="bg-[#111622] border border-red-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
            {/* Red Accent Top Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-amber-500" />

            {/* Header Icon & Title */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-none">Delete Roster</h3>
                <p className="text-[10px] text-slate-400 mt-1">This action will initiate temporary deletion.</p>
              </div>
            </div>

            {/* Modal Description */}
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-cyan-400">"{confirmDeleteRoster.name}"</span>?
              You will have <span className="text-amber-400 font-semibold">10 seconds</span> to undo this action before it is permanently removed.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteRoster(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const rosterToProcess = confirmDeleteRoster;
                  setConfirmDeleteRoster(null);
                  startUndoDeleteTimer(rosterToProcess);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-600/30 cursor-pointer border-none"
              >
                Yes, Delete Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Roster Deletion Undo Toast */}
      {isUndoDeleting && rosterToUndoDelete && (
        <div className="fixed bottom-6 right-6 z-[100] bg-[#111622] border border-red-500/30 rounded-2xl p-5 shadow-2xl flex items-center justify-between gap-6 max-w-md w-full animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <span className="font-mono font-bold text-sm">{undoCountdown}s</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Deleting Roster</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Removing <span className="font-semibold text-cyan-400">"{rosterToUndoDelete.name}"</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleUndoRosterDelete}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 border-none cursor-pointer"
          >
            Undo
          </button>
        </div>
      )}

      {/* Floating Undo Cancellation Success Notification Toast */}
      {showRosterCancelToast && (
        <div className="fixed bottom-6 right-6 z-[100] bg-[#111622] border border-emerald-500/30 rounded-2xl p-4 shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom duration-300">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider leading-none">Deletion Aborted</h4>
            <p className="text-[10px] text-slate-400 mt-1">Roster has been restored successfully.</p>
          </div>
        </div>
      )}

      {/* Edit Roster Modal overlay matching dark cyber theme */}
      {editingRoster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
          {/* Modal Container */}
          <div className="bg-[#111622] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 md:p-8 shadow-2xl relative space-y-6 my-8">
            {/* Cyan Accent Top Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00b4d8] to-cyan-400" />

            {/* Header Section */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono tracking-widest text-[#00b4d8] font-bold uppercase block">
                  EDIT TEAM CONFIGURATION
                </span>
                <h3 className="text-xl font-black uppercase text-white tracking-tight leading-none">
                  Modify {editingRoster.game_title} Roster
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingRoster(null)}
                className="text-slate-500 hover:text-white transition-all cursor-pointer border-none bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateRosterSubmit} className="space-y-6">
              {/* Team Name Input */}
              <div className="space-y-2">
                <label className="text-[9px] font-mono font-bold tracking-widest text-slate-400 uppercase block">
                  Team Roster Identifier (Name)
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="e.g. Alpha Squad"
                  className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all font-sans"
                  required
                />
              </div>

              {/* Roster Slots Configuration */}
              <div className="space-y-4">
                <span className="text-[9px] font-mono font-bold tracking-widest text-[#00b4d8] uppercase block">
                  Assign Participant Roster Slots
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {editFormData.team_members.map((player, index) => (
                    <div key={index} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                          Slot #{index + 1}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[8px] font-mono text-slate-400 uppercase">
                          Participant Slot
                        </span>
                      </div>

                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Player/Student Full Name"
                          value={player.name}
                          onChange={(e) => handleEditPlayerChange(index, 'name', e.target.value)}
                          className="w-full bg-[#121620] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all"
                        />
                        <input
                          type="text"
                          placeholder="Role Label"
                          value={player.role}
                          onChange={(e) => handleEditPlayerChange(index, 'role', e.target.value)}
                          className="w-full bg-[#121620] border border-slate-800 rounded-lg px-3 py-2 text-[10px] text-slate-400 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Edit Submit Footer */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingRoster(null)}
                  className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white cursor-pointer bg-transparent border-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#00b4d8] hover:bg-[#0096c7] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer border-none shadow-md shadow-cyan-500/10 hover:shadow-cyan-500/20 transition-all"
                >
                  {isSubmitting ? 'Saving Changes...' : 'Save Roster Modifications'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default RosterManagement;
