import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import useAuth from '../hooks/useAuth';
import { calculateLCCMetrics } from '../utils/lccCalculator';
import { fetchCurrentValorantAct } from '../utils/valorantActService';
import { applyGlobalActReset } from '../utils/actDataSync';
import { syncDota2Account } from '../services/dotaSyncService';
import { syncLolAccount } from '../services/lolSyncService';
import { getDotaHeroName } from '../utils/dotaHeroes';
import { calculateDotaLinearGrowth } from '../utils/dotaStats';

export const AUTOMATED_GAMES = [
  'Valorant',
  'League of Legends',
  'Counter-Strike 2',
  'Dota 2',
  'Apex Legends',
  'PUBG',
  'F1 25',
  'Assetto Corsa'
];

const getTelemetryTable = (gameKey) => {
  const g = (gameKey || '').toLowerCase();
  if (g.includes('dota')) return 'dota2_match_telemetry';
  if (g.includes('lol') || g.includes('league')) return 'lol_match_telemetry';
  if (g.includes('cs') || g.includes('counter-strike')) return 'cs2_match_telemetry';
  if (g.includes('apex')) return 'apex_match_telemetry';
  if (g.includes('f1')) return 'f1_match_telemetry';
  return 'valorant_match_telemetry';
};

export const MANUAL_GAMES = [
  'EA FC 27'
];

