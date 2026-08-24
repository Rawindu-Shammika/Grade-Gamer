import React, { useState, useEffect, useCallback } from 'react';
import useRosterManagement from '../hooks/useRosterManagement';
import { GAME_ROSTER_SCHEMAS } from '../utils/rosterLimits';
import { Users, Gamepad2, Plus, Calendar, AlertCircle, CheckCircle, RefreshCw, X, ShieldAlert, Trash2, Pencil, LogOut, AlertTriangle, Crown } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { getBannerImageUrl, getUiImageUrl, SUPABASE_UI_BASE } from '../utils/supabaseAssets';
import CreateRosterModal from '../components/CreateRosterModal';
import useAuth from '../hooks/useAuth';
import PlayerInviteSearch from '../components/PlayerInviteSearch';
import ScheduleMatchModal from '../components/ScheduleMatchModal';

const DIVISION_TITLES = {
  'Sim Racing': ['F1 25', 'Assetto Corsa'],
  'FPS Shooters': ['Valorant', 'CS2', 'Overwatch 2'],
  'MOBA': ['Dota 2', 'League of Legends'],
  'Battle Royale': ['Apex Legends', 'PUBG'],
  'Sports Gaming': ['FC 26']
};

export const GENRE_GAMES_MAP = {
  'SIM RACING': ['F1 25', 'Assetto Corsa', 'Sim Racing'],
  'FPS SHOOTERS': ['Valorant', 'CS2', 'Counter-Strike 2', 'Overwatch 2'],
  'MOBA': ['Dota 2', 'Dota2', 'League of Legends'],
  'BATTLE ROYALE': ['Apex Legends', 'PUBG', 'Fortnite'],
  'SPORTS GAMING': ['Rocket League', 'FIFA', 'FC 26']
};

export const GAME_TACTICAL_ROLES = {
  // Tactical FPS
  Valorant: [
    'Controller',
    'Initiator',
    'Duelist',
    'Sentinel',
    'Flex / Sub'
  ],
  CS2: [
    'Entry Fragger',
    'AWPer / Sniper',
    'Support',
    'Lurker',
    'Rifler / Anchor'
  ],
  // Sim Racing / Motorsport
  'F1 25': [
    'Primary Driver (Seat 1)',
    'Secondary Driver (Seat 2)',
    'Reserve Driver',
    'Race Strategist / Engineer'
  ],

  'Assetto Corsa': [
    'Lead Driver',
    'Secondary Driver',
    'Endurance Co-Driver',
    'Setup & Telemetry Engineer'
  ],
  'Sim Racing': [
    'Lead Driver',
    'Secondary Driver',
    'Reserve / Test Driver',
    'Race Engineer'
  ],
  // Battle Royale
  'Apex Legends': [
    'Fragger / Entry',
    'Recon / Anchor',
    'Support / Flex'
  ],
  // MOBA
  'League of Legends': [
    'Top Laner',
    'Jungler',
    'Mid Laner',
    'ADC / Bot',
    'Support'
  ],
  Dota2: [
    'Position 1 (Carry)',
    'Position 2 (Mid)',
    'Position 3 (Offlane)',
    'Position 4 (Soft Support)',
    'Position 5 (Hard Support)'
  ],
  'Rocket League': [
    'Striker / First Man',
    'Midfield / Second Man',
    'Goalkeeper / Third Man',
    'Substitute'
  ]
};

// Helper to get available roles with fallback
export const getGameTacticalRoles = (gameTitle) => {
  if (!gameTitle) return ['Starter', 'Support', 'Flex', 'Substitute'];
  
  // Exact match
  if (GAME_TACTICAL_ROLES[gameTitle]) {
    return GAME_TACTICAL_ROLES[gameTitle];
  }

  // Partial match fallback
  const lower = gameTitle.toLowerCase();
  if (lower.includes('valorant')) return GAME_TACTICAL_ROLES['Valorant'];
  if (lower.includes('f1')) return GAME_TACTICAL_ROLES['F1 25'];
  if (lower.includes('assetto')) return GAME_TACTICAL_ROLES['Assetto Corsa'];
  if (lower.includes('sim') || lower.includes('racing')) return GAME_TACTICAL_ROLES['Sim Racing'];
  if (lower.includes('apex')) return GAME_TACTICAL_ROLES['Apex Legends'];
  if (lower.includes('cs') || lower.includes('counter')) return GAME_TACTICAL_ROLES['CS2'];
  if (lower.includes('league') || lower.includes('lol')) return GAME_TACTICAL_ROLES['League of Legends'];
  if (lower.includes('dota')) return GAME_TACTICAL_ROLES['Dota2'];
  if (lower.includes('rocket')) return GAME_TACTICAL_ROLES['Rocket League'];

  return ['Starter', 'Support', 'Flex', 'Substitute'];
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

const VALORANT_BANNER_URL = getBannerImageUrl('VALORANT i.jpg', '/banners/Valo1.jpg');
const ROSTER_BANNERS = [
  { remote: 'ROSTER i.jpg', fallback: '/banners/Esports.jpg' },
  { remote: 'ROSTER ii.jpg', fallback: '/banners/Valo2.jpg' },
  { remote: 'ROSTER iii.webp', fallback: '/banners/profile_resume.jpg' }
];

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
    selectedTitle,
    setSelectedTitle,
    existingRosters: rosters,
    setExistingRosters: setRosters,
    isLoading,
    createRoster,
    refreshRosters
  } = useRosterManagement();

  const { user, profile } = useAuth();
  
  const registeredTitles = profile?.esports_titles?.length ? profile.esports_titles : ['Valorant'];

  useEffect(() => {
    if (registeredTitles.length > 0 && !registeredTitles.includes(selectedTitle)) {
      setSelectedTitle(registeredTitles[0]);
    }
  }, [registeredTitles, selectedTitle, setSelectedTitle]);

  const [leaveModalData, setLeaveModalData] = useState(null);
  const [selectedMemberToEdit, setSelectedMemberToEdit] = useState(null);

  const handleUpdateRole = async (memberUserId, newRole, teamId) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('team_id', teamId)
        .eq('user_id', memberUserId);

      if (error) throw error;
      refreshRosters();
    } catch (err) {
      console.error('Error updating member role:', err);
    }
  };

  const handleRemoveMemberFromDb = async (memberUserId, memberIgn, teamId, teamName) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', memberUserId);

      if (error) throw error;

      // Send notification to the removed player
      await supabase.from('notifications').insert({
        user_id: memberUserId,
        type: 'REMOVED_FROM_ROSTER',
        title: 'Roster Slot Vacated',
        message: `You were removed from the active roster for "${teamName}".`,
        is_read: false
      });

      refreshRosters();
    } catch (err) {
      console.error('Error removing member:', err);
    }
  };

  const [schedulingTeam, setSchedulingTeam] = useState(null);
  const [completionToast, setCompletionToast] = useState(null);

  const triggerCompletionToast = (matchName) => {
    setCompletionToast({ show: true, matchName });
    setTimeout(() => {
      setCompletionToast(null);
    }, 4000);
  };

  const [teamMatches, setTeamMatches] = useState({});

  const fetchAllTeamMatches = async () => {
    if (!rosters || rosters.length === 0) return;
    const teamIds = rosters.map(t => t.id);
    try {
      const { data, error } = await supabase
        .from('roster_matches')
        .select('*')
        .in('team_id', teamIds)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const grouped = {};
        data.forEach(match => {
          if (!grouped[match.team_id]) grouped[match.team_id] = [];
          grouped[match.team_id].push(match);
        });
        setTeamMatches(grouped);
      }
    } catch (err) {
      console.error('Error fetching team matches:', err);
    }
  };

  useEffect(() => {
    fetchAllTeamMatches();
  }, [rosters]);

  const handleConfirmMatchCompleted = async (matchId, eventName, teamName) => {
    try {
      const { error: updateError } = await supabase
        .from('roster_matches')
        .update({
          status: 'COMPLETED',
          completed_at: new Date().toISOString()
        })
        .eq('id', matchId);

      if (updateError) throw updateError;

      const { data: lineup, error: lineupError } = await supabase
        .from('match_lineup')
        .select('user_id')
        .eq('match_id', matchId);

      if (!lineupError && lineup) {
        const notifications = lineup.map(athlete => ({
          user_id: athlete.user_id,
          type: 'MATCH_COMPLETED',
          title: 'Match Completed',
          message: `Match Completed: Peer reviews are now unlocked for "${eventName}" in "${teamName}".`,
          is_read: false
        }));

        if (notifications.length > 0) {
          await supabase.from('notifications').insert(notifications);
        }
      }

      fetchAllTeamMatches();
      triggerCompletionToast(eventName);
    } catch (err) {
      console.error('Failed to confirm match completion:', err);
    }
  };

  const initiateLeaveRoster = (teamId, teamName, creatorId) => {
    setLeaveModalData({
      isOpen: true,
      teamId,
      teamName,
      creatorId
    });
  };

  const confirmLeaveRoster = async () => {
    if (!leaveModalData || !user?.id) return;
    const { teamId, teamName, creatorId } = leaveModalData;

    try {
      // Fetch leaving player details
      const { data: playerProfile } = await supabase
        .from('profiles')
        .select('in_game_name, unique_account_id')
        .eq('id', user.id)
        .maybeSingle();

      const playerName = playerProfile?.in_game_name || 'A player';
      const playerGgId = playerProfile?.unique_account_id || 'GG-000000';

      // 1. Delete user record from team_members
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', user.id);

      if (error) throw error;

      // 2. Also clean up any lingering accepted invitations for this roster
      await supabase
        .from('roster_invitations')
        .delete()
        .eq('team_id', teamId)
        .eq('receiver_id', user.id);

      // 3. Send persistent notification to the IGL (creatorId)
      if (creatorId && creatorId !== user.id) {
        await supabase.from('notifications').insert({
          user_id: creatorId,
          type: 'PLAYER_LEFT_ROSTER',
          title: 'Athlete Departed Roster',
          message: `${playerName} (${playerGgId}) has voluntarily left your active roster for "${teamName}". A roster slot is now vacant.`,
          is_read: false
        });
      }

      // 4. Display status message
      setStatusMessage({
        type: 'success',
        text: `You have successfully left ${teamName}.`
      });

      // 5. Close modal and refresh rosters list
      setLeaveModalData(null);
      if (refreshRosters) {
        await refreshRosters();
      }
    } catch (err) {
      console.error('Error leaving roster:', err);
      alert('Failed to leave roster: ' + (err.message || 'Unknown error'));
    }
  };

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

  const [searchQueries, setSearchQueries] = useState({});
  const [inviteStatus, setInviteStatus] = useState({}); // { [teamId]: { type: 'success' | 'error', text: string } }

  const handleInviteByGradeGamerId = async (team, targetIdInput) => {
    const inputVal = targetIdInput?.trim();
    if (!inputVal) {
      setInviteStatus(prev => ({ ...prev, [team.id]: { type: 'error', text: 'Please enter a GradeGamer ID.' } }));
      return;
    }

    try {
      setInviteStatus(prev => ({ ...prev, [team.id]: null }));

      // 1. Search profiles for matching unique_account_id
      const { data: foundPlayer, error: searchErr } = await supabase
        .from('profiles')
        .select('id, in_game_name, unique_account_id')
        .eq('unique_account_id', inputVal)
        .maybeSingle();

      if (searchErr) throw searchErr;
      if (!foundPlayer) {
        setInviteStatus(prev => ({ ...prev, [team.id]: { type: 'error', text: `No player found with GradeGamer ID "${inputVal}"` } }));
        return;
      }

      // 2. Validate that player is not already in the team
      const isAlreadyMember = team.team_members?.some(m => m.user_id === foundPlayer.id);
      if (isAlreadyMember) {
        setInviteStatus(prev => ({ ...prev, [team.id]: { type: 'error', text: `${foundPlayer.in_game_name || 'Player'} is already a member of this roster.` } }));
        return;
      }

      // Validate user is not inviting themselves
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (foundPlayer.id === user.id) {
        setInviteStatus(prev => ({ ...prev, [team.id]: { type: 'error', text: `You cannot invite yourself to the roster.` } }));
        return;
      }

      // Check if invitation already exists
      const { data: existingInvite } = await supabase
        .from('roster_invitations')
        .select('id, status')
        .eq('team_id', team.id)
        .eq('receiver_id', foundPlayer.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingInvite) {
        setInviteStatus(prev => ({ ...prev, [team.id]: { type: 'error', text: `An invitation for this player is already pending.` } }));
        return;
      }

      // 3. Insert record into public.roster_invitations
      const { error: inviteErr } = await supabase
        .from('roster_invitations')
        .insert({
          team_id: team.id,
          sender_id: user.id,
          receiver_id: foundPlayer.id,
          status: 'pending'
        });

      if (inviteErr) throw inviteErr;

      setInviteStatus(prev => ({
        ...prev,
        [team.id]: {
          type: 'success',
          text: `Invitation successfully sent to ${foundPlayer.in_game_name || 'Teammate'} (${foundPlayer.unique_account_id})!`
        }
      }));

      // Clear input
      setSearchQueries(prev => ({ ...prev, [team.id]: '' }));

      // Refresh data
      if (refreshRosters) {
        await refreshRosters();
      }

    } catch (err) {
      console.error('Error sending roster invitation:', err);
      setInviteStatus(prev => ({ ...prev, [team.id]: { type: 'error', text: err.message || 'Invitation failed.' } }));
    }
  };

  const normalizeGameTitle = (title) => {
    if (!title) return '';
    return title.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  const userHasRosterForGame = (gameTitle) => {
    if (!currentUserId || !gameTitle) return false;
    const targetNorm = normalizeGameTitle(gameTitle);
    return rosters.some((roster) => {
      const isCreator = roster.user_id === currentUserId || roster.created_by === currentUserId;
      if (!isCreator) return false;
      const rosterNorm = normalizeGameTitle(roster.game_title);
      return rosterNorm.includes(targetNorm) || targetNorm.includes(rosterNorm);
    });
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
      role: limits.defaultRoleLabel,
      platformId: ''
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
      await supabase.from('team_members').delete().eq('team_id', rosterId);

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
    setEditFormData({
      name: team.team_name,
      game_title: team.game_title,
      team_members: team.team_members ? [...team.team_members] : []
    });
  };

  const handleRemoveMember = (memberId) => {
    setEditFormData(prev => ({
      ...prev,
      team_members: prev.team_members.filter(m => m.id !== memberId)
    }));
  };

  const handleRoleChange = (memberId, newRole) => {
    setEditFormData(prev => ({
      ...prev,
      team_members: prev.team_members.map(m => m.id === memberId ? { ...m, role: newRole } : m)
    }));
  };

  const handleUpdateRosterSubmit = async (e) => {
    e.preventDefault();
    if (!editingRoster) return;

    if (!editFormData.name || editFormData.name.trim() === '') {
      setStatusMessage({ type: 'error', text: 'Roster name is required.' });
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

      // 2. Identify and delete removed team members
      const originalIds = editingRoster.team_members?.map(m => m.id) || [];
      const currentIds = editFormData.team_members.map(m => m.id);
      const removedIds = originalIds.filter(id => !currentIds.includes(id));

      if (removedIds.length > 0) {
        const { error: deleteErr } = await supabase
          .from('team_members')
          .delete()
          .in('id', removedIds);
        if (deleteErr) throw deleteErr;
      }

      // 3. Update roles for remaining members
      for (const member of editFormData.team_members) {
        const { error: updateMemberErr } = await supabase
          .from('team_members')
          .update({ role: member.role })
          .eq('id', member.id);
        if (updateMemberErr) throw updateMemberErr;
      }

      // 4. Refresh listings
      if (refreshRosters) {
        await refreshRosters();
      }

      setEditingRoster(null);
      setStatusMessage({ type: 'success', text: `Roster config "${editFormData.name}" updated successfully.` });
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
  const filteredRosters = rosters.filter((roster) => {
    const rosterGame = normalizeGameTitle(roster.game_title);
    const selectedDropdown = normalizeGameTitle(selectedTitle);

    if (selectedDropdown && selectedDropdown !== 'all') {
      return rosterGame.includes(selectedDropdown) || selectedDropdown.includes(rosterGame);
    }

    return registeredTitles.some(title => {
      const normTitle = normalizeGameTitle(title);
      return rosterGame.includes(normTitle) || normTitle.includes(rosterGame);
    });
  });

  const cardClass = 'bg-white dark:bg-[#121620] border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-2xl shadow-md dark:shadow-xl space-y-6 relative overflow-hidden';

  return (
    <div className="bg-slate-50 dark:bg-[#070b13] min-h-screen text-slate-900 dark:text-slate-100 font-sans space-y-6 pt-28 pb-16 w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16 selection:bg-cyan-500/30">

      {/* High-tech Backdrop Hero Banner */}
      <div
        onClick={handleNextBanner}
        className="relative w-full min-h-[320px] md:min-h-[400px] rounded-3xl overflow-hidden border border-slate-800 bg-[#070b13] shadow-2xl cursor-pointer group mb-8 select-none transition-all"
      >
        {/* Animated Background Banner with Top-Focused Framing */}
        {ROSTER_BANNERS.map((banner, index) => {
          const remoteUrl = getBannerImageUrl(banner.remote, banner.fallback);
          const fallbackUrl = banner.fallback;
          return (
            <div
              key={banner.remote || index}
              className={`w-full h-full object-cover absolute inset-0 transition-all duration-1000 ease-in-out pointer-events-none transform group-hover:scale-102 ${
                index === bannerIndex ? 'opacity-85 scale-100' : 'opacity-0 scale-105'
              }`}
              style={{ 
                backgroundImage: `linear-gradient(to right, rgba(7, 11, 19, 0.95), rgba(7, 11, 19, 0.65)), url(${remoteUrl}), url(${fallbackUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center top 15%'
              }}
            />
          );
        })}

        {/* High-Contrast Cyber Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070b13]/95 via-[#070b13]/70 to-transparent pointer-events-none" />

        {/* Overlay Content & Controls */}
        <div className="relative z-10 h-full p-6 md:p-10 flex flex-col justify-between pointer-events-none min-h-[320px] md:min-h-[400px]">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 uppercase tracking-widest backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              TEAM MANAGEMENT
            </span>

          </div>

          <div className="mt-auto pt-8">
            <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-wide uppercase drop-shadow-lg">
              Roster Organization Matrix
            </h2>
            <p className="text-xs md:text-sm text-slate-300 mt-1.5 max-w-xl drop-shadow-md font-mono">
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

      {/* Block 3: Active Esports Dropdown */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-slate-100 dark:bg-[#121620]/20 border border-slate-200 dark:border-slate-800/60 p-5 rounded-2xl">
        <div className="flex-1 space-y-2">
          <label className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold block">
            SELECT ACTIVE ESPORTS TITLE
          </label>
          <select
            value={selectedTitle}
            onChange={(e) => {
              setSelectedTitle(e.target.value);
              setMode('view');
              setStatusMessage(null);
            }}
            className="w-full max-w-md bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3.5 text-xs font-mono uppercase tracking-wide focus:outline-none focus:border-cyan-400 transition-all cursor-pointer text-slate-900 dark:text-white"
          >
            {registeredTitles.map((title) => (
              <option key={title} value={title} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
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
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700'
              : 'border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            View Existing Rosters
          </button>
          <button
            onClick={initRosterForm}
            disabled={hasExistingRoster}
            className={`px-4 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all border ${hasExistingRoster
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-900 cursor-not-allowed opacity-50'
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



      {/* Create Roster Modal Component */}
      <CreateRosterModal 
        isOpen={mode === 'create'} 
        onClose={() => setMode('view')} 
        onRosterCreated={refreshRosters} 
        currentUser={user} 
        selectedGame={selectedTitle}
      />

      {/* Roster Leave Custom Confirmation Modal */}
      {leaveModalData?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 dark:bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            {/* Accent glow bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-500"/>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 shrink-0">
                <AlertTriangle className="w-6 h-6"/>
              </div>
              
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-bold">
                  Departure Confirmation
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Leave Roster: {leaveModalData.teamName}
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed font-sans">
                  Are you sure you want to leave <span className="text-white font-semibold">{leaveModalData.teamName}</span>? You will forfeit your assigned slot and will need a new invitation from the IGL to rejoin.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setLeaveModalData(null)}
                className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs font-mono text-slate-300 hover:text-white hover:border-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLeaveRoster}
                className="px-4 py-2 rounded-xl bg-red-505 hover:bg-red-600 text-white text-xs font-mono font-bold transition shadow-[0_0_15px_rgba(239,68,68,0.3)] flex items-center gap-1.5 cursor-pointer border-none"
              >
                Confirm Departure
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loader view */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3 bg-white dark:bg-[#121620]/30 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
          <RefreshCw className="w-6 h-6 animate-spin text-[#00b4d8]" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-600 dark:text-slate-500">
            Querying Division Matrices...
          </span>
        </div>
      ) : mode === 'create' ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-[#121620]/30 rounded-2xl border border-slate-200 dark:border-slate-800 text-center min-h-[20vh] space-y-3 shadow-sm dark:shadow-none">
          <p className="text-xs text-slate-400">Modal editor is active. Close the squad creation window to return.</p>
          <button
            onClick={() => setMode('view')}
            className="px-4 py-2 bg-slate-800 text-slate-200 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-700 transition-all border border-slate-700"
          >
            Go Back
          </button>
        </div>

      ) : filteredRosters.length === 0 ? (

        /* Block 5: Saved Team Roster View - FALLBACK CASE */
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-[#121620]/30 rounded-2xl border border-slate-300 dark:border-slate-800 border-dashed text-center min-h-[40vh] space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-[#00b4d8]/10 border border-[#00b4d8]/20 flex items-center justify-center text-[#00b4d8] shadow-inner">
            <Users className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-black uppercase text-slate-900 dark:text-white tracking-wide">
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
              <div key={team.id} className="relative overflow-visible rounded-2xl bg-white dark:bg-[#121620]/60 border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-md dark:shadow-xl space-y-6 group hover:border-cyan-500/50 transition-all duration-300 backdrop-blur-md">
                {/* Background Game Art Layer */}
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-10 group-hover:opacity-25 transition-opacity duration-300 pointer-events-none"
                  style={{ backgroundImage: `url(${getGameBannerUrl(team.game_title) || art.banner})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white dark:from-[#121620] via-white/95 dark:via-[#121620]/95 to-transparent pointer-events-none" />

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-4">
                    <img src={getGameLogoUrl(team.game_title)} alt={team.game_title} className="w-12 h-12 rounded-xl object-cover border border-cyan-500/30 shadow-md flex-shrink-0 bg-slate-100 dark:bg-slate-900/80" />
                    <div className="space-y-1">
                      <h3 className="text-base font-black uppercase text-slate-900 dark:text-white tracking-tight flex flex-wrap items-center gap-2.5">
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

                  <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
                    <span className="bg-cyan-500/10 border border-cyan-500/20 text-[#00b4d8] px-3.5 py-1.5 rounded-xl text-[9px] font-mono font-bold uppercase tracking-widest">
                      Slots Filled: {team.team_members?.length || 0} / 5
                    </span>
                    {team.user_id === currentUserId && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setSchedulingTeam(team)}
                          className="border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 bg-transparent"
                          title="Schedule Match/Event"
                        >
                          <Calendar className="w-4 h-4 text-cyan-400" />
                          Schedule Event
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
                    {team.user_id !== user?.id && team.team_members?.some(m => m.user_id === user?.id) && (
                      <button
                        type="button"
                        onClick={() => initiateLeaveRoster(team.id, team.team_name, team.user_id)}
                        className="px-3.5 py-1.5 rounded-xl border border-red-500/40 bg-red-950/30 hover:bg-red-900/50 text-red-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(239,68,68,0.1)] cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Leave Roster
                      </button>
                    )}
                  </div>
                </div>

                {/* Scheduled Matches Section */}
                {teamMatches[team.id] && teamMatches[team.id].length > 0 && (
                  <div className="relative z-10 border-t border-slate-200 dark:border-slate-800/60 pt-4 pb-2 space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                        Squad Event Schedule
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
                      {teamMatches[team.id].map(match => (
                        <div key={match.id} className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-xl flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 font-mono">
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase">
                                {match.event_name}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-widest ${
                                match.status === 'COMPLETED'
                                  ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-400'
                                  : 'bg-amber-950/60 border border-amber-500/30 text-amber-400'
                              }`}>
                                {match.status}
                              </span>
                            </div>
                            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                              Category: {match.event_type} | Game: {match.game_title}
                            </div>
                          </div>
                          {match.status === 'SCHEDULED' && team.user_id === currentUserId && (
                            <button
                              type="button"
                              onClick={() => handleConfirmMatchCompleted(match.id, match.event_name, team.team_name)}
                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-1.5 px-3 rounded-lg text-[9px] uppercase tracking-wider transition-all cursor-pointer border-none shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                            >
                              Confirm Completed
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Roster member slots rows */}
                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                  {(() => {
                    const sortedMembers = [...(team.team_members || [])].sort((a, b) => {
                      if (a.role === 'IGL' || a.role === 'Leader') return -1;
                      if (b.role === 'IGL' || b.role === 'Leader') return 1;
                      return 0;
                    });

                    return sortedMembers.map((member) => {
                      const isIgl = currentUserId === team.user_id;
                      const memberIsCreator = member.user_id === team.user_id;
                      return (
                        <div
                          key={member.id}
                          onClick={() => {
                            if (isIgl) {
                              setSelectedMemberToEdit({
                                user_id: member.user_id,
                                in_game_name: member.profiles?.in_game_name || 'Athlete',
                                unique_account_id: member.profiles?.unique_account_id || '',
                                role: member.role || '',
                                isIgl: memberIsCreator,
                                team_id: team.id,
                                team_name: team.team_name,
                                game_title: team.game_title
                              });
                            }
                          }}
                          className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                            isIgl ? 'cursor-pointer hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] group' : ''
                          } ${
                            memberIsCreator
                              ? 'bg-slate-100 dark:bg-slate-900/80 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.06)]'
                              : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs uppercase shadow-inner flex-shrink-0">
                              {member.profiles?.in_game_name?.slice(0, 2) || 'PL'}
                            </div>
                            <div className="space-y-0.5 font-sans">
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-200 block uppercase tracking-wide group-hover:text-cyan-400 transition">
                                {member.profiles?.in_game_name || 'Esports Athlete'}
                              </span>
                              <span className="text-[9px] text-[#00b4d8] font-mono uppercase tracking-wider block">
                                GradeGamer ID: {member.profiles?.unique_account_id || 'GG-000000'}
                              </span>

                              {/* ATHLETE ROLE BADGES ROW */}
                              <div className="flex items-center gap-2 flex-wrap mt-2.5">
                                {/* 1. UNIVERSAL GREEN IGL BADGE (Rendered for roster creator across all games) */}
                                {memberIsCreator && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-950/80 border border-emerald-500/60 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                                    <Crown className="w-3 h-3 text-emerald-400"/>
                                    IGL / CAPTAIN
                                  </span>
                                )}

                                {/* 2. TACTICAL GAMEPLAY ROLE BADGE (Valorant Duelist/Controller, F1 Driver, Dota 2 Pos, etc.) */}
                                {member.role && member.role !== 'IGL' && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase tracking-wider bg-cyan-950/70 border border-cyan-500/40 text-cyan-300">
                                    {member.role}
                                  </span>
                                )}

                                {/* 3. FALLBACK FOR UNASSIGNED MEMBERS */}
                                {(!member.role || (memberIsCreator && member.role === 'IGL')) && !memberIsCreator && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase tracking-wider bg-slate-900 border border-slate-800 text-slate-400">
                                    Active Player
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {isIgl && (
                            <span className="text-[10px] font-mono text-slate-500 group-hover:text-cyan-400 transition opacity-0 group-hover:opacity-100 flex-shrink-0">
                              CONFIGURE ⚙
                            </span>
                          )}
                        </div>
                      );
                    });
                  })()}

                  {(!team.team_members || team.team_members.length === 0) && (
                    <div className="col-span-full py-4 flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-900 rounded-xl">
                      <ShieldAlert className="w-4 h-4 text-slate-600" />
                      <span className="text-[10px] font-mono text-slate-600 dark:text-slate-500 uppercase tracking-widest">
                        Roster assignments empty.
                      </span>
                    </div>
                  )}
                </div>

                {/* Pending Invites List */}
                {team.roster_invitations && team.roster_invitations.filter(i => i.status === 'pending').length > 0 && (
                  <div className="relative z-10 border-t border-slate-800/60 pt-4 space-y-2">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                      Awaiting Teammate Response
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {team.roster_invitations
                        .filter(i => i.status === 'pending')
                        .map((invite) => (
                          <div key={invite.id} className="p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-850 rounded-xl flex items-center justify-between gap-3">
                            <div className="font-sans">
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-300 block">
                                {invite.receiver?.in_game_name || 'Teammate'}
                              </span>
                              <span className="text-[9px] text-slate-600 dark:text-slate-500 font-mono mt-0.5 block">
                                GradeGamer ID: {invite.receiver?.unique_account_id}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[8px] font-black uppercase tracking-wider animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.1)]">
                              Awaiting Acceptance
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Interactive Player Invite Bar */}
                {team.user_id === currentUserId && (
                  <div className="relative z-10 border-t border-slate-200 dark:border-slate-800/80 pt-4 space-y-3">
                    <span className="text-[10px] font-mono font-bold text-[#00b4d8] uppercase tracking-widest block">
                      + Invite Player via GradeGamer ID
                    </span>

                    <PlayerInviteSearch 
                      teamId={team.id} 
                      onInviteSent={refreshRosters} 
                    />
                  </div>
                )}

              </div>
            );
          })}
        </div>

      )}

      {/* Custom Roster Deletion confirmation modal matching dark cyber theme */}
      {confirmDeleteRoster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 dark:bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          {/* Modal Card */}
          <div className="bg-white dark:bg-[#111622] border border-red-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
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
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-none">Delete Roster</h3>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">This action will initiate temporary deletion.</p>
              </div>
            </div>

            {/* Modal Description */}
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-6 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-cyan-400">"{confirmDeleteRoster.name}"</span>?
              You will have <span className="text-amber-500 dark:text-amber-400 font-semibold">10 seconds</span> to undo this action before it is permanently removed.
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
        <div className="fixed bottom-6 right-6 z-[100] bg-white dark:bg-[#111622] border border-red-500/30 rounded-2xl p-5 shadow-2xl flex items-center justify-between gap-6 max-w-md w-full animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 dark:text-red-400">
              <span className="font-mono font-bold text-sm">{undoCountdown}s</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Deleting Roster</h4>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">
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
        <div className="fixed bottom-6 right-6 z-[100] bg-white dark:bg-[#111622] border border-emerald-500/30 rounded-2xl p-4 shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom duration-300">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider leading-none">Deletion Aborted</h4>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">Roster has been restored successfully.</p>
          </div>
        </div>
      )}

      {/* Edit Roster Modal overlay matching dark cyber theme */}
      {editingRoster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 dark:bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
          {/* Modal Container */}
          <div className="bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 md:p-8 shadow-2xl relative space-y-6 my-8">
            {/* Cyan Accent Top Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00b4d8] to-cyan-400" />

            {/* Header Section */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono tracking-widest text-[#00b4d8] font-bold uppercase block">
                  EDIT TEAM CONFIGURATION
                </span>
                <h3 className="text-xl font-black uppercase text-slate-900 dark:text-white tracking-tight leading-none">
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
                <label className="text-[9px] font-mono font-bold tracking-widest text-slate-600 dark:text-slate-400 uppercase block">
                  Team Roster Identifier (Name)
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="e.g. Alpha Squad"
                  className="w-full max-w-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-900 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all font-sans font-semibold"
                  required
                />
              </div>

              {/* Roster Slots Configuration */}
              <div className="space-y-4">
                <span className="text-[9px] font-mono font-bold tracking-widest text-[#00b4d8] uppercase block">
                  Assign Participant Roster Slots
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {editFormData.team_members.map((member, index) => {
                    const isLeader = member.user_id === editingRoster.user_id;
                    const availableRoles = getGameTacticalRoles(editingRoster.game_title);

                    return (
                      <div key={member.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-500 uppercase">
                            Slot #{index + 1} {isLeader && '• ROSTER CREATOR'}
                          </span>
                          {!isLeader && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-red-500 hover:text-red-400 text-xs flex items-center gap-1 transition bg-transparent border-none cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </button>
                          )}
                        </div>

                        <div className="bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-850 rounded-xl p-3 font-sans flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-slate-200">{member.profiles?.in_game_name || 'Teammate'}</div>
                            <div className="text-[9.5px] font-mono text-cyan-500 dark:text-cyan-400 mt-1">GradeGamer ID: {member.profiles?.unique_account_id || 'GG-000000'}</div>
                          </div>
                          {isLeader && (
                            <span className="bg-[#00b4d8]/10 text-[#00b4d8] border border-[#00b4d8]/30 text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                              IGL / CAPTAIN
                            </span>
                          )}
                        </div>

                        <div>
                          <label className="text-[9px] font-mono font-bold tracking-widest text-slate-400 uppercase block mb-1">
                            {isLeader ? 'Assign IGL Tactical Role' : 'Assign Teammate Tactical Role'} ({editingRoster.game_title || 'General'})
                          </label>
                          <select
                            value={member.role || availableRoles[0]}
                            onChange={(e) => handleRoleChange(member.id, e.target.value)}
                            className="w-full bg-[#121620] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 transition-all font-sans font-semibold"
                          >
                            {availableRoles.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Edit Submit Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
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

      {/* Manage Athlete Slot Modal */}
      {selectedMemberToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 dark:bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-[#121620] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-emerald-500"/>

            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-850">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#00b4d8] font-bold block">
                  ROSTER SLOT MANAGEMENT
                </span>
                <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white mt-0.5 font-mono">
                  Configure {selectedMemberToEdit.in_game_name}
                </h3>
                <p className="text-[10px] font-mono text-slate-600 dark:text-slate-500">
                  {selectedMemberToEdit.unique_account_id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMemberToEdit(null)}
                className="p-2.5 min-w-[44px] min-h-[44px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl bg-transparent border-none cursor-pointer flex items-center justify-center"
              >
                <X className="w-5 h-5"/>
              </button>
            </div>

            <div className="space-y-4 my-5">
              <div>
                <label className="block text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 font-bold">
                  Assign Tactical Role ({selectedMemberToEdit.game_title})
                </label>
                <select
                  value={selectedMemberToEdit.role}
                  onChange={(e) =>
                    setSelectedMemberToEdit((prev) => prev ? { ...prev, role: e.target.value } : null)
                  }
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded-xl text-xs font-mono text-cyan-600 dark:text-[#00b4d8] focus:outline-none focus:border-cyan-500"
                >
                  {getGameTacticalRoles(selectedMemberToEdit.game_title).map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                  <option value="Active Player">Active Player</option>
                </select>
              </div>

              {/* Remove athlete option (disabled for IGL) */}
              {!selectedMemberToEdit.isIgl && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-red-500 dark:text-red-400 font-sans uppercase">Remove from Roster</p>
                    <p className="text-[10px] text-slate-600 dark:text-slate-500 font-mono">Vacate this roster slot immediately.</p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await handleRemoveMemberFromDb(
                        selectedMemberToEdit.user_id,
                        selectedMemberToEdit.in_game_name,
                        selectedMemberToEdit.team_id,
                        selectedMemberToEdit.team_name
                      );
                      setSelectedMemberToEdit(null);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-950/30 text-xs font-mono text-red-400 hover:bg-red-900/50 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5"/>
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedMemberToEdit(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-xs font-mono text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleUpdateRole(
                    selectedMemberToEdit.user_id,
                    selectedMemberToEdit.role,
                    selectedMemberToEdit.team_id
                  );
                  setSelectedMemberToEdit(null);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold transition shadow-[0_0_15px_rgba(6,182,212,0.3)] border-none cursor-pointer"
              >
                Save Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Match Modal */}
      <ScheduleMatchModal
        isOpen={!!schedulingTeam}
        onClose={() => setSchedulingTeam(null)}
        team={schedulingTeam}
        currentUser={user}
        onScheduled={fetchAllTeamMatches}
      />

      {/* Styled Event Completion Toast */}
      {completionToast?.show && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex items-center gap-3 bg-white/95 dark:bg-slate-900/95 border border-emerald-500/50 backdrop-blur-xl px-4 py-3 rounded-xl shadow-[0_0_25px_rgba(16,185,129,0.25)]">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400">
              <CheckCircle className="w-5 h-5"/>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-500 dark:text-emerald-400 font-bold">
                Match Event Finalized
              </div>
              <p className="text-xs text-slate-900 dark:text-slate-200 font-medium mt-0.5 font-sans">
                Match <span className="text-slate-900 dark:text-white font-semibold">"{completionToast.matchName}"</span> confirmed completed. Lineup notified.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCompletionToast(null)}
              className="ml-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 bg-transparent border-none cursor-pointer"
            >
              <X className="w-4 h-4"/>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default RosterManagement;