// Supabase storage UI bucket reference
const SUPABASE_UI_BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/UI`;

// Only using the 2 requested images
const GAMEDATA_BANNERS = [
  'LOL i.jpg',
  'PUBG ii.jpg',
];

const formatLapTime = (sec) => {
  if (!sec || isNaN(sec)) return '--:--.---';
  const total = parseFloat(sec);
  const minutes = Math.floor(total / 60);
  const remainingSec = (total % 60).toFixed(3);
  return `${minutes}:${remainingSec < 10 ? '0' : ''}${remainingSec}`;
};

export default function GameData() {
  const { user, profile } = useAuth();
  const [activeTitles, setActiveTitles] = useState(() => (
    profile?.esports_titles?.length 
      ? profile.esports_titles 
      : (profile?.active_titles?.length ? profile.active_titles : ['Valorant', 'League of Legends', 'Dota 2', 'Counter-Strike 2', 'Assetto Corsa', 'F1 25'])
  ));
  const [selectedGame, setSelectedGame] = useState('Valorant');
  const [matchHistory, setMatchHistory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);

  const [actInfo, setActInfo] = useState(null);

  useEffect(() => {
    if (profile?.esports_titles?.length) {
      setActiveTitles(profile.esports_titles);
    } else if (profile?.active_titles?.length) {
      setActiveTitles(profile.active_titles);
    }
  }, [profile]);

  useEffect(() => {
    const handleTitlesSync = (e) => {
      const updated = e.detail?.activeTitles || e.detail?.esports_titles;
      if (updated && Array.isArray(updated) && updated.length > 0) {
        setActiveTitles(updated);
        if (selectedGame && !updated.includes(selectedGame)) {
          setSelectedGame(updated[0]);
        }
      }
    };

    window.addEventListener('gg_titles_updated', handleTitlesSync);
    return () => window.removeEventListener('gg_titles_updated', handleTitlesSync);
  }, [selectedGame]);

  useEffect(() => {
    if (String(selectedGame || '').toLowerCase().includes('val')) {
      fetchCurrentValorantAct().then((data) => setActInfo(data));
    }
  }, [selectedGame]);

  // Carousel state & rotation logic
  const [bannerIndex, setBannerIndex] = useState(0);

  const handleNextBanner = () => {
    setBannerIndex((prev) => (prev + 1) % GAMEDATA_BANNERS.length);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % GAMEDATA_BANNERS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Tracker API state
  const [trackerGamerTag, setTrackerGamerTag] = useState('');
  const [trackerTagLine, setTrackerTagLine] = useState('');
  const [isSyncingTracker, setIsSyncingTracker] = useState(false);
  const [isBound, setIsBound] = useState(false);

  // Dota 2 API state
  const [dotaAccountId, setDotaAccountId] = useState('');
  const [isDotaBound, setIsDotaBound] = useState(false);

  // League of Legends API state
  const [lolRiotId, setLolRiotId] = useState('');
  const [lolRegion, setLolRegion] = useState('sea');
  const [isLolBound, setIsLolBound] = useState(false);

  // Counter-Strike 2 API & Manual Telemetry Form state
  const [cs2SteamId, setCs2SteamId] = useState('');
  const [isCs2Bound, setIsCs2Bound] = useState(false);
  const [cs2Form, setCs2Form] = useState({
    map: 'DE_MIRAGE',
    outcome: 'VICTORY',
    rank: 'PREMIER (15,000 - 19,999)',
    kills: '',
    deaths: '',
    assists: '',
    adr: '',
    hsPercent: ''
  });

  // Apex Legends Manual Telemetry Form state
  const [apexMatches, setApexMatches] = useState([]);
  const [isFetchingApex, setIsFetchingApex] = useState(false);
  const [isSubmittingApex, setIsSubmittingApex] = useState(false);
  const [apexManualForm, setApexManualForm] = useState({
    playerName: '',
    legend: 'Wraith',
    outcome: 'CHAMPION',
    rankTier: 'DIAMOND (15,000 - 19,999 RP)',
    kills: '5',
    deaths: '1',
    assists: '3',
    damage: '1450',
    placement: '1'
  });

  // Unlink Modal State
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);

  // Full User Profile State & Helper
  const [userProfile, setUserProfile] = useState(null);

  const isValorantLinked = Boolean(
    isBound || 
    userProfile?.valorant_id || 
    (userProfile?.valorant_ign && userProfile?.valorant_tag) ||
    (selectedGame === 'Valorant' && matchHistory && matchHistory.length > 0)
  );

  const isDotaLinked = Boolean(
    isDotaBound || 
    userProfile?.dota2_steam_id || 
    userProfile?.steam_id || 
    (selectedGame === 'Dota 2' && matchHistory && matchHistory.length > 0)
  );

  const isLolLinked = Boolean(
    isLolBound || 
    userProfile?.lol_riot_id || 
    userProfile?.lol_puuid || 
    (selectedGame === 'League of Legends' && matchHistory && matchHistory.length > 0)
  );

  const resolvedLolHandle = lolRiotId || userProfile?.lol_riot_id || (matchHistory && matchHistory[0]?.metrics_payload?.riot_id) || (matchHistory && matchHistory[0]?.metrics_payload?.game_name ? `${matchHistory[0].metrics_payload.game_name}#${matchHistory[0].metrics_payload.tag_line}` : 'CONNECTED');

  const resolvedDotaHandle = dotaAccountId || userProfile?.dota2_steam_id || userProfile?.steam_id || (matchHistory && matchHistory[0]?.metrics_payload?.account_id) || 'CONNECTED';

  const resolvedValorantHandle = trackerGamerTag || userProfile?.valorant_ign || (userProfile?.valorant_id ? userProfile.valorant_id.split('#')[0] : (matchHistory && matchHistory[0]?.metrics_payload?.game_name) || 'CONNECTED');
  const resolvedValorantTag = trackerTagLine || userProfile?.valorant_tag || (userProfile?.valorant_id && userProfile.valorant_id.includes('#') ? userProfile.valorant_id.split('#')[1] : (matchHistory && matchHistory[0]?.metrics_payload?.tag_line) || '');

  const getIsLinked = (gameKey) => {
    const key = (gameKey || '').toLowerCase();
    if (key.includes('val')) return isValorantLinked;
    if (key.includes('dota')) return isDotaLinked;
    if (key.includes('lol') || key.includes('league')) return isLolLinked;
    if (key.includes('cs') || key.includes('counter')) return Boolean(userProfile?.cs2_steam_id || userProfile?.steam_id);
    return false;
  };

  useEffect(() => {
    const checkBoundProfile = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data) {
        setUserProfile(data);

        // Valorant check
        if (data.valorant_id) {
          if (data.valorant_id.includes('#')) {
            const [name, tag] = data.valorant_id.split('#');
            setTrackerGamerTag(name);
            setTrackerTagLine(tag);
          } else {
            setTrackerGamerTag(data.valorant_id);
            setTrackerTagLine('');
          }
          setIsBound(true);
        } else if (data.valorant_ign && data.valorant_tag) {
          setTrackerGamerTag(data.valorant_ign);
          setTrackerTagLine(data.valorant_tag);
          setIsBound(true);
        } else {
          setIsBound(false);
          setTrackerGamerTag('');
          setTrackerTagLine('');
        }

        // Dota 2 check
        if (data.dota2_steam_id || data.steam_id) {
          setDotaAccountId(data.dota2_steam_id || data.steam_id);
          setIsDotaBound(true);
        } else {
          setIsDotaBound(false);
          setDotaAccountId('');
        }

        // CS2 check
        if (data.cs2_steam_id || data.steam_id) {
          if (typeof setCs2SteamId === 'function') {
            setCs2SteamId(data.cs2_steam_id || data.steam_id);
          }
          if (typeof setIsCs2Bound === 'function') {
            setIsCs2Bound(true);
          }
        } else {
          if (typeof setIsCs2Bound === 'function') {
            setIsCs2Bound(false);
          }
          if (typeof setCs2SteamId === 'function') {
            setCs2SteamId('');
          }
        }

        // Apex check
        if (data.apex_player_id) {
          setApexManualForm(prev => ({
            ...prev,
            playerName: data.apex_player_id
          }));
        }

        // LoL check
        if (data.lol_riot_id || data.lol_puuid) {
          setLolRiotId(data.lol_riot_id || '');
          if (data.lol_region) {
            setLolRegion(data.lol_region.toLowerCase());
          }
          setIsLolBound(true);
        } else {
          setIsLolBound(false);
          setLolRiotId('');
        }
      }
    };
    checkBoundProfile();
  }, [user]);

  // Direct fetch function for Apex Legends
  const fetchApexTelemetry = async (targetUserId) => {
    const uid = targetUserId || user?.id || userProfile?.id;
    if (!uid) return;

    setIsFetchingApex(true);
    try {
      const { data, error } = await supabase
        .from('apex_match_telemetry')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Apex Fetch DB Error]:', error.message);
        return;
      }

      if (data) {
        setApexMatches(data);
      }
    } catch (err) {
      console.error('[Apex Fetch Exception]:', err);
    } finally {
      setIsFetchingApex(false);
    }
  };

  // Auto-trigger whenever user, userProfile, or game selection changes
  useEffect(() => {
    const uid = user?.id || userProfile?.id;
    if (selectedGame?.toLowerCase().includes('apex') && uid) {
      fetchApexTelemetry(uid);
    }
  }, [selectedGame, user?.id, userProfile?.id]);

  // F1 25 Telemetry Fetching & Polling
  const [f1Data, setF1Data] = useState(null);

  useEffect(() => {
    if (selectedGame === 'F1 25' || selectedGame?.toLowerCase().includes('f1')) {
      const fetchF1Telemetry = async () => {
        try {
          const res = await fetch('http://localhost:5000/api/f1-telemetry');
          const data = await res.json();
          setF1Data(data);
        } catch (err) {
          console.error('Error loading F1 telemetry:', err);
        }
      };

      fetchF1Telemetry();
      const interval = setInterval(fetchF1Telemetry, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedGame]);

  // Calculate LCC specifically for Apex
  const apexLcc = React.useMemo(() => {
    if (!apexMatches || apexMatches.length === 0) {
      return { baseline: '0.0 Pts', current: '0.0 Pts', n: '0 Matches', slope: '0.00' };
    }
    const sorted = [...apexMatches].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const initial5 = sorted.slice(0, 5);
    const recent5 = sorted.slice(-5);

    const baseline = (initial5.reduce((sum, m) => sum + Number(m.performance_score || 0), 0) / initial5.length).toFixed(1);
    const current = (recent5.reduce((sum, m) => sum + Number(m.performance_score || 0), 0) / recent5.length).toFixed(1);
    const n = sorted.length;
    const slope = ((Number(current) - Number(baseline)) / Math.max(1, n)).toFixed(2);

    return { baseline: `${baseline} Pts`, current: `${current} Pts`, n: `${n} Matches`, slope };
  }, [apexMatches]);

  const [syncToast, setSyncToast] = useState({ show: false, type: 'success' });

  const showNotification = (config) => {
    setSyncToast(config);
    setTimeout(() => {
      setSyncToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  // Form State: Tactical Shooters / MOBAs
  const [simAcs, setSimAcs] = useState('268');
  const [simKd, setSimKd] = useState('1.65');
  const [simEcon, setSimEcon] = useState('78');
  const [simElo, setSimElo] = useState('248');

  // Form State: Sim Racing
  const [simTrack, setSimTrack] = useState('Spa-Francorchamps');
  const [simTyre, setSimTyre] = useState('Soft (C4)');
  const [simFastestLap, setSimFastestLap] = useState('1:44.820');
  const [simSector1, setSimSector1] = useState('30.2');
  const [simSector2, setSimSector2] = useState('42.4');
  const [simSector3, setSimSector3] = useState('32.2');

  // Form State: Sports / Manual
  const [manualDivision, setManualDivision] = useState('Elite Division');
  const [manualSkillRating, setManualSkillRating] = useState('2150');
  const [manualGoals, setManualGoals] = useState('4');
  const [manualPassAccuracy, setManualPassAccuracy] = useState('91');
  const [manualPossession, setManualPossession] = useState('58');

  // 1. Synchronize Registered Titles
  useEffect(() => {
    if (activeTitles.length > 0 && !activeTitles.includes(selectedGame)) {
      setSelectedGame(activeTitles[0]);
    }
  }, [activeTitles, selectedGame]);

  const fetchTelemetryHistory = async () => {
    if (!user?.id) return;
    setIsLoadingFeed(true);
    try {
      const tableName = getTelemetryTable(selectedGame);
      const orderBy = tableName === 'game_match_telemetry' ? 'match_date' : 'created_at';
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', user.id)
        .order(orderBy, { ascending: true });

      if (!error && data) {
        setMatchHistory(data);
      }
    } catch (err) {
      console.error('Error fetching telemetry history:', err);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  useEffect(() => {
    fetchTelemetryHistory();
  }, [selectedGame, user?.id]);

  const isAutomated = AUTOMATED_GAMES.includes(selectedGame);

  // 1. FILTERED LOGS PER GAME WITH STRICT VALORANT COMPETITIVE FILTERING
  const activeGameLogs = React.useMemo(() => {
    const rawMatches = matchHistory.filter(
      (log) => (log.game_title || log.game_name || log.game) === selectedGame
    );

    if (selectedGame === 'Valorant') {
      return rawMatches.filter((match) => {
        const mode = String(
          match.metrics_payload?.mode ||
          match.metrics_payload?.queue ||
          match.metadata?.mode ||
          match.metadata?.queue ||
          match.mode ||
          match.game_mode ||
          ''
        ).toLowerCase();

        return (
          (mode === 'competitive' || mode === 'comp') &&
          !mode.includes('deathmatch') &&
          !mode.includes('escalation') &&
          !mode.includes('spikerush')
        );
      });
    }

    return rawMatches;
  }, [matchHistory, selectedGame]);

  // Apply official Act boundary filter
  const cycleMatches = React.useMemo(() => {
    return applyGlobalActReset(activeGameLogs, selectedGame, actInfo);
  }, [activeGameLogs, selectedGame, actInfo]);

  // Compute LCC strictly using ACS/Performance scores via unified calculator on active cycle matches
  const lccResults = React.useMemo(() => {
    if (selectedGame === 'Dota 2' || selectedGame === 'League of Legends' || selectedGame === 'Counter-Strike 2' || selectedGame === 'Apex Legends') {
      const dotaLcc = calculateDotaLinearGrowth(cycleMatches);
      const list = cycleMatches || [];
      const totalN = list.length;
      const windowSize = Math.min(5, totalN);
      
      const baselineSubset = list.slice(0, windowSize);
      const avgBaseline = baselineSubset.reduce((sum, m) => sum + Number(m.performance_score || m.metrics_payload?.performance_score || 0), 0) / Math.max(1, baselineSubset.length);
      
      const currentSubset = list.slice(-windowSize);
      const avgCurrent = currentSubset.reduce((sum, m) => sum + Number(m.performance_score || m.metrics_payload?.performance_score || 0), 0) / Math.max(1, currentSubset.length);
      
      return {
        pBaseline: `${avgBaseline.toFixed(1)} Pts`,
        pCurrent: `${avgCurrent.toFixed(1)} Pts`,
        nMatches: totalN,
        slope: dotaLcc.slope > 0 ? `+${dotaLcc.slope.toFixed(2)}` : dotaLcc.slope.toFixed(2),
        slopeNumeric: dotaLcc.slope,
      };
    }
    return calculateLCCMetrics(cycleMatches);
  }, [cycleMatches, selectedGame]);

  const latestRank = React.useMemo(() => {
    if (cycleMatches.length === 0) {
      if (selectedGame === 'League of Legends') return userProfile?.lol_rank || profile?.lol_rank || 'UNRATED';
      if (selectedGame === 'Dota 2') return userProfile?.dota2_rank || profile?.dota2_rank || 'UNRATED';
      if (selectedGame === 'Counter-Strike 2') return userProfile?.cs2_rank || profile?.cs2_rank || 'PREMIER (15,000 - 19,999)';
      if (selectedGame === 'Apex Legends') return userProfile?.apex_rank || profile?.apex_rank || 'DIAMOND (15,000 - 19,999 RP)';
      return 'UNRATED';
    }
    const latest = cycleMatches[cycleMatches.length - 1];
    const payload = latest?.metrics_payload || latest || {};
    if (selectedGame === 'Dota 2') {
      return payload.competitive_rank || userProfile?.dota2_rank || profile?.dota2_rank || 'UNRATED';
    }
    if (selectedGame === 'League of Legends') {
      return payload.competitive_rank || userProfile?.lol_rank || profile?.lol_rank || 'UNRATED';
    }
    if (selectedGame === 'Counter-Strike 2') {
      return payload.competitive_rank || userProfile?.cs2_rank || profile?.cs2_rank || 'GLOBAL ELITE';
    }
    if (selectedGame === 'Apex Legends') {
      return payload.rank || userProfile?.apex_rank || profile?.apex_rank || 'DIAMOND IV';
    }
    return payload.rank || 'UNRATED';
  }, [cycleMatches, selectedGame, profile, userProfile]);

  // 4. Ingestion Handler
  const handleIngestMatch = async (type) => {
    if (!user?.id) return;
    setIsSubmitting(true);

    let performanceScore = 70;
    let payload = {};

    if (selectedGame === 'Valorant' || selectedGame === 'Counter-Strike 2') {
      const acsNum = Number(simAcs) || 200;
      const kdNum = Number(simKd) || 1.0;
      performanceScore = Number(((acsNum / 350) * 60 + (kdNum / 2.0) * 40).toFixed(1));
      payload = {
        acs: acsNum,
        kd: kdNum,
        econ_rating: Number(simEcon),
        elo: simElo
      };
    } else if (selectedGame === 'F1 25' || selectedGame === 'Assetto Corsa') {
      performanceScore = 89.2;
      payload = {
        track: simTrack,
        tyre_compound: simTyre,
        fastest_lap: simFastestLap,
        sectors: { s1: simSector1, s2: simSector2, s3: simSector3 }
      };
    } else if (selectedGame === 'EA FC 27') {
      const goals = Number(manualGoals) || 0;
      const passPct = Number(manualPassAccuracy) || 80;
      performanceScore = Number((goals * 12 + passPct * 0.55).toFixed(1));
      payload = {
        division: manualDivision,
        skill_rating: manualSkillRating,
        goals,
        pass_accuracy: passPct,
        possession: Number(manualPossession)
      };
    }

    try {
      const { error } = await supabase.from('game_match_telemetry').insert({
        user_id: user.id,
        game_title: selectedGame,
        ingestion_type: type,
        performance_score: performanceScore,
        metrics_payload: payload,
      });

      if (error) throw error;
      await fetchTelemetryHistory();
    } catch (err) {
      alert('Ingestion error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Delete Telemetry Record
  const handleDeleteTelemetry = async (id) => {
    try {
      const tableName = getTelemetryTable(selectedGame);
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (!error) {
        setMatchHistory((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncFromAPI = async () => {
    if (!user?.id) {
      showNotification({ show: true, type: 'error', message: 'Please sign in before syncing match telemetry.' });
      return;
    }

    let targetGamerTag = trackerGamerTag?.trim();
    let targetTagLine = trackerTagLine?.trim();

    if (!targetGamerTag || !targetTagLine) {
      if (userProfile?.valorant_id && userProfile.valorant_id.includes('#')) {
        const parts = userProfile.valorant_id.split('#');
        targetGamerTag = parts[0].trim();
        targetTagLine = parts.slice(1).join('#').trim();
      } else if (userProfile?.valorant_ign && userProfile?.valorant_tag) {
        targetGamerTag = userProfile.valorant_ign.trim();
        targetTagLine = userProfile.valorant_tag.trim();
      }
    }

    if (!targetGamerTag || !targetTagLine) {
      showNotification({ show: true, type: 'error', message: 'Please enter both Riot ID and Tagline.' });
      return;
    }

    setIsSyncingTracker(true);
    try {
      const res = await fetch('http://localhost:5000/api/sync-valorant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          gameTitle: selectedGame,
          gamerTag: targetGamerTag,
          tagLine: targetTagLine,
          region: 'ap' // Default Asia-Pacific
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Sync error (Status: ${res.status})`);
      }

      // Trigger Custom Ingestion Notification
      showNotification({
        show: true,
        type: 'success',
        title: 'LIVE TELEMETRY INGESTED',
        map: data.payload?.map || 'Breeze',
        score: data.performanceScore,
        acs: data.payload?.acs,
        kd: data.payload?.kd
      });

      setUserProfile(prev => ({
        ...prev,
        valorant_ign: targetGamerTag,
        valorant_tag: targetTagLine,
        valorant_id: `${targetGamerTag}#${targetTagLine}`
      }));

      await fetchTelemetryHistory();
    } catch (err) {
      showNotification({
        show: true,
        type: 'error',
        message: err.message || 'Failed to ingest match telemetry.'
      });
    } finally {
      setIsSyncingTracker(false);
    }
  };

  const handleSyncDota2FromAPI = async () => {
    if (!user?.id) {
      showNotification({ show: true, type: 'error', message: 'Please sign in before syncing Dota 2 match telemetry.' });
      return;
    }

    let targetAccountId = dotaAccountId?.trim() || userProfile?.dota2_steam_id || userProfile?.steam_id;

    if (!targetAccountId) {
      showNotification({ show: true, type: 'error', message: 'Please enter your 32-bit Steam Account ID.' });
      return;
    }

    setIsSyncingTracker(true);
    try {
      const data = await syncDota2Account(user.id, targetAccountId);

      // Trigger Custom Ingestion Notification
      showNotification({
        show: true,
        type: 'success',
        title: 'DOTA 2 TELEMETRY INGESTED',
        map: `${data.payload?.outcome || 'VICTORY'} (Hero #${data.payload?.hero_id || 'Unknown'})`,
        score: data.performanceScore,
        acs: `${data.payload?.gpm || 0} GPM`,
        kd: data.payload?.kda || 0.00
      });

      setUserProfile(prev => ({
        ...prev,
        dota2_steam_id: targetAccountId,
        steam_id: targetAccountId,
        dota2_rank: data.payload?.competitive_rank || 'UNRATED'
      }));

      await fetchTelemetryHistory();
      setIsDotaBound(true);
    } catch (err) {
      showNotification({
        show: true,
        type: 'error',
        message: err.message || 'Failed to ingest Dota 2 telemetry.'
      });
    } finally {
      setIsSyncingTracker(false);
    }
  };

  const handleSyncLolFromAPI = async () => {
    if (!user?.id) {
      showNotification({ show: true, type: 'error', message: 'Please sign in before syncing League of Legends match telemetry.' });
      return;
    }

    // Resolve Riot ID from input state OR fall back to existing userProfile
    let targetRiotId = lolRiotId?.trim();
    if (!targetRiotId || !targetRiotId.includes('#')) {
      if (userProfile?.lol_riot_id && userProfile.lol_riot_id.includes('#')) {
        targetRiotId = userProfile.lol_riot_id.trim();
      }
    }

    if (!targetRiotId || !targetRiotId.includes('#')) {
      showNotification({ show: true, type: 'error', message: 'Please enter a valid Riot ID (GameName#TagLine).' });
      return;
    }

    const targetRegion = userProfile?.lol_region || lolRegion || 'ASIA';

    setIsSyncingTracker(true);
    try {
      const data = await syncLolAccount(user.id, targetRiotId, targetRegion.toLowerCase());

      showNotification({
        show: true,
        type: 'success',
        title: 'LEAGUE OF LEGENDS TELEMETRY INGESTED',
        map: `${data.payload?.outcome || 'VICTORY'} (${data.payload?.champion_name || 'Champion'})`,
        score: data.performanceScore,
        acs: `${data.payload?.cs_per_min || 0} CS/M`,
        kd: data.payload?.kda || 0.00
      });

      setUserProfile(prev => ({
        ...prev,
        lol_riot_id: data.riotId || targetRiotId,
        lol_puuid: data.payload?.puuid || data.puuid,
        lol_rank: data.rank || data.payload?.competitive_rank || 'UNRATED',
        lol_region: data.region || targetRegion.toUpperCase()
      }));

      await fetchTelemetryHistory();
      setIsLolBound(true);
    } catch (err) {
      showNotification({
        show: true,
        type: 'error',
        message: err.message || 'Failed to ingest League of Legends telemetry.'
      });
    } finally {
      setIsSyncingTracker(false);
    }
  };

  const handleManualCs2Submit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!user?.id) {
      showNotification({ show: true, type: 'error', message: 'Please sign in before recording CS2 match telemetry.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/manual-entry-cs2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...cs2Form
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record match.');

      showNotification({
        show: true,
        type: 'success',
        title: 'COUNTER-STRIKE 2 TELEMETRY INGESTED',
        map: `${data.payload?.outcome || 'VICTORY'} (${data.payload?.map || 'DE_MIRAGE'})`,
        score: data.performanceScore,
        acs: `${data.payload?.adr || 0} ADR`,
        kd: data.payload?.kd || 0.00
      });

      setUserProfile(prev => ({
        ...prev,
        cs2_rank: data.rank || cs2Form.rank
      }));

      // Reset Form
      setCs2Form({
        map: 'DE_MIRAGE',
        outcome: 'VICTORY',
        rank: cs2Form.rank || 'PREMIER (15,000 - 19,999)',
        kills: '',
        deaths: '',
        assists: '',
        adr: '',
        hsPercent: ''
      });

      await fetchTelemetryHistory();
    } catch (err) {
      console.error('[CS2 Entry UI Error]:', err.message);
      showNotification({
        show: true,
        type: 'error',
        message: err.message || 'Failed to record CS2 match.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApexManualSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const uid = user?.id || userProfile?.id;
    if (!uid) {
      alert('User authentication not ready. Please try again.');
      return;
    }

    setIsSubmittingApex(true);
    try {
      const res = await fetch('http://localhost:5000/api/manual-entry-apex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: uid,
          ...apexManualForm
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit telemetry');

      // Prepend immediately to state
      if (data.telemetry) {
        setApexMatches((prev) => [data.telemetry, ...(prev || [])]);
      } else {
        await fetchApexTelemetry(uid);
      }

      setUserProfile((prev) => ({
        ...prev,
        apex_player_id: data.player || apexManualForm.playerName,
        apex_rank: data.rank || apexManualForm.rankTier
      }));

      if (typeof setSyncToast === 'function') {
        setSyncToast({
          show: true,
          type: 'success',
          title: 'APEX TELEMETRY INGESTED',
          message: `${apexManualForm.outcome || 'CHAMPION'} (${apexManualForm.legend || 'Wraith'})`,
          rating: data.rating || 50.0,
          score: data.rating || 50.0,
          acs: `${apexManualForm.damage} DMG`,
          kd: parseFloat(((parseInt(apexManualForm.kills, 10) || 0) / Math.max(1, parseInt(apexManualForm.deaths, 10) || 1)).toFixed(2))
        });
      }

      await fetchTelemetryHistory();
    } catch (err) {
      console.error('[Apex Ingestion Error]:', err);
      if (typeof setSyncToast === 'function') {
        setSyncToast({
          show: true,
          type: 'error',
          title: 'INGESTION FAILED',
          message: err.message || 'Failed to record match'
        });
      }
    } finally {
      setIsSubmittingApex(false);
    }
  };

  const handleDeleteApexMatch = async (id) => {
    if (!id) return;
    const { error } = await supabase.from('apex_match_telemetry').delete().eq('id', id);
    if (!error) {
      setApexMatches((prev) => prev.filter((m) => m.id !== id));
      await fetchTelemetryHistory();
    }
  };

  const handleConfirmUnlink = async () => {
    if (!user?.id) return;
    try {
      setIsSyncingTracker(true);
      setShowUnlinkModal(false);

      const res = await fetch('http://localhost:5000/api/unlink-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          gameKey: selectedGame
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unlink failed');

      // Reset specific game states
      const key = (selectedGame || '').toLowerCase();
      if (key.includes('lol') || key.includes('league')) {
        setIsLolBound(false);
        setLolRiotId('');
      } else if (key.includes('dota')) {
        setIsDotaBound(false);
        setDotaAccountId('');
      } else if (key.includes('cs') || key.includes('counter-strike')) {
        setIsCs2Bound(false);
      } else {
        setIsBound(false);
        setTrackerGamerTag('');
        setTrackerTagLine('');
      }

      // CRITICAL: Immediately update local userProfile state to trigger instant UI re-render
      setUserProfile((prev) => {
        if (!prev) return prev;
        const updated = { ...prev };

        if (key.includes('lol') || key.includes('league')) {
          updated.lol_riot_id = null;
          updated.lol_puuid = null;
          updated.lol_rank = 'UNRATED';
        } else if (key.includes('dota')) {
          updated.dota2_steam_id = null;
          updated.steam_id = null;
          updated.dota2_rank = 'UNRATED';
        } else if (key.includes('cs') || key.includes('counter')) {
          updated.cs2_steam_id = null;
          updated.cs2_rank = 'UNRATED';
        } else if (key.includes('apex')) {
          updated.apex_player_id = null;
          updated.apex_rank = 'UNRATED';
        } else {
          updated.valorant_id = null;
          updated.valorant_ign = null;
          updated.valorant_tag = null;
          updated.valorant_rank = 'UNRATED';
        }

        return updated;
      });

      setMatchHistory([]);
      showNotification({
        show: true,
        type: 'success',
        title: `${selectedGame.toUpperCase()} UNLINKED`,
        message: `${selectedGame} successfully disconnected and telemetry purged.`
      });

      await fetchTelemetryHistory();
    } catch (err) {
      showNotification({
        show: true,
        type: 'error',
        message: err.message || 'Error disconnecting account.'
      });
    } finally {
      setIsSyncingTracker(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-[#070b13] min-h-screen text-slate-900 dark:text-slate-100 font-sans space-y-6 pt-28 pb-16 w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16 selection:bg-cyan-500/30">

      {/* HIGH-TECH INTERACTIVE BACKDROP HERO BANNER */}
      <div
        onClick={handleNextBanner}
        className="relative w-full min-h-[320px] md:min-h-[400px] rounded-3xl overflow-hidden border border-slate-800 bg-[#070b13] shadow-2xl cursor-pointer group mb-8 select-none transition-all"
      >
        {/* Animated Background Carousel */}
        {GAMEDATA_BANNERS.map((banner, index) => (
          <div
            key={banner}
            className={`w-full h-full object-cover absolute inset-0 transition-all duration-1000 ease-in-out pointer-events-none transform group-hover:scale-102 ${index === bannerIndex ? 'opacity-80 scale-100' : 'opacity-0 scale-105'
              }`}
            style={{
              backgroundImage: `url(${SUPABASE_UI_BASE}/${encodeURIComponent(banner)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top 15%',
            }}
          />
        ))}

        {/* High-Contrast Cyber Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070b13]/95 via-[#070b13]/70 to-transparent pointer-events-none" />

        {/* Overlay Content */}
        <div className="relative z-10 h-full p-6 md:p-10 flex flex-col justify-between pointer-events-none min-h-[320px] md:min-h-[400px]">

          {/* Top Header Badge */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 uppercase tracking-widest backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              TELEMETRY INGESTION & LCC LAB
            </span>
          </div>

          {/* Main Title & Subtitle */}
          <div className="mt-auto pt-8">
            <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-wide uppercase drop-shadow-lg font-sans">
              Game Data Calibration Engine
            </h2>
            <p className="text-xs md:text-sm text-slate-300 mt-1.5 max-w-xl drop-shadow-md font-mono">
              Ingest raw match telemetry, calibrate game-specific metrics, and verify mathematical Learning Curve Calculator (LCC) outputs before dashboard serialization.
            </p>
          </div>

          {/* Dynamic 2-Dot Pagination Indicators */}
          <div className="flex items-center gap-1.5 pt-4">
            {GAMEDATA_BANNERS.map((_, idx) => (
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

      {/* STANDARDIZED ESPORTS TITLE SELECTOR DROPDOWN */}
      <div className="w-full flex items-center justify-between bg-[#0b131d] border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl mb-6">
        <div className="text-[11px] font-black uppercase tracking-widest text-cyan-400 font-mono">
          SELECT ACTIVE ESPORTS TITLE
        </div>

        <div className="relative min-w-[220px] sm:w-72">
          <select
            value={selectedGame}
            onChange={(e) => setSelectedGame(e.target.value)}
            className="w-full bg-[#070b10] border border-slate-800 hover:border-cyan-500/50 focus:border-cyan-400 text-white text-xs font-mono font-bold uppercase tracking-wider py-3 pl-4 pr-10 rounded-xl appearance-none cursor-pointer focus:outline-none transition shadow-lg"
          >
            {activeTitles && activeTitles.length > 0 ? (
              activeTitles.map((title) => (
                <option key={title} value={title} className="bg-[#0b131d] text-white font-mono py-2">
                  {title.toUpperCase()}
                </option>
              ))
            ) : (
              <option value="Valorant" className="bg-[#0b131d] text-white font-mono py-2">
                VALORANT
              </option>
            )}
          </select>

          {/* Dropdown Chevron */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* LCC MATHEMATICAL ENGINE DISPLAY CARD */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0b111e] border border-slate-200 dark:border-slate-800 shadow-md dark:shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-600 dark:text-cyan-400 font-bold">
              ALGORITHMIC LINEAR GROWTH PROOF
            </span>
            <h2 className="text-xl font-bold font-mono text-slate-900 dark:text-white uppercase">
              LEARNING CURVE CALCULATOR (LCC)
            </h2>
          </div>
          <div className="p-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 font-mono text-xs text-cyan-600 dark:text-cyan-400 font-bold">
            LCC = (P_current - P_baseline) / N
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. P_BASELINE (TOP 5 MATCHES) */}
          <div className="p-4 rounded-xl bg-[#050b13] border border-slate-800/60">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
              P_BASELINE (INITIAL 5 MATCHES)
            </div>
            <div className="text-xl font-mono font-black text-white">
              {lccResults.pBaseline}
            </div>
          </div>

          {/* 2. P_CURRENT (BOTTOM 5 MATCHES) */}
          <div className="p-4 rounded-xl bg-[#050b13] border border-slate-800/60">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
              P_CURRENT (RECENT 5 MATCHES)
            </div>
            <div className="text-xl font-mono font-black text-white">
              {lccResults.pCurrent}
            </div>
          </div>

          {/* 3. N DELTA */}
          <div className="p-4 rounded-xl bg-[#050b13] border border-slate-800/60">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
              N (GROWTH DELTA PERIOD)
            </div>
            <div className="text-xl font-mono font-black text-white">
              {lccResults.nMatches} Matches
            </div>
          </div>

          {/* 4. LINEAR GROWTH SLOPE */}
          {(() => {
            const totalMatches = cycleMatches.length;
            const slopeValue = lccResults.slopeNumeric;
            const isCalibrated = totalMatches > 0 && !isNaN(slopeValue);
            const isPositive = slopeValue > 0;

            return (
              <div
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  isCalibrated
                    ? 'bg-[#050b13] border-slate-800/60'
                    : 'bg-[#040810]/50 border-slate-800/40 opacity-60'
                }`}
              >
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                  LINEAR GROWTH SLOPE
                </div>
                <div className="flex items-baseline gap-1 font-mono">
                  <span
                    className={`text-xl font-black ${
                      isCalibrated
                        ? isPositive
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                        : 'text-slate-600'
                    }`}
                  >
                    {isCalibrated ? lccResults.slope : '0.00'}
                  </span>
                  {!isCalibrated && (
                    <span className="text-[9px] uppercase tracking-wider text-slate-600 font-bold ml-1">
                      (Uncalibrated)
                    </span>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* CONDITIONAL SINGLE-CHANNEL INGESTION WORKSPACE */}
      {selectedGame !== 'F1 25' && !selectedGame?.toLowerCase().includes('f1') && (
        <div className="w-full max-w-4xl mx-auto">
        {isAutomated ? (
          /* CHANNEL A: AUTOMATED API & UDP STREAM */
          <div className="p-7 md:p-8 rounded-3xl bg-white dark:bg-[#0b111e] border border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.12)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">
                  AUTOMATED TELEMETRY CHANNEL
                </span>
                <h3 className="text-lg font-bold font-mono text-slate-900 dark:text-white uppercase mt-0.5">
                  {selectedGame} API & UDP STREAM NODE
                </h3>
              </div>
              <span className="self-start sm:self-auto px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                ACTIVE PROTOCOL
              </span>
            </div>

            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 leading-relaxed">
              Real-time telemetry extraction active for <strong>{selectedGame}</strong> via automated webhooks and memory stream simulator.
            </p>

            {/* CURRENT ACT CYCLE BANNER */}
            {String(selectedGame || '').toLowerCase().includes('val') && actInfo?.title && (
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#050b13] border border-cyan-500/20 mb-4 font-mono text-xs shadow-[0_0_15px_rgba(34,211,238,0.05)]">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0"></span>
                <span className="text-slate-400">
                  CURRENT ACT CYCLE:{' '}
                  <strong className="text-white font-black tracking-wider">
                    {actInfo?.title || 'V26 // ACT V'}
                  </strong>
                </span>
              </div>
            )}

            {selectedGame === 'F1 25' || selectedGame === 'Assetto Corsa' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1.5">TRACK NAME</label>
                  <input
                    type="text"
                    value={simTrack}
                    onChange={(e) => setSimTrack(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1.5">TYRE COMPOUND</label>
                  <input
                    type="text"
                    value={simTyre}
                    onChange={(e) => setSimTyre(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1.5">FASTEST LAP TIME</label>
                  <input
                    type="text"
                    value={simFastestLap}
                    onChange={(e) => setSimFastestLap(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1.5">SECTORS (S1 / S2 / S3)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <input type="text" value={simSector1} onChange={(e) => setSimSector1(e.target.value)} className="px-2 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-center text-slate-900 dark:text-white focus:border-cyan-400 focus:outline-none" />
                    <input type="text" value={simSector2} onChange={(e) => setSimSector2(e.target.value)} className="px-2 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-center text-slate-900 dark:text-white focus:border-cyan-400 focus:outline-none" />
                    <input type="text" value={simSector3} onChange={(e) => setSimSector3(e.target.value)} className="px-2 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-center text-slate-900 dark:text-white focus:border-cyan-400 focus:outline-none" />
                  </div>
                </div>
              </div>
            ) : (
              /* Tactical Shooters / MOBAs */
              <div className="space-y-4 pt-1">
                {selectedGame === 'Valorant' ? (
                  <>
                    {/* --- VALORANT ACCOUNT GATEWAY --- */}
                    {isValorantLinked ? (
                      /* BOUND / SYNCHRONIZED STATE */
                      <div className="bg-[#0b131d] border border-slate-800/90 rounded-xl p-5 shadow-xl mb-4 max-w-3xl">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          {/* Identity Badge */}
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xl font-black">
                              🛡️
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-white font-black text-lg tracking-wide">
                                  {resolvedValorantHandle}
                                </span>
                                {resolvedValorantTag && (
                                  <span className="text-cyan-400 font-mono font-bold text-sm bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
                                    #{resolvedValorantTag}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">
                                GradeGamer ID is synchronized with Riot Valorant telemetry node.
                              </p>
                              <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono">
                                <span className="text-slate-500 uppercase font-bold">Standing:</span>
                                <span className="text-emerald-400 font-black uppercase">{latestRank}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2.5">
                            <button
                              onClick={() => setShowUnlinkModal(true)}
                              disabled={isSyncingTracker}
                              className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/60 text-red-400 font-bold text-xs py-2.5 px-4 rounded-lg uppercase tracking-wider transition disabled:opacity-50 cursor-pointer"
                              title="Unlink Account & Purge Telemetry"
                            >
                              UNLINK
                            </button>
                            <button
                              onClick={handleSyncFromAPI}
                              disabled={isSyncingTracker}
                              className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-black text-xs py-2.5 px-6 rounded-lg uppercase tracking-wider transition shadow-[0_0_15px_rgba(6,182,212,0.35)] flex items-center space-x-2 cursor-pointer"
                            >
                              <span>{isSyncingTracker ? 'FETCHING TELEMETRY...' : '📡 SYNC LATEST MATCH'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* FIRST-TIME USER ONBOARDING */
                      <div className="bg-[#0b131d] border border-slate-800/90 rounded-xl p-6 shadow-xl space-y-4 mb-4 max-w-3xl">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                              Initial Setup
                            </div>
                            <h3 className="text-sm font-black text-white uppercase tracking-wide">
                              Link Valorant Identity
                            </h3>
                          </div>
                          <span className="bg-amber-950/80 border border-amber-800/60 text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-full">
                            UNLINKED
                          </span>
                        </div>

                        {/* MODERN TELEMETRY STATUS BADGE */}
                        <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-cyan-300 font-mono">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                          <span>Live telemetry calibration & LCC calculation active. Nodes can be unlinked anytime in settings.</span>
                        </div>

                        {/* COMPACT INPUT GRID */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end pt-1">
                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Riot ID / In-Game Name
                            </label>
                            <input
                              type="text"
                              value={trackerGamerTag}
                              onChange={(e) => setTrackerGamerTag(e.target.value)}
                              placeholder="e.g. T1 TenZ"
                              className="w-full bg-[#070d14] border border-slate-700/80 focus:border-cyan-400 rounded-lg py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none transition"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Tagline
                            </label>
                            <input
                              type="text"
                              value={trackerTagLine}
                              onChange={(e) => setTrackerTagLine(e.target.value.replace('#', ''))}
                              placeholder="e.g. 2001 (No # needed)"
                              className="w-full bg-[#070d14] border border-slate-700/80 focus:border-cyan-400 rounded-lg py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none transition font-mono"
                            />
                          </div>
                        </div>

                        {/* CONNECT AND SYNC ACTION BUTTON */}
                        <button
                          onClick={handleSyncFromAPI}
                          disabled={isSyncingTracker}
                          className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-black text-xs py-2.5 px-4 rounded-lg uppercase tracking-wider transition shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center space-x-2 cursor-pointer"
                        >
                          <span>{isSyncingTracker ? 'CONNECTING IDENTITY...' : 'CONNECT & SYNC VALORANT'}</span>
                        </button>
                      </div>
                    )}
                  </>
                ) : selectedGame === 'Counter-Strike 2' ? (
                  <>
                    {/* CS2 MANUAL TELEMETRY INGESTION NODE */}
                    <div className="bg-[#0b1320] border border-cyan-500/20 rounded-xl p-6 shadow-lg mb-4 max-w-3xl">
                      <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
                        <div>
                          <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase block">
                            MANUAL TELEMETRY INGESTION NODE
                          </span>
                          <h3 className="text-sm md:text-base font-black text-white uppercase tracking-wide">
                            COUNTER-STRIKE 2 MATCH TELEMETRY
                          </h3>
                        </div>
                        <span className="px-2.5 py-1 text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
                          MANUAL PROTOCOL
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 mb-5 font-mono leading-relaxed">
                        Input individual Counter-Strike 2 match scores directly to calibrate your performance rating and LCC linear growth.
                      </p>

                      <form onSubmit={handleManualCs2Submit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">MAP</label>
                            <select
                              value={cs2Form.map}
                              onChange={(e) => setCs2Form({ ...cs2Form, map: e.target.value })}
                              className="w-full bg-[#070d14] border border-slate-700/80 focus:border-cyan-400 rounded-lg p-2 text-xs text-white focus:outline-none font-mono"
                            >
                              <option value="DE_MIRAGE">Mirage</option>
                              <option value="DE_INFERNO">Inferno</option>
                              <option value="DE_NUKE">Nuke</option>
                              <option value="DE_ANCIENT">Ancient</option>
                              <option value="DE_ANUBIS">Anubis</option>
                              <option value="DE_DUST2">Dust II</option>
                              <option value="DE_VERTIGO">Vertigo</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">OUTCOME</label>
                            <select
                              value={cs2Form.outcome}
                              onChange={(e) => setCs2Form({ ...cs2Form, outcome: e.target.value })}
                              className="w-full bg-[#070d14] border border-slate-700/80 focus:border-cyan-400 rounded-lg p-2 text-xs text-white focus:outline-none font-mono"
                            >
                              <option value="VICTORY">VICTORY</option>
                              <option value="DEFEAT">DEFEAT</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">RANK / PREMIER STANDING</label>
                            <select
                              value={cs2Form.rank}
                              onChange={(e) => setCs2Form({ ...cs2Form, rank: e.target.value })}
                              className="w-full bg-[#070d14] border border-slate-700/80 focus:border-cyan-400 rounded-lg p-2 text-xs text-white focus:outline-none font-mono font-bold text-amber-400"
                            >
                              <option value="PREMIER (20,000+)">PREMIER (20,000+)</option>
                              <option value="PREMIER (15,000 - 19,999)">PREMIER (15,000 - 19,999)</option>
                              <option value="PREMIER (10,000 - 14,999)">PREMIER (10,000 - 14,999)</option>
                              <option value="PREMIER (5,000 - 9,999)">PREMIER (5,000 - 9,999)</option>
                              <option value="GLOBAL ELITE">GLOBAL ELITE</option>
                              <option value="SUPREME FIRST CLASS">SUPREME FIRST CLASS</option>
                              <option value="LEGENDARY EAGLE">LEGENDARY EAGLE</option>
                              <option value="DISTINGUISHED MASTER GUARDIAN">DISTINGUISHED MASTER GUARDIAN</option>
                              <option value="MASTER GUARDIAN">MASTER GUARDIAN</option>
                              <option value="GOLD NOVA">GOLD NOVA</option>
                              <option value="SILVER">SILVER</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <div>
                            <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">KILLS</label>
                            <input
                              type="number"
                              min="0"
                              placeholder="e.g. 21"
                              value={cs2Form.kills}
                              onChange={(e) => setCs2Form({ ...cs2Form, kills: e.target.value })}
                              required
                              className="w-full bg-[#070d14] border border-slate-700/80 focus:border-cyan-400 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">DEATHS</label>
                            <input
                              type="number"
                              min="0"
                              placeholder="e.g. 14"
                              value={cs2Form.deaths}
                              onChange={(e) => setCs2Form({ ...cs2Form, deaths: e.target.value })}
                              required
                              className="w-full bg-[#070d14] border border-slate-700/80 focus:border-cyan-400 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">ASSISTS</label>
                            <input
                              type="number"
                              min="0"
                              placeholder="e.g. 5"
                              value={cs2Form.assists}
                              onChange={(e) => setCs2Form({ ...cs2Form, assists: e.target.value })}
                              className="w-full bg-[#070d14] border border-slate-700/80 focus:border-cyan-400 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">ADR (AVG DMG)</label>
                            <input
                              type="number"
                              step="0.1"
                              placeholder="e.g. 88.5"
                              value={cs2Form.adr}
                              onChange={(e) => setCs2Form({ ...cs2Form, adr: e.target.value })}
                              required
                              className="w-full bg-[#070d14] border border-slate-700/80 focus:border-cyan-400 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">HEADSHOT %</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="e.g. 45"
                              value={cs2Form.hsPercent}
                              onChange={(e) => setCs2Form({ ...cs2Form, hsPercent: e.target.value })}
                              required
                              className="w-full bg-[#070d14] border border-slate-700/80 focus:border-cyan-400 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
                        >
                          {isSubmitting ? 'RECORDING MATCH...' : 'RECORD CS2 MATCH TELEMETRY'}
                        </button>
                      </form>
                    </div>
                  </>
                ) : selectedGame === 'Dota 2' ? (
                  <>
                    {/* --- DOTA 2 ACCOUNT GATEWAY --- */}
                    {isDotaLinked ? (
                      /* BOUND / SYNCHRONIZED STATE */
                      <div className="bg-[#0b131d] border border-slate-800/90 rounded-xl p-5 shadow-xl mb-4 max-w-3xl">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          {/* Identity Badge */}
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xl font-black">
                              🛡️
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-white font-black text-lg tracking-wide">
                                  Steam Account ID
                                </span>
                                <span className="text-cyan-400 font-mono font-bold text-sm bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
                                  {resolvedDotaHandle}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">
                                GradeGamer ID is synchronized with Dota 2 Steam node.
                              </p>
                              <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono">
                                <span className="text-slate-500 uppercase font-bold">Standing:</span>
                                <span className={`uppercase ${
                                  latestRank.startsWith('IMMORTAL')
                                    ? 'text-amber-400 font-black'
                                    : latestRank.startsWith('DIVINE') || latestRank.startsWith('ANCIENT')
                                    ? 'text-purple-400 font-bold'
                                    : latestRank.startsWith('LEGEND') || latestRank.startsWith('ARCHON')
                                    ? 'text-cyan-400 font-bold'
                                    : 'text-slate-300 font-bold'
                                }`}>{latestRank}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2.5">
                            <button
                              onClick={() => setShowUnlinkModal(true)}
                              disabled={isSyncingTracker}
                              className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/60 text-red-400 font-bold text-xs py-2.5 px-4 rounded-lg uppercase tracking-wider transition disabled:opacity-50 cursor-pointer"
                              title="Unlink Account & Purge Telemetry"
                            >
                              UNLINK
                            </button>
                            <button
                              onClick={handleSyncDota2FromAPI}
                              disabled={isSyncingTracker}
                              className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-black text-xs py-2.5 px-6 rounded-lg uppercase tracking-wider transition shadow-[0_0_15px_rgba(6,182,212,0.35)] flex items-center space-x-2 cursor-pointer"
                            >
                              <span>{isSyncingTracker ? 'FETCHING TELEMETRY...' : '📡 SYNC LATEST MATCH'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* FIRST-TIME USER ONBOARDING */
                      <div className="bg-[#0b131d] border border-slate-800/90 rounded-xl p-6 shadow-xl space-y-4 mb-4 max-w-3xl">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                              Initial Setup
                            </div>
                            <h3 className="text-sm font-black text-white uppercase tracking-wide">
                              Link Dota 2 Identity
                            </h3>
                          </div>
                          <span className="bg-amber-950/80 border border-amber-800/60 text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-full">
                            UNLINKED
                          </span>
                        </div>

                        {/* MODERN TELEMETRY STATUS BADGE */}
                        <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-cyan-300 font-mono">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                          <span>Live telemetry calibration & LCC calculation active. Nodes can be unlinked anytime in settings.</span>
                        </div>

                        {/* COMPACT INPUT GRID */}
                        <div className="grid grid-cols-1 gap-3 items-end pt-1">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              32-bit Steam Account ID (Friend ID)
                            </label>
                            <input
                              type="text"
                              value={dotaAccountId}
                              onChange={(e) => setDotaAccountId(e.target.value)}
                              placeholder="e.g. 104358896"
                              className="w-full bg-[#070d14] border border-slate-700/80 focus:border-cyan-400 rounded-lg py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none transition font-mono"
                            />
                          </div>
                        </div>

                        {/* CONNECT AND SYNC ACTION BUTTON */}
                        <button
                          onClick={handleSyncDota2FromAPI}
                          disabled={isSyncingTracker}
                          className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-black text-xs py-2.5 px-4 rounded-lg uppercase tracking-wider transition shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center space-x-2 cursor-pointer"
                        >
                          <span>{isSyncingTracker ? 'CONNECTING IDENTITY...' : 'CONNECT & SYNC DOTA 2 ACCOUNT'}</span>
                        </button>
                      </div>
                    )}
                  </>
                ) : selectedGame === 'League of Legends' ? (
                  <>
                    {/* --- LEAGUE OF LEGENDS ACCOUNT GATEWAY --- */}
                    {isLolLinked ? (
                      /* BOUND / SYNCHRONIZED STATE */
                      <div className="bg-[#0b131d] border border-slate-800/90 rounded-xl p-5 shadow-xl mb-4 max-w-3xl">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          {/* Identity Badge */}
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xl font-black">
                              🛡️
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-white font-black text-lg tracking-wide">
                                  {resolvedLolHandle}
                                </span>
                                <span className="text-cyan-400 font-mono font-bold text-sm bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded uppercase">
                                  {userProfile?.lol_region || lolRegion?.toUpperCase() || 'ASIA'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">
                                GradeGamer ID is synchronized with Riot League of Legends node.
                              </p>
                              <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono">
                                <span className="text-slate-500 uppercase font-bold">Standing:</span>
                                <span className={`uppercase ${
                                  latestRank.startsWith('IMMORTAL') || latestRank.startsWith('CHALLENGER') || latestRank.startsWith('GRANDMASTER')
                                    ? 'text-amber-400 font-black'
                                    : latestRank.startsWith('DIVINE') || latestRank.startsWith('MASTER') || latestRank.startsWith('DIAMOND')
                                    ? 'text-purple-400 font-bold'
                                    : latestRank.startsWith('LEGEND') || latestRank.startsWith('PLATINUM') || latestRank.startsWith('EMERALD')
                                    ? 'text-emerald-400 font-bold'
                                    : 'text-cyan-400 font-bold'
                                }`}>{latestRank}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2.5">
                            <button
                              onClick={() => setShowUnlinkModal(true)}
                              disabled={isSyncingTracker}
                              className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/60 text-red-400 font-bold text-xs py-2.5 px-4 rounded-lg uppercase tracking-wider transition disabled:opacity-50 cursor-pointer"
                              title="Unlink Account & Purge Telemetry"
                            >
                              UNLINK
                            </button>
                            <button
                              onClick={handleSyncLolFromAPI}
                              disabled={isSyncingTracker}
                              className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-black text-xs py-2.5 px-6 rounded-lg uppercase tracking-wider transition shadow-[0_0_15px_rgba(6,182,212,0.35)] flex items-center space-x-2 cursor-pointer"
                            >
                              <span>{isSyncingTracker ? 'FETCHING TELEMETRY...' : '📡 SYNC LATEST MATCH'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* FIRST-TIME USER ONBOARDING */
                      <div className="bg-[#0b131d] border border-slate-800/90 rounded-xl p-6 shadow-xl space-y-4 mb-4 max-w-3xl">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                              Initial Setup
                            </div>
                            <h3 className="text-sm font-black text-white uppercase tracking-wide">
                              Link League of Legends Riot ID
                            </h3>
                          </div>
                          <span className="bg-amber-950/80 border border-amber-800/60 text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-full">
                            UNLINKED
                          </span>
                        </div>

                        {/* MODERN TELEMETRY STATUS BADGE */}
                        <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-cyan-300 font-mono">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                          <span>Live telemetry calibration & LCC calculation active. Nodes can be unlinked anytime in settings.</span>
                        </div>

                        {/* COMPACT INPUT GRID */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end pt-1">
                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Riot ID (GameName#TagLine)
                            </label>
                            <input
                              type="text"
                              value={lolRiotId}
                              onChange={(e) => setLolRiotId(e.target.value)}
                              placeholder="e.g. Faker#KR1"
                              className="w-full bg-[#070d14] border border-slate-700/80 focus:border-cyan-400 rounded-lg py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none transition font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Region
                            </label>
                            <select
                              value={lolRegion}
                              onChange={(e) => setLolRegion(e.target.value)}
                              className="w-full bg-[#070d14] border border-slate-700/80 focus:border-cyan-400 rounded-lg py-2 px-3 text-xs text-white focus:outline-none transition font-mono"
                            >
                              <option value="sea">SEA</option>
                              <option value="americas">Americas</option>
                              <option value="europe">Europe</option>
                              <option value="asia">Asia</option>
                            </select>
                          </div>
                        </div>

                        {/* CONNECT AND SYNC ACTION BUTTON */}
                        <button
                          onClick={handleSyncLolFromAPI}
                          disabled={isSyncingTracker}
                          className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-black text-xs py-2.5 px-4 rounded-lg uppercase tracking-wider transition shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center space-x-2 cursor-pointer"
                        >
                          <span>{isSyncingTracker ? 'CONNECTING IDENTITY...' : 'CONNECT & SYNC LEAGUE OF LEGENDS'}</span>
                        </button>
                      </div>
                    )}
                  </>
                ) : selectedGame === 'Apex Legends' || selectedGame?.toLowerCase().includes('apex') ? (
                  <>
                    {/* APEX LEGENDS MANUAL TELEMETRY INGESTION NODE */}
                    <div className="bg-[#0b1320] border border-cyan-500/20 rounded-xl p-6 shadow-lg mb-4 max-w-3xl">
                      <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
                        <div>
                          <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase block">
                            MANUAL TELEMETRY INGESTION NODE
                          </span>
                          <h3 className="text-sm md:text-base font-black text-white uppercase tracking-wide">
                            APEX LEGENDS MATCH TELEMETRY
                          </h3>
                        </div>
                        <span className="px-2.5 py-1 text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
                          MANUAL PROTOCOL
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 mb-5 font-mono leading-relaxed">
                        Input individual Apex Legends match scores directly to calibrate your performance rating and LCC linear growth.
                      </p>

                      <form onSubmit={handleApexManualSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Player Handle</label>
                            <input
                              type="text"
                              placeholder="e.g. Zer0"
                              value={apexManualForm.playerName}
                              onChange={(e) => setApexManualForm({ ...apexManualForm, playerName: e.target.value })}
                              className="w-full bg-[#070d14] border border-slate-700/80 focus:border-cyan-400 rounded-lg p-2 text-xs text-white focus:outline-none font-mono"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Legend</label>
                            <select
                              value={apexManualForm.legend}
                              onChange={(e) => setApexManualForm({ ...apexManualForm, legend: e.target.value })}
                              className="w-full bg-[#070d14] border border-slate-700/80 focus:border-cyan-400 rounded-lg p-2 text-xs text-white focus:outline-none font-mono"
                            >
                              <option value="Wraith">Wraith</option>
                              <option value="Pathfinder">Pathfinder</option>
                              <option value="Horizon">Horizon</option>
                              <option value="Bloodhound">Bloodhound</option>
                              <option value="Bangalore">Bangalore</option>
                              <option value="Loba">Loba</option>
                              <option value="Alter">Alter</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Outcome</label>
                            <select
                              value={apexManualForm.outcome}
                              onChange={(e) => setApexManualForm({ ...apexManualForm, outcome: e.target.value })}
                              className="w-full bg-[#070d14] border border-slate-700/80 focus:border-cyan-400 rounded-lg p-2 text-xs text-white focus:outline-none font-mono"
                            >
                              <option value="CHAMPION">CHAMPION (1st)</option>
                              <option value="TOP 3">TOP 3</option>
                              <option value="TOP 5">TOP 5</option>
                              <option value="DEFEAT">DEFEAT</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Rank / Standing</label>
                            <select
                              value={apexManualForm.rankTier}
                              onChange={(e) => setApexManualForm({ ...apexManualForm, rankTier: e.target.value })}
                              className="w-full bg-[#070d14] border border-slate-700/80 focus:border-cyan-400 rounded-lg p-2 text-xs text-white focus:outline-none font-mono font-bold text-amber-400"
                            >
                              <option value="APEX PREDATOR">APEX PREDATOR</option>
                              <option value="MASTER">MASTER</option>
                              <option value="DIAMOND (15,000 - 19,999 RP)">DIAMOND (15,000 - 19,999 RP)</option>
                              <option value="PLATINUM (10,000 - 14,999 RP)">PLATINUM (10,000 - 14,999 RP)</option>
                              <option value="GOLD (5,000 - 9,999 RP)">GOLD (5,000 - 9,999 RP)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <div>
                            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Kills</label>
                            <input
                              type="number"
                              min="0"
                              value={apexManualForm.kills}
                              onChange={(e) => setApexManualForm({ ...apexManualForm, kills: e.target.value })}
                              className="w-full bg-[#070d14] border border-slate-700/80 focus:border-cyan-400 rounded-lg p-2 text-xs text-white focus:outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Deaths</label>
                            <input
                              type="number"
                              min="0"
                              value={apexManualForm.deaths}
                              onChange={(e) => setApexManualForm({ ...apexManualForm, deaths: e.target.value })}
                              className="w-full bg-[#070d14] border border-slate-700/80 focus:border-cyan-400 rounded-lg p-2 text-xs text-white focus:outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Assists</label>
                            <input
                              type="number"
                              min="0"
                              value={apexManualForm.assists}
                              onChange={(e) => setApexManualForm({ ...apexManualForm, assists: e.target.value })}
                              className="w-full bg-[#070d14] border border-slate-700/80 focus:border-cyan-400 rounded-lg p-2 text-xs text-white focus:outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Damage</label>
                            <input
                              type="number"
                              min="0"
                              value={apexManualForm.damage}
                              onChange={(e) => setApexManualForm({ ...apexManualForm, damage: e.target.value })}
                              className="w-full bg-[#070d14] border border-slate-700/80 focus:border-cyan-400 rounded-lg p-2 text-xs text-white focus:outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Placement (#)</label>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={apexManualForm.placement}
                              onChange={(e) => setApexManualForm({ ...apexManualForm, placement: e.target.value })}
                              className="w-full bg-[#070d14] border border-slate-700/80 focus:border-cyan-400 rounded-lg p-2 text-xs text-white focus:outline-none font-mono"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmittingApex}
                          className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black tracking-wider uppercase rounded-lg text-xs transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                        >
                          {isSubmittingApex ? 'RECORDING TELEMETRY...' : 'RECORD APEX MATCH TELEMETRY'}
                        </button>
                      </form>
                    </div>
                  </>
                ) : selectedGame === 'F1 25' || selectedGame?.toLowerCase().includes('f1') ? null : (
                  <div className="p-4 rounded-2xl bg-slate-800/20 border border-slate-700/50 text-center">
                    <p className="text-xs font-mono text-slate-400">Direct API integration for {selectedGame} is currently under construction. Please use another title.</p>
                  </div>
                )}
              </div>
            )}

          </div>
        ) : (
          /* CHANNEL B: MANUAL SCORECARD VERIFICATION */
          <div className="p-7 md:p-8 rounded-3xl bg-white dark:bg-[#0b111e] border border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.12)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                  MANUAL SCORECARD VERIFICATION
                </span>
                <h3 className="text-lg font-bold font-mono text-slate-900 dark:text-white uppercase mt-0.5">
                  {selectedGame} MATCH REPORT ENTRY
                </h3>
              </div>
              <span className="self-start sm:self-auto px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-950/70 border border-amber-500/40 text-amber-300 uppercase">
                MANUAL ENTRY REQUIRED
              </span>
            </div>

            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 leading-relaxed">
              Direct telemetry API hooks are unavailable for <strong>{selectedGame}</strong>. Submit verified scorecard data below to calibrate match growth.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1.5">DIVISION / BRACKET</label>
                <input
                  type="text"
                  value={manualDivision}
                  onChange={(e) => setManualDivision(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1.5">SKILL RATING (SR)</label>
                <input
                  type="text"
                  value={manualSkillRating}
                  onChange={(e) => setManualSkillRating(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1.5">GOALS / ROUND IMPACT</label>
                <input
                  type="number"
                  value={manualGoals}
                  onChange={(e) => setManualGoals(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1.5">PASS ACCURACY %</label>
                <input
                  type="number"
                  value={manualPassAccuracy}
                  onChange={(e) => setManualPassAccuracy(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1.5">POSSESSION %</label>
                <input
                  type="number"
                  value={manualPossession}
                  onChange={(e) => setManualPossession(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleIngestMatch('MANUAL_ENTRY')}
              className="w-full py-3.5 rounded-xl bg-amber-400 text-slate-950 font-mono text-xs font-bold uppercase hover:bg-amber-300 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-40 cursor-pointer mt-4"
            >
              {isSubmitting ? 'SUBMITTING SCORECARD...' : '✍ SUBMIT MANUAL SCORECARD RECORD'}
            </button>

          </div>
        )}
      </div>
      )}

      {/* DATA PIPELINE SECTION */}
      {selectedGame?.toLowerCase().includes('apex') ? (
        <div className="bg-[#0b1320] border border-cyan-500/20 rounded-xl p-6 shadow-2xl font-mono">
          <div className="flex items-center justify-between mb-4 border-b border-cyan-500/10 pb-3">
            <div>
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest block">
                DATA PIPELINE
              </span>
              <h4 className="text-sm font-black text-white uppercase">
                APEX LEGENDS TELEMETRY STREAM LOG
              </h4>
            </div>
            <span className="text-xs text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded border border-cyan-500/30">
              {apexMatches?.length || 0} Packets Ingested
            </span>
          </div>

          <div className="space-y-2">
            {apexMatches && apexMatches.length > 0 ? (
              apexMatches.map((m, idx) => {
                const p = m.metrics_payload || {};
                const outcome = p.outcome || 'CHAMPION';
                const legend = p.legend || 'Wraith';
                const isChamp = outcome.toUpperCase().includes('CHAMPION') || p.placement === '1' || p.placement === '#1';
                const kills = p.kills ?? 0;
                const deaths = p.deaths ?? 1;
                const assists = p.assists ?? 0;
                const damage = p.damage ?? 0;
                const kd = p.kd_ratio || (kills / Math.max(1, deaths)).toFixed(2);
                const rating = m.performance_score || '50.0';

                return (
                  <div
                    key={m.id || idx}
                    className="bg-[#060a12] border border-slate-800 hover:border-cyan-500/40 rounded-lg p-3.5 flex items-center justify-between transition-all"
                  >
                    {/* LEFT: OUTCOME & LEGEND */}
                    <div className="flex items-center gap-4 min-w-[220px]">
                      <div>
                        <h5 className={`text-xs font-black uppercase ${isChamp ? 'text-cyan-400' : 'text-slate-200'}`}>
                          {outcome}
                        </h5>
                        <span className="text-[9px] text-slate-500 block">SCORE</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-white uppercase">{legend}</h4>
                          <span className="px-1.5 py-0.5 bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[9px] rounded uppercase">
                            COMPETITIVE
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          {new Date(m.created_at || Date.now()).toLocaleDateString()} • ID: {m.id ? m.id.slice(0, 8) : 'apex_pkt'}
                        </span>
                      </div>
                    </div>

                    {/* RIGHT: K/D, K/D/A, DAMAGE, RATING, DELETE */}
                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <span className="text-xs font-black text-slate-200">{kd}</span>
                        <span className="text-[9px] text-slate-500 uppercase block">K/D</span>
                      </div>
                      <div>
                        <span className="text-xs font-black text-cyan-300">
                          {kills} / <span className="text-rose-400">{deaths}</span> / {assists}
                        </span>
                        <span className="text-[9px] text-slate-500 uppercase block">K/D/A</span>
                      </div>
                      <div>
                        <span className="text-xs font-black text-amber-300">{Number(damage).toLocaleString()}</span>
                        <span className="text-[9px] text-slate-500 uppercase block">DMG</span>
                      </div>
                      <div>
                        <span className="text-xs font-black text-cyan-400">{rating}</span>
                        <span className="text-[9px] text-slate-500 uppercase block">RATING</span>
                      </div>
                      <button
                        onClick={async () => {
                          if (!m.id) return;
                          try {
                            const { error } = await supabase
                              .from('apex_match_telemetry')
                              .delete()
                              .eq('id', m.id);

                            if (!error) {
                              setApexMatches((prev) => prev.filter((item) => item.id !== m.id));
                            }
                          } catch (err) {
                            console.error('Failed to delete apex match:', err);
                          }
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded transition-colors group flex items-center justify-center cursor-pointer border-none bg-transparent"
                        title="Delete Telemetry Packet"
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="14" 
                          height="14" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          className="opacity-60 group-hover:opacity-100 transition-opacity"
                        >
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10">
                <span className="text-2xl block mb-2">📡</span>
                <h5 className="text-xs font-bold text-slate-300 uppercase">No Apex Legends Telemetry Ingested</h5>
                <p className="text-[10px] text-slate-500 mt-1">
                  Use the Apex Legends ingestion node above to capture your first telemetry data packet.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : selectedGame?.toLowerCase().includes('f1') ? (
        <div className="bg-[#0b1320] border border-cyan-500/20 rounded-xl p-6 shadow-2xl font-mono">
          {/* Table Header */}
          <div className="flex items-center justify-between mb-4 border-b border-cyan-500/10 pb-3">
            <div>
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest block">
                DATA PIPELINE
              </span>
              <h4 className="text-sm font-black text-white uppercase">
                F1 25 TELEMETRY SESSION PB LOG
              </h4>
            </div>
            <span className="text-xs text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded border border-cyan-500/30">
              {f1Data?.totalLaps || 0} Sessions Ingested
            </span>
          </div>

          {/* Telemetry Row Stream */}
          <div className="space-y-2.5">
            {f1Data?.recentMatches && f1Data.recentMatches.length > 0 ? (
              [...f1Data.recentMatches].reverse().map((m, idx) => {
                const isBestOverall = parseFloat(m.lapTime) === parseFloat(f1Data.bestLap);

                return (
                  <div
                    key={m.id || idx}
                    className={`bg-[#060a12] border ${
                      isBestOverall ? 'border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]' : 'border-slate-800'
                    } hover:border-cyan-500/40 rounded-lg p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all`}
                  >
                    {/* LEFT: Track, Weather, Session Laps & Assists */}
                    <div className="flex items-center gap-4 min-w-[320px]">
                      <div>
                        <h5 className="text-xs font-black uppercase text-cyan-400">
                          SESSION #{f1Data.recentMatches.length - idx}
                        </h5>
                        <span className="text-[9px] text-slate-500 block uppercase">
                          {m.sessionMode}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black text-white uppercase tracking-wide">
                            {m.trackName}
                          </h4>
                          <span className="px-1.5 py-0.5 bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[9px] rounded uppercase font-bold">
                            {m.tyreCompound}
                          </span>
                          <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 text-slate-300 text-[9px] rounded font-bold">
                            {m.weather}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                          <span>Best of {m.totalSessionLaps || 1} Laps</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-cyan-300">TC: {m.tcMode}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-cyan-300">ABS: {m.absMode}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-cyan-300">Gear: {m.gearboxMode}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-500">ID: {String(m.id).slice(0, 8)}</span>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT: Fastest Stint Lap Time, Top Speed, Throttle & Rating */}
                    <div className="flex items-center gap-6 text-right justify-between md:justify-end">
                      <div>
                        <div className="flex items-center justify-end gap-1.5">
                          {isBestOverall && (
                            <span className="px-1.5 py-0.2 bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] rounded font-bold uppercase">
                              ALL-TIME PB
                            </span>
                          )}
                          <span className="text-sm font-black text-emerald-400">
                            {formatLapTime(m.lapTime)}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-500 uppercase block">FASTEST LAP</span>
                      </div>

                      <div>
                        <span className="text-xs font-black text-amber-300">{m.topSpeed} km/h</span>
                        <span className="text-[9px] text-slate-500 uppercase block">TOP SPEED</span>
                      </div>

                      <div>
                        <span className="text-xs font-black text-cyan-300">{m.throttle}%</span>
                        <span className="text-[9px] text-slate-500 uppercase block">THROTTLE</span>
                      </div>

                      <div>
                        <span className="text-xs font-black text-cyan-400">{m.score}</span>
                        <span className="text-[9px] text-slate-500 uppercase block">LCC SCORE</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10">
                <span className="text-2xl block mb-2">🏎️</span>
                <h5 className="text-xs font-bold text-slate-300 uppercase">No F1 25 Sessions Recorded</h5>
                <p className="text-[10px] text-slate-500 mt-1">
                  Complete a stint in EA Sports F1 25. Personal best laps will stream automatically.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[#0b131d] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[10px] font-black uppercase tracking-widest text-cyan-400">DATA PIPELINE</div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">
                {selectedGame} Telemetry Stream Log
              </h3>
            </div>
            <span className="text-xs font-mono bg-[#070b10] border border-slate-800 text-cyan-400 px-3 py-1 rounded-lg">
              {cycleMatches.length} Packets Ingested
            </span>
          </div>

        {cycleMatches.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800/80 rounded-xl bg-[#070d14]/50 space-y-2">
            <div className="text-2xl">📡</div>
            <div className="text-sm font-bold text-slate-300">No {selectedGame} Telemetry Ingested</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Use the {selectedGame} ingestion node above to capture your first telemetry data packet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {cycleMatches.map((log, idx) => {
              if (selectedGame === 'Valorant' || selectedGame === 'Dota 2' || selectedGame === 'League of Legends' || selectedGame === 'Counter-Strike 2' || selectedGame === 'Apex Legends') {
                const isDota = selectedGame === 'Dota 2';
                const isLol = selectedGame === 'League of Legends';
                const isCs2 = selectedGame === 'Counter-Strike 2';
                const isApex = selectedGame === 'Apex Legends';
                const roundsWon = log.metrics_payload?.rounds_won ?? log.rounds_won;
                const roundsLost = log.metrics_payload?.rounds_lost ?? log.rounds_lost;
                const formattedScore = (isDota || isLol || isCs2 || isApex)
                  ? (log.metrics_payload?.outcome || 'VICTORY')
                  : (roundsWon !== undefined && roundsLost !== undefined) 
                    ? `${roundsWon} - ${roundsLost}` 
                    : (log.metrics_payload?.score_rounds || log.score || '13 - 10');
                const mapName = isDota 
                  ? getDotaHeroName(log.metrics_payload?.hero_id)
                  : isLol
                    ? (log.metrics_payload?.champion_name || 'CHAMPION')
                    : isCs2
                    ? (log.metrics_payload?.map_name || log.metrics_payload?.map || 'de_mirage')
                    : isApex
                    ? (log.metrics_payload?.placement ? `Placement ${log.metrics_payload.placement}` : 'CHAMPION')
                    : (log.metrics_payload?.map || log.map || 'LOTUS');
                const agentName = isDota 
                  ? (log.metrics_payload?.team || 'Radiant')
                  : isLol
                    ? (log.metrics_payload?.role || 'LANE')
                    : isCs2
                    ? 'Competitive'
                    : isApex
                    ? (log.metrics_payload?.legend || 'Wraith')
                    : (log.metrics_payload?.agent || log.agent || 'OMEN');
                const kdVal = (isDota || isLol || isCs2 || isApex)
                  ? (log.metrics_payload?.kd_ratio || log.metrics_payload?.kda || log.metrics_payload?.kd || 1.0)
                  : (log.metrics_payload?.kd || log.metrics_payload?.kd_ratio || log.kd || log.kd_ratio || 1.0);
                const killsVal = log.metrics_payload?.kills || log.kills || 0;
                const deathsVal = log.metrics_payload?.deaths || log.deaths || 0;
                const assistsVal = log.metrics_payload?.assists || log.assists || 0;
                const acsVal = isDota 
                  ? (log.metrics_payload?.gpm || 0)
                  : isLol
                    ? (log.metrics_payload?.cs_per_min !== undefined ? `${log.metrics_payload.cs_per_min} CS/M` : (log.metrics_payload?.cs || 0))
                    : isCs2
                    ? (log.metrics_payload?.adr !== undefined ? `${log.metrics_payload.adr} ADR` : 100)
                    : isApex
                    ? (log.metrics_payload?.damage !== undefined ? `${log.metrics_payload.damage} DMG` : 1000)
                    : (log.metrics_payload?.acs || log.acs || 210);
                const hsVal = isDota 
                  ? (log.metrics_payload?.xpm)
                  : isLol
                    ? (log.metrics_payload?.vision_score !== undefined ? `${log.metrics_payload.vision_score} VS` : undefined)
                    : isCs2
                    ? (log.metrics_payload?.hs_percent !== undefined ? `${log.metrics_payload.hs_percent}%` : (log.metrics_payload?.hs_percentage !== undefined ? `${log.metrics_payload.hs_percentage}%` : undefined))
                    : isApex
                    ? (log.metrics_payload?.rank || 'DIAMOND IV')
                    : (log.metrics_payload?.hs_percentage || log.metrics_payload?.hs_percent || log.hs_percentage || log.hs_percent);
                const ratingVal = log.performance_score || log.calculated_rating || log.rating || 65.0;
                const dateVal = new Date(log.created_at || log.match_date || Date.now()).toLocaleDateString();
                const idVal = String(log.id || log.match_id || '');

                return (
                  <div 
                    key={log.id || idx}
                    className="relative flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-[#070e17] border border-slate-800/80 hover:border-cyan-500/40 hover:bg-[#0a1320] transition-all shadow-sm"
                  >
                    {/* LEFT SECTION: Score, Map, Agent, Meta */}
                    <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                      {/* Primary Score Display */}
                      <div className="w-16 sm:w-20 shrink-0 text-left">
                        <div className="text-sm sm:text-base font-mono font-black text-white tracking-wide">
                          {formattedScore}
                        </div>
                        <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                          {isDota ? 'OUTCOME' : 'SCORE'}
                        </div>
                      </div>

                      {/* Map Name & Agent Badge */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm sm:text-base font-black text-white tracking-wide uppercase">
                            {mapName}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 rounded-md uppercase">
                            {agentName}
                          </span>
                        </div>
                        
                        {/* Meta Tags */}
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 mt-0.5">
                          <span className="text-cyan-500 font-semibold uppercase">{isDota ? 'Ranked Match' : 'Competitive'}</span>
                          <span>•</span>
                          <span>{dateVal}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline">ID: {idVal.slice(0, 8)}</span>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT SECTION: Stats Columns */}
                    <div className="flex items-center gap-4 sm:gap-7 shrink-0 font-mono">
                      {/* K/D Ratio */}
                      <div className="text-center">
                        <div className={`text-xs sm:text-sm font-black ${Number(kdVal) >= 1 ? 'text-emerald-400' : 'text-slate-300'}`}>
                          {Number(kdVal).toFixed(2)}
                        </div>
                        <div className="text-[9px] text-slate-500 tracking-wider">{isDota || isLol ? 'KDA' : 'K/D'}</div>
                      </div>

                      {/* KDA */}
                      <div className="text-center hidden sm:block">
                        <div className="text-xs sm:text-sm font-bold text-slate-200">
                          <span className="text-cyan-400">{killsVal}</span> / <span className="text-rose-400">{deathsVal}</span> / <span className="text-slate-400">{assistsVal}</span>
                        </div>
                        <div className="text-[9px] text-slate-500 tracking-wider">K/D/A</div>
                      </div>

                      {/* ACS */}
                      <div className="text-center">
                        <div className="text-xs sm:text-sm font-black text-white">
                          {acsVal}
                        </div>
                        <div className="text-[9px] text-slate-500 tracking-wider">{isDota ? 'GPM' : isLol ? 'CS RATE' : isCs2 ? 'ADR' : 'ACS'}</div>
                      </div>

                      {/* HS% / Vision */}
                      {hsVal !== undefined && (
                        <div className="text-center hidden md:block">
                          <div className="text-xs sm:text-sm font-bold text-emerald-400">
                            {isDota ? `${hsVal} XP` : isLol ? hsVal : `${hsVal}%`}
                          </div>
                          <div className="text-[9px] text-slate-500 tracking-wider">{isDota ? 'XPM' : isLol ? 'VISION' : 'HS%'}</div>
                        </div>
                      )}

                      {/* Rating */}
                      <div className="text-center">
                        <div className="text-xs sm:text-sm font-black text-cyan-400">
                          {Number(ratingVal).toFixed(1)}
                        </div>
                        <div className="text-[9px] text-cyan-600/80 tracking-wider font-bold">RATING</div>
                      </div>

                      {/* Delete Action Button */}
                      <button
                        onClick={() => handleDeleteTelemetry(log.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition border-none bg-transparent cursor-pointer"
                        title="Delete Match Packet"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              }

              // Fallback default style for other games
              return (
                <div key={log.id || idx} className="bg-[#070d14] border border-slate-800/80 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <span>{log.metrics_payload?.track || log.metrics_payload?.map || log.map || `${selectedGame} Match #${idx + 1}`}</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{new Date(log.created_at || log.match_date || Date.now()).toLocaleDateString()}</span>
                      <span className="text-slate-600">//</span>
                      <span>ID: {log.id ? String(log.id).slice(0, 8) : `LOG-${idx + 1}`}</span>
                    </div>
                  </div>

                  {/* Dynamic Metric Badges */}
                  <div className="flex items-center gap-4 text-xs font-mono">
                    {log.metrics_payload?.lap_time && (
                      <div><span className="text-slate-500">LAP:</span> <span className="text-cyan-400 font-bold">{log.metrics_payload.lap_time}</span></div>
                    )}
                    {(log.metrics_payload?.kd_ratio || log.metrics_payload?.kd) && (
                      <div><span className="text-slate-500">K/D:</span> <span className="text-cyan-400 font-bold">{log.metrics_payload.kd_ratio || log.metrics_payload.kd}</span></div>
                    )}
                    {(log.metrics_payload?.hs_percentage || log.hs_percentage) && (
                      <div><span className="text-slate-500">HS%:</span> <span className="text-emerald-400 font-bold">{log.metrics_payload?.hs_percentage || log.hs_percentage}%</span></div>
                    )}
                    {log.metrics_payload?.acs && (
                      <div><span className="text-slate-500">ACS:</span> <span className="text-white font-bold">{log.metrics_payload.acs}</span></div>
                    )}
                    <div><span className="text-slate-500">RATING:</span> <span className="text-white font-bold">{log.performance_score?.toFixed(1) || log.calculated_rating || 'N/A'}</span></div>

                    <button
                      onClick={() => handleDeleteTelemetry(log.id)}
                      className="ml-2 p-1.5 rounded bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition border border-rose-500/20 cursor-pointer border-none bg-transparent"
                      title="Delete Record"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* --- CUSTOM TELEMETRY STATUS TOAST --- */}
      {syncToast && syncToast.show && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-[#0b1320] border border-cyan-500/40 rounded-xl p-4 shadow-2xl flex items-center gap-4 font-mono min-w-[320px] backdrop-blur-md">
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <div className="flex-1">
              <h5 className="text-xs font-bold text-cyan-300 uppercase">
                {syncToast.title || 'TELEMETRY RECORDED'}
              </h5>
              {syncToast.map && (
                <p className="text-xs text-slate-300 mt-0.5">
                  Map/Mode: <span className="text-cyan-200">{syncToast.map}</span>
                </p>
              )}
              {syncToast.message && (
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  {syncToast.message}
                </p>
              )}
              {syncToast.kd !== undefined && syncToast.kd !== null && (
                <span className="text-[10px] text-cyan-400/80 block mt-1">
                  K/D: {!isNaN(Number(syncToast.kd)) ? Number(syncToast.kd).toFixed(2) : String(syncToast.kd)}
                </span>
              )}
              {syncToast.rating !== undefined && syncToast.rating !== null && !isNaN(Number(syncToast.rating)) && (
                <span className="text-[10px] text-amber-400 block mt-0.5">
                  RATING: {Number(syncToast.rating).toFixed(1)}
                </span>
              )}
              {syncToast.score !== undefined && syncToast.score !== null && !isNaN(Number(syncToast.score)) && (
                <span className="text-[10px] text-emerald-400 block mt-0.5">
                  SCORE: {Number(syncToast.score).toFixed(1)}
                </span>
              )}
              {syncToast.acs !== undefined && syncToast.acs !== null && (
                <span className="text-[10px] text-slate-300 block mt-0.5">
                  STAT: {String(syncToast.acs)}
                </span>
              )}
            </div>
            <button
              onClick={() => setSyncToast((prev) => (prev ? { ...prev, show: false } : null))}
              className="text-slate-500 hover:text-white text-xs ml-2 transition-colors cursor-pointer border-none bg-transparent"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* --- CUSTOM CYBERPUNK / GLASSMORPHIC UNLINK CONFIRMATION MODAL --- */}
      {showUnlinkModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#0b131d] border border-red-500/40 rounded-2xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.25)] space-y-5">
            {/* Modal Header */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-800/90">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 text-lg font-black shrink-0">
                ⚠️
              </div>
              <div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-400">
                  CRITICAL ACTION • PERMANENT PURGE
                </div>
                <h3 className="text-base font-black text-white uppercase tracking-wide">
                  Disconnect {selectedGame}
                </h3>
              </div>
            </div>

            {/* Warning Message */}
            <div className="space-y-3 font-mono text-xs text-slate-300">
              <p className="leading-relaxed">
                Are you sure you want to disconnect your <span className="text-white font-bold">{selectedGame}</span> telemetry node?
              </p>
              <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/20 space-y-1.5 text-[11px] text-red-200/90">
                <div className="font-bold flex items-center gap-1.5 text-red-400">
                  <span>⚡</span> CONSEQUENCES OF UNLINKING:
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[10.5px]">
                  <li>All ingested <span className="text-slate-200">{selectedGame}</span> telemetry packets will be <strong className="text-red-300">permanently purged</strong>.</li>
                  <li>Calculated <span className="text-slate-200">Learning Curve Coefficient (LCC)</span> and growth slope will reset to baseline.</li>
                  <li>Active identity bindings will be severed.</li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowUnlinkModal(false)}
                disabled={isSyncingTracker}
                className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleConfirmUnlink}
                disabled={isSyncingTracker}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-black uppercase tracking-wider transition shadow-[0_0_20px_rgba(239,68,68,0.4)] disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {isSyncingTracker ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>PURGING NODE...</span>
                  </>
                ) : (
                  <span>CONFIRM UNLINK & PURGE</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
