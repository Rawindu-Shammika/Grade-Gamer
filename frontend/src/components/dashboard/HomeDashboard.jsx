import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../../services/supabaseClient";
import useAuth from "../../hooks/useAuth";
import { calculateLCCMetrics } from '../../utils/lccCalculator';
import { fetchCurrentValorantAct } from '../../utils/valorantActService';
import { applyGlobalActReset } from '../../utils/actDataSync';
import { getDotaHeroName } from '../../utils/dotaHeroes';
import { calculateDotaLinearGrowth } from '../../utils/dotaStats';
import { getBannerImageUrl, SUPABASE_UI_BASE } from '../../utils/supabaseAssets';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

const SUPPORTED_GAMES = [
  { id: 'Valorant', name: 'VALORANT' },
  { id: 'Assetto Corsa', name: 'ASSETTO CORSA' },
  { id: 'F1 25', name: 'F1 25' },
  { id: 'Counter-Strike 2', name: 'COUNTER-STRIKE 2' },
  { id: 'League of Legends', name: 'LEAGUE OF LEGENDS' },
  { id: 'Dota 2', name: 'DOTA 2' },
];

const formatLapTime = (sec) => {
  if (!sec || isNaN(sec)) return '--:--.---';
  const total = parseFloat(sec);
  const minutes = Math.floor(total / 60);
  const remainingSec = (total % 60).toFixed(3);
  return `${minutes}:${remainingSec < 10 ? '0' : ''}${remainingSec}`;
};

// Verified banner assets with guaranteed local fallbacks
const DASHBOARD_BANNERS = [
  { remote: 'PUBG i.jpg', fallback: '/banners/Valo1.jpg' },
  { remote: 'APEX iv.jpg', fallback: '/banners/Esports.jpg' },
];

// 1. Color Helper for Text, Box Accent, and Dot Glow
const getRankTheme = (tierName) => {
  const rank = String(tierName || '').toUpperCase();

  if (rank.includes('HERALD') || rank.includes('GUARDIAN')) {
    return { 
      text: 'text-stone-400', 
      boxBorder: 'border-stone-500/30',
      dot: 'bg-stone-400 shadow-[0_0_10px_rgba(168,162,158,0.8)]' 
    };
  }
  if (rank.includes('CRUSADER') || rank.includes('ARCHON')) {
    return { 
      text: 'text-cyan-400', 
      boxBorder: 'border-cyan-500/30',
      dot: 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]' 
    };
  }
  if (rank.includes('LEGEND')) {
    return { 
      text: 'text-yellow-400', 
      boxBorder: 'border-yellow-500/30',
      dot: 'bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.85)]' 
    };
  }
  if (rank.includes('ANCIENT') || rank.includes('DIVINE')) {
    return { 
      text: 'text-purple-450 dark:text-purple-400', 
      boxBorder: 'border-purple-500/30',
      dot: 'bg-purple-400 shadow-[0_0_12px_rgba(192,132,252,0.85)]' 
    };
  }
  if (rank.includes('IRON')) {
    return { 
      text: 'text-stone-400', 
      boxBorder: 'border-stone-500/30',
      dot: 'bg-stone-400 shadow-[0_0_10px_rgba(168,162,158,0.8)]' 
    };
  }
  if (rank.includes('BRONZE')) {
    return { 
      text: 'text-amber-700', 
      boxBorder: 'border-amber-700/30',
      dot: 'bg-amber-700 shadow-[0_0_10px_rgba(180,83,9,0.8)]' 
    };
  }
  if (rank.includes('SILVER')) {
    return { 
      text: 'text-slate-300', 
      boxBorder: 'border-slate-400/30',
      dot: 'bg-slate-300 shadow-[0_0_10px_rgba(203,213,225,0.8)]' 
    };
  }
  if (rank.includes('GOLD')) {
    return { 
      text: 'text-yellow-400', 
      boxBorder: 'border-yellow-500/30',
      dot: 'bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.85)]' 
    };
  }
  if (rank.includes('PLATINUM')) {
    return { 
      text: 'text-teal-400', 
      boxBorder: 'border-teal-500/30',
      dot: 'bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.85)]' 
    };
  }
  if (rank.includes('DIAMOND')) {
    return { 
      text: 'text-fuchsia-400', 
      boxBorder: 'border-fuchsia-500/30',
      dot: 'bg-fuchsia-400 shadow-[0_0_14px_rgba(232,121,249,0.9)]' 
    };
  }
  if (rank.includes('ASCENDANT')) {
    return { 
      text: 'text-emerald-400', 
      boxBorder: 'border-emerald-500/30',
      dot: 'bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]' 
    };
  }
  if (rank.includes('IMMORTAL')) {
    return { 
      text: 'text-rose-500', 
      boxBorder: 'border-rose-500/30',
      dot: 'bg-rose-500 shadow-[0_0_14px_rgba(244,63,94,0.9)]' 
    };
  }
  if (rank.includes('RADIANT')) {
    return { 
      text: 'text-amber-200', 
      boxBorder: 'border-amber-300/40',
      dot: 'bg-amber-200 shadow-[0_0_16px_rgba(253,230,138,1)]' 
    };
  }

  return { 
    text: 'text-cyan-400', 
    boxBorder: 'border-cyan-500/30',
    dot: 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]' 
  };
};

const getTelemetryTable = (gameKey) => {
  const g = (gameKey || '').toLowerCase();
  if (g.includes('dota')) return 'dota2_match_telemetry';
  if (g.includes('lol') || g.includes('league')) return 'lol_match_telemetry';
  if (g.includes('cs') || g.includes('counter-strike')) return 'cs2_match_telemetry';
  if (g.includes('apex')) return 'apex_match_telemetry';
  if (g.includes('f1')) return 'f1_match_telemetry';
  return 'valorant_match_telemetry';
};

export const HomeDashboard = () => {
  const { user, profile } = useAuth();
  const [activeTitles, setActiveTitles] = useState(() => (
    profile?.esports_titles?.length 
      ? profile.esports_titles 
      : (profile?.active_titles?.length ? profile.active_titles : ['Valorant', 'League of Legends', 'Dota 2', 'Counter-Strike 2', 'Assetto Corsa', 'F1 25'])
  ));

  const [selectedGame, setSelectedGame] = useState('Valorant');
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

  useEffect(() => {
    if (activeTitles.length > 0 && !activeTitles.includes(selectedGame)) {
      setSelectedGame(activeTitles[0]);
    }
  }, [activeTitles, selectedGame]);
  const [valorantMatches, setValorantMatches] = useState([]);
  const [boundHandle, setBoundHandle] = useState('UNLINKED');
  const [loading, setLoading] = useState(true);

  // F1 25 Telemetry Fetching & Polling
  const [f1Data, setF1Data] = useState(null);

  // EA FC 27 Telemetry Fetching
  const [fcMatches, setFcMatches] = useState([]);
  const isFcSelected = selectedGame === 'EA FC 27' || String(selectedGame || '').toLowerCase().includes('fc') || String(selectedGame || '').toLowerCase().includes('fifa');

  useEffect(() => {
    if (isFcSelected && user?.id) {
      const fetchFcMatches = async () => {
        try {
          const { data, error } = await supabase
            .from('fc27_match_telemetry')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });

          if (!error && data) {
            setFcMatches(data);
          } else {
            setFcMatches([]);
          }
        } catch (err) {
          console.error('Error loading FC 27 matches:', err);
        }
      };

      fetchFcMatches();
    }
  }, [isFcSelected, user?.id]);

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

  // 2. Carousel State & Auto-Rotate Handler
  const [bannerIndex, setBannerIndex] = useState(0);

  const handleNextBanner = () => {
    setBannerIndex((prev) => (prev + 1) % DASHBOARD_BANNERS.length);
  };

  // Optional: Auto-rotate every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % DASHBOARD_BANNERS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // 1. Add Skill Review Aggregation State & Fetch
  const [receivedReviews, setReceivedReviews] = useState([]);

  useEffect(() => {
    const loadPeerSkillData = async () => {
      if (!user?.id) return;

      try {
        // Query peer reviews for this user filtered by game
        const { data: reviews, error } = await supabase
          .from('peer_reviews')
          .select('*')
          .eq('target_user_id', user.id)
          .ilike('game_title', selectedGame);

        if (!error && reviews) {
          setReceivedReviews(reviews);
        } else {
          setReceivedReviews([]);
        }
      } catch (err) {
        console.error("Error loading peer skill reviews:", err);
      }
    };

    loadPeerSkillData();
  }, [user, selectedGame]);

  // 2. Global Reset Applied to Peer Reviews for this Act
  const activeCycleReviews = useMemo(() => {
    return applyGlobalActReset(receivedReviews, selectedGame, actInfo);
  }, [receivedReviews, selectedGame, actInfo]);

  // 3. Compute skill scores dynamically from active cycle reviews
  const skillScores = useMemo(() => {
    if (activeCycleReviews.length === 0) {
      return {
        communication: 0,
        teamplay: 0,
        mechanical: 0,
        leadership: 0,
        reviewCount: 0,
        hasLeadership: false
      };
    }

    let commSum = 0;
    let teamSum = 0;
    let mechSum = 0;
    let leadSum = 0;
    let leadCount = 0;

    activeCycleReviews.forEach((r) => {
      const c = r.communication_rating ?? r.communication ?? 4;
      const t = r.teamplay_rating ?? r.tactical_rating ?? r.teamplay ?? 4.2;
      const m = r.mechanical_rating ?? r.execution_rating ?? r.mechanical ?? 4.1;
      const l = r.leadership_rating ?? r.leadership_score ?? r.leadership ?? null;

      commSum += c > 5 ? c : (c / 5) * 100;
      teamSum += t > 5 ? t : (t / 5) * 100;
      mechSum += m > 5 ? m : (m / 5) * 100;

      if (l !== null && l !== undefined) {
        leadSum += l > 5 ? l : (l / 5) * 100;
        leadCount++;
      }
    });

    const isIGLForGame = Boolean(
      profile?.is_igl ||
      profile?.game_roles?.[selectedGame]?.includes('IGL') ||
      leadCount > 0
    );

    const count = activeCycleReviews.length;
    return {
      communication: Math.round(commSum / count),
      teamplay: Math.round(teamSum / count),
      mechanical: Math.round(mechSum / count),
      leadership: leadCount > 0 ? Math.round(leadSum / leadCount) : 0,
      reviewCount: count,
      hasLeadership: isIGLForGame && leadCount > 0
    };
  }, [activeCycleReviews, profile, selectedGame]);

  // Status label helper
  const getStatusLabel = (score) => {
    if (skillScores.reviewCount === 0 || score === 0) return { label: 'UNCALIBRATED', color: 'text-slate-500', bar: 'bg-slate-800' };
    if (score >= 90) return { label: 'ELITE STATUS', color: 'text-cyan-400', bar: 'bg-cyan-400' };
    if (score >= 80) return { label: 'MASTER STATUS', color: 'text-cyan-400', bar: 'bg-cyan-500' };
    if (score >= 70) return { label: 'PRO STATUS', color: 'text-emerald-400', bar: 'bg-emerald-400' };
    return { label: 'DEVELOPING STATUS', color: 'text-amber-400', bar: 'bg-amber-400' };
  };

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);

      try {
        // Fetch profile handle
        const { data: userProfileData } = await supabase
          .from('profiles')
          .select('*, valorant_id, lol_riot_id, lol_puuid, dota2_steam_id, cs2_steam_id')
          .eq('id', user.id)
          .maybeSingle();

        const p = userProfileData || profile || {};

        if (isMounted) {
          if (selectedGame === 'Dota 2' && (p.dota2_steam_id || p.steam_id)) {
            setBoundHandle(`STEAM ID: ${p.dota2_steam_id || p.steam_id}`);
          } else if (selectedGame === 'Counter-Strike 2' && (p.cs2_steam_id || p.steam_id)) {
            setBoundHandle(`STEAM ID: ${p.cs2_steam_id || p.steam_id}`);
          } else if (selectedGame === 'League of Legends' && (p.lol_riot_id || p.lol_puuid)) {
            setBoundHandle(p.lol_riot_id ? `${p.lol_riot_id}` : `RIOT PUUID: ${p.lol_puuid.slice(0, 10)}...`);
          } else if (selectedGame === 'Apex Legends' && p.apex_player_id) {
            setBoundHandle(`APEX ID: ${p.apex_player_id}`);
          } else if (p.valorant_id || (p.valorant_ign && p.valorant_tag)) {
            setBoundHandle(p.valorant_id || `${p.valorant_ign}#${p.valorant_tag || ''}`);
          } else {
            setBoundHandle('UNLINKED');
          }
        }

        // Fetch matches from telemetry table dynamically
        const tableName = getTelemetryTable(selectedGame);
        let query = supabase
          .from(tableName)
          .select('*')
          .eq('user_id', user.id);
          
        if (tableName === 'game_match_telemetry') {
          query = query.eq('game_title', selectedGame);
        }

        const { data: matches, error } = await query.order(
          tableName === 'game_match_telemetry' ? 'match_date' : 'created_at', 
          { ascending: false }
        );

        if (isMounted) {
          if (!error && matches) {
            const competitiveMatches = matches.filter((match) => {
              if (selectedGame !== 'Valorant') return true;
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
            setValorantMatches(competitiveMatches);
          } else {
            setValorantMatches([]);
          }
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDashboardData();
    return () => { isMounted = false; };
  }, [user, selectedGame]);

  const totalMatchesCount = valorantMatches?.length || 0;
  const latestRecord = totalMatchesCount > 0 ? valorantMatches[0] : null;
  const payload = latestRecord?.metrics_payload || latestRecord || {};

  const liveRank = useMemo(() => {
    if (isFcSelected) {
      const latestFc = fcMatches.length > 0 ? fcMatches[fcMatches.length - 1] : null;
      const p = latestFc?.metrics_payload || latestFc || {};
      return (p.division || profile?.fc27_division || 'ELITE DIVISION').toUpperCase();
    }
    if (selectedGame === 'F1 25') {
      return f1Data?.bestLap ? `BEST LAP: ${f1Data.bestLap}s` : 'CALIBRATING';
    }
    if (selectedGame === 'Dota 2') {
      return payload?.competitive_rank || profile?.dota2_rank || 'UNRATED';
    }
    if (selectedGame === 'League of Legends') {
      return payload?.competitive_rank || profile?.lol_rank || 'UNRATED';
    }
    if (selectedGame === 'Counter-Strike 2') {
      return payload?.competitive_rank || profile?.cs2_rank || 'GLOBAL ELITE';
    }
    if (selectedGame === 'Apex Legends') {
      return payload?.rank || profile?.apex_rank || 'DIAMOND IV';
    }
    return payload?.rank || 'UNRATED';
  }, [isFcSelected, fcMatches, selectedGame, payload, profile, f1Data]);

  const liveRR = payload?.elo ?? payload?.rank_rating ?? 0;

  const activeDashboardMatches = useMemo(() => {
    return applyGlobalActReset(valorantMatches || [], selectedGame, actInfo);
  }, [valorantMatches, selectedGame, actInfo]);

  const dashLCC = React.useMemo(() => {
    if (isFcSelected) {
      if (!fcMatches || fcMatches.length === 0) {
        return { slopeNumeric: 0, slope: '0.00' };
      }
      const sorted = [...fcMatches].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      const windowSize = Math.min(5, sorted.length);
      const initial = sorted.slice(0, windowSize);
      const recent = sorted.slice(-windowSize);

      const baseline = initial.reduce((sum, m) => sum + Number(m.performance_score || 0), 0) / Math.max(1, initial.length);
      const current = recent.reduce((sum, m) => sum + Number(m.performance_score || 0), 0) / Math.max(1, recent.length);
      const n = sorted.length;
      const slopeVal = ((current - baseline) / Math.max(1, n));
      const slopeStr = slopeVal > 0 ? `+${slopeVal.toFixed(2)}` : slopeVal.toFixed(2);

      return { slopeNumeric: slopeVal, slope: slopeStr };
    }
    if (selectedGame === 'F1 25' && f1Data) {
      return {
        slopeNumeric: f1Data.linearGrowthSlope || 0,
        slope: f1Data.linearGrowthSlope > 0 ? `+${f1Data.linearGrowthSlope}` : String(f1Data.linearGrowthSlope || '0.00')
      };
    }
    const list = [...(activeDashboardMatches || [])].reverse();
    if (selectedGame === 'Dota 2' || selectedGame === 'League of Legends' || selectedGame === 'Counter-Strike 2' || selectedGame === 'Apex Legends') {
      const dotaLcc = calculateDotaLinearGrowth(list);
      return {
        slopeNumeric: dotaLcc.slope,
        slope: dotaLcc.slope > 0 ? `+${dotaLcc.slope}` : String(dotaLcc.slope || '0.00')
      };
    }
    return calculateLCCMetrics(list);
  }, [isFcSelected, fcMatches, activeDashboardMatches, selectedGame, f1Data]);

  // Calculate dynamic dashboard stats from the active matches stream
  const dashboardStats = React.useMemo(() => {
    if (isFcSelected) {
      return {
        totalMatches: fcMatches.length,
        hoursCompeted: (fcMatches.length * 0.3).toFixed(1)
      };
    }
    if (selectedGame === 'F1 25' && f1Data) {
      return {
        totalMatches: f1Data.totalLaps || 0,
        hoursCompeted: ((f1Data.totalLaps || 0) * 0.05).toFixed(1),
      };
    }
    const list = Array.isArray(activeDashboardMatches) ? activeDashboardMatches : [];
    const totalMatches = list.length;

    if (totalMatches === 0) {
      return {
        totalMatches: 0,
        hoursCompeted: '0.0',
      };
    }

    // Calculate total duration in hours
    const totalSeconds = list.reduce((acc, m) => {
      // 1. If match has explicit duration in seconds
      if (m.duration_seconds !== undefined && m.duration_seconds !== null) {
        return acc + Number(m.duration_seconds);
      }
      // 2. If match has duration in milliseconds
      if (m.duration_ms !== undefined && m.duration_ms !== null) {
        return acc + Number(m.duration_ms) / 1000;
      }
      // 3. Fallback: Estimate from total rounds played (~115 seconds per round in competitive)
      const rounds = Number(m.stats?.rounds_played || m.rounds_played || 20);
      return acc + rounds * 115;
    }, 0);

    const hours = (totalSeconds / 3600).toFixed(1);

    return {
      totalMatches,
      hoursCompeted: hours,
    };
  }, [activeDashboardMatches]);

  const isF1Selected = selectedGame === 'F1 25' || selectedGame?.toLowerCase().includes('f1');

  const activeGameTelemetry = useMemo(() => {
    if (isFcSelected && fcMatches) {
      return fcMatches.map((m, idx) => {
        const p = m.metrics_payload || {};
        const scoreVal = parseFloat(m.performance_score || p.performance_score || 75.0);
        return {
          matchIndex: `Match #${idx + 1}`,
          sessionIndex: idx + 1,
          scoreP: scoreVal.toFixed(1),
          score: scoreVal,
          acs: scoreVal,
          division: p.division || 'Elite Division',
          outcome: p.outcome || 'VICTORY',
          scoreDisplay: p.score_display || `${p.goals_scored ?? 0} - ${p.goals_conceded ?? 0}`,
          possession: p.possession || 50,
          passAccuracy: p.pass_accuracy || 80,
          xg: p.xg || '0.0',
          map: `${p.outcome || 'VICTORY'} (${p.score_display || `${p.goals_scored ?? 0} - ${p.goals_conceded ?? 0}`})`
        };
      });
    }
    if (isF1Selected && f1Data?.recentMatches) {
      return f1Data.recentMatches.map((m, idx) => {
        const scoreVal = parseFloat(m.score || m.performance_score || 75.0);
        const lapTimeVal = m.lapTime || m.lap_time_seconds;
        return {
          sessionIndex: idx + 1,
          matchIndex: `Session #${idx + 1}`,
          scoreP: scoreVal.toFixed(1),
          score: scoreVal,
          lapTime: lapTimeVal,
          trackName: m.trackName || m.track_name || 'Red Bull Ring (Austria)',
          topSpeed: m.topSpeed || m.top_speed_kmh,
          totalSessionLaps: m.totalSessionLaps || m.total_session_laps || 1,
          map: m.trackName || m.track_name || 'Red Bull Ring',
          kd: formatLapTime(lapTimeVal),
          acs: scoreVal
        };
      });
    }
    if (!activeDashboardMatches || activeDashboardMatches.length === 0) return [];
    const ascMatches = [...activeDashboardMatches].reverse();

    return ascMatches.map((match, idx) => {
      const ratingVal = match.performance_score || match.calculated_rating || match.rating || 50;
      const mapName = selectedGame === 'Dota 2'
        ? getDotaHeroName(match.metrics_payload?.hero_id)
        : selectedGame === 'League of Legends'
        ? (match.metrics_payload?.champion_name || 'CHAMPION')
        : (match.metrics_payload?.map || match.metrics_payload?.track || match.map || match.track || 'MATCH');
      let kdVal = '1.00';
      const pl = match.metrics_payload || {};
      if (pl.kda !== undefined && pl.kda !== null) {
        kdVal = Number(pl.kda).toFixed(2);
      } else if (pl.kd_ratio !== undefined && pl.kd_ratio !== null) {
        kdVal = Number(pl.kd_ratio).toFixed(2);
      } else if (pl.kd !== undefined && pl.kd !== null) {
        kdVal = Number(pl.kd).toFixed(2);
      } else if (pl.kills !== undefined && pl.deaths !== undefined) {
        const kills = Number(pl.kills || 0);
        const deaths = Math.max(1, Number(pl.deaths || 1));
        const assists = Number(pl.assists || 0);
        kdVal = ((kills + assists) / deaths).toFixed(2);
      } else {
        kdVal = Number(match.kd || match.kd_ratio || 1.0).toFixed(2);
      }

      let rawACS = 0;
      if (match.acs !== undefined && match.acs !== null && !isNaN(match.acs)) {
        rawACS = Number(match.acs);
      } else if (match.metrics_payload?.acs !== undefined && !isNaN(match.metrics_payload.acs)) {
        rawACS = Number(match.metrics_payload.acs);
      } else if (match.stats?.score && match.stats?.rounds_played) {
        rawACS = Math.round(Number(match.stats.score) / Math.max(Number(match.stats.rounds_played), 1));
      } else if (match.metrics_payload?.score && match.metrics_payload?.rounds_played) {
        rawACS = Math.round(Number(match.metrics_payload.score) / Math.max(Number(match.metrics_payload.rounds_played), 1));
      } else if (match.score && match.rounds_played) {
        rawACS = Math.round(Number(match.score) / Math.max(Number(match.rounds_played), 1));
      } else {
        rawACS = Number(ratingVal || 200);
      }

      return {
        matchIndex: `#${idx + 1}`,
        scoreP: Number(ratingVal).toFixed(1),
        acs: rawACS,
        map: mapName,
        kd: kdVal
      };
    });
  }, [activeDashboardMatches, f1Data, isF1Selected, selectedGame]);

  const hasReviews = skillScores.reviewCount > 0;
  const skills = {
    comm: hasReviews ? skillScores.communication : 0,
    team: hasReviews ? skillScores.teamplay : 0,
    mech: hasReviews ? skillScores.mechanical : 0,
    lead: hasReviews ? skillScores.leadership : 0
  };
  const peerReviewsCount = skillScores.reviewCount;

  return (
    <div className="bg-slate-50 dark:bg-[#070b13] min-h-screen text-slate-900 dark:text-slate-100 font-sans space-y-6 pt-28 pb-16 w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16 selection:bg-cyan-500/30">
      {/* High-tech Interactive Backdrop Hero Banner */}
      <div
        onClick={handleNextBanner}
        className="relative w-full min-h-[180px] sm:min-h-[240px] md:min-h-[300px] rounded-3xl overflow-hidden border border-slate-800 bg-[#070b13] shadow-2xl cursor-pointer group mb-8 select-none transition-all"
      >
        {/* Animated Background Banner with Top-Focused Framing */}
        {DASHBOARD_BANNERS.map((banner, index) => {
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
                backgroundPosition: 'center top 15%',
              }}
            />
          );
        })}

        {/* High-Contrast Cyber Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070b13]/95 via-[#070b13]/70 to-transparent pointer-events-none" />

        {/* Overlay Content & Controls */}
        <div className="relative z-10 h-full p-6 md:p-10 flex flex-col justify-between pointer-events-none min-h-[180px] sm:min-h-[240px] md:min-h-[300px]">
          
          {/* Top Header Badge */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 uppercase tracking-widest backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              ATHLETE TELEMETRY & OVERVIEW
            </span>
          </div>

          {/* Main Title & Subtitle block */}
          <div className="mt-auto pt-8">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tight uppercase drop-shadow-lg font-sans">
              Athlete Performance Matrix
            </h2>
            <p className="text-xs md:text-sm text-slate-300 mt-1.5 max-w-xl drop-shadow-md font-mono">
              Real-time verified match telemetry, synchronized competitive standing, and multi-discipline skill calibration.
            </p>
          </div>

          {/* Dynamic 2-Dot Pagination Indicators */}
          <div className="flex items-center gap-1.5 pt-4">
            {DASHBOARD_BANNERS.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === bannerIndex
                    ? 'w-8 bg-cyan-400 shadow-sm shadow-cyan-400/50'
                    : 'w-2 bg-slate-700/80'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* STANDARDIZED ESPORTS TITLE SELECTOR DROPDOWN */}
      <div className="w-full flex items-center justify-between bg-[#0b131d] border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl">
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

          {/* Dropdown Chevron Icon */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* SYNCED ACCOUNT INTEGRATION CARD */}
      <div className="w-full bg-[#0b131d] border border-slate-800/90 rounded-xl p-6 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-black tracking-wide text-white uppercase">
                Synced Account Integration
              </h2>
              <span className="bg-cyan-950/80 border border-cyan-700/60 text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                12 AXIS SIGNAL LINK STABLE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Active tracking profile synced to <span className="text-cyan-400 font-semibold">{selectedGame}</span> telemetry node.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-400">
              BADGE: <span className="text-cyan-400 font-bold">{boundHandle}</span>
            </span>
            <a 
              href="/game-data"
              className="bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black px-4 py-2 rounded-lg uppercase tracking-wider transition shadow-[0_0_12px_rgba(6,182,212,0.3)]"
            >
              Manage Node
            </a>
          </div>
        </div>

        {/* COMPETITIVE STANDING BANNER */}
        {!isF1Selected && (
          loading ? (
            <div className="flex items-center p-4 rounded-xl bg-[#08101a] border border-slate-800/80 mb-4 animate-pulse">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-800/60 border border-slate-700/30 flex items-center justify-center shrink-0">
                  <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    {selectedGame || 'VALORANT'} COMPETITIVE STANDING
                  </div>
                  <div className="h-5 w-32 bg-slate-800 rounded mt-1"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center p-4 rounded-xl bg-[#08101a] border border-slate-800/80 mb-4">
              <div className="flex items-center gap-3.5">
                
                {/* FRAMED BOX WITH BLINKING RANK DOT */}
                <div className={`w-10 h-10 rounded-xl bg-[#070e17] border flex items-center justify-center shrink-0 ${getRankTheme(liveRank).boxBorder}`}>
                  <div className={`w-3 h-3 rounded-full animate-pulse ${getRankTheme(liveRank).dot}`}></div>
                </div>

                {/* DETAILS */}
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    {selectedGame || 'VALORANT'} COMPETITIVE STANDING
                  </div>
                  {(() => {
                    const rankColor = (liveRank || '').startsWith('IMMORTAL')
                      ? 'text-amber-400 font-black'
                      : (liveRank || '').startsWith('DIVINE') || (liveRank || '').startsWith('ANCIENT')
                      ? 'text-purple-450 dark:text-purple-400 font-bold'
                      : (liveRank || '').startsWith('LEGEND') || (liveRank || '').startsWith('ARCHON')
                      ? 'text-cyan-400 font-bold'
                      : 'text-slate-300 font-bold';

                    return (
                      <div className={`text-base sm:text-lg uppercase tracking-wide ${rankColor}`}>
                        {liveRank}
                      </div>
                    );
                  })()}
                </div>

              </div>
            </div>
          )
        )}

        {/* OFFICIAL VALORANT ACT CYCLE BANNER */}
        {String(selectedGame || '').toLowerCase().includes('val') && actInfo?.title && (
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#08101a] border border-cyan-500/20 mb-4 font-mono text-xs shadow-[0_0_15px_rgba(34,211,238,0.05)]">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0"></span>
            <span className="text-slate-400">
              CURRENT ACT CYCLE:{' '}
              <strong className="text-white font-black tracking-wider">
                {actInfo?.title || 'V26 // ACT V'}
              </strong>
            </span>
          </div>
        )}

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">

          {/* 1. TOTAL MATCHES / SESSIONS PLAYED */}
          <div className="p-4 rounded-xl bg-[#08101a] border border-slate-800/80 flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg border bg-cyan-950/40 border-cyan-500/30 text-cyan-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                {isF1Selected ? 'TOTAL SESSIONS' : 'TOTAL MATCHES PLAYED'}
              </div>
              <div className="text-base sm:text-lg font-mono font-black text-white">
                {isF1Selected ? (f1Data?.totalLaps || 0) : dashboardStats.totalMatches}
              </div>
            </div>
          </div>

          {/* 2. LINEAR GROWTH SLOPE */}
          {(() => {
            const totalMatches = isF1Selected ? (f1Data?.totalLaps || 0) : Number(dashboardStats.totalMatches);
            const slopeValue = isF1Selected ? parseFloat(f1Data?.linearGrowthSlope || 0) : dashLCC.slopeNumeric;
            const isCalibrated = totalMatches > 0 && !isNaN(slopeValue);
            const isPositive = slopeValue > 0;
            const formattedSlope = isF1Selected ? (f1Data?.linearGrowthSlope ?? '0.00') : dashLCC.slope;

            return (
              <div
                className={`flex items-center gap-4 rounded-xl border p-4 transition-all duration-200 ${
                  isCalibrated
                    ? 'border-slate-800/80 bg-[#08101a]'
                    : 'border-slate-800/40 bg-[#040810]/50 opacity-60'
                }`}
              >
                {/* Icon */}
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border ${
                    isCalibrated
                      ? isPositive
                        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-950/40 text-rose-400 border-rose-500/30'
                      : 'bg-slate-900/50 text-slate-600 border-slate-800'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>

                {/* Label and Value */}
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                    LINEAR GROWTH SLOPE
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5 font-mono">
                    <span
                      className={`text-base sm:text-lg font-mono font-black ${
                        isCalibrated
                          ? isPositive
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                          : 'text-slate-600'
                      }`}
                    >
                      {isCalibrated ? formattedSlope : '0.00'}
                    </span>
                    {!isCalibrated && (
                      <span className="text-[9px] uppercase tracking-wider text-slate-600 font-bold ml-1.5">
                        (Uncalibrated)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 3. HOURS COMPETED / BEST LAP */}
          <div className="p-4 rounded-xl bg-[#08101a] border border-slate-800/80 flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg border bg-amber-950/40 border-amber-500/30 text-amber-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                {isF1Selected ? 'BEST LAP' : 'HOURS COMPETED'}
              </div>
              <div className="text-base sm:text-lg font-mono font-black text-white">
                {isF1Selected ? (
                  <span className="text-emerald-400">{formatLapTime(f1Data?.bestLap)}</span>
                ) : (
                  <>{dashboardStats.hoursCompeted} <span className="text-xs text-slate-400 font-normal">Hrs</span></>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 2. DASHBOARD TRAJECTORY & RECENT MATCHES SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-6">
        {/* LEFT: PERFORMANCE TRAJECTORY CHART */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-[#070e17] border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                PERFORMANCE TRAJECTORY (LCC)
              </h3>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                {isF1Selected
                  ? 'Progression of Performance Rating across recorded sessions'
                  : isFcSelected
                  ? 'Progression of Match Performance Score across ingested fixtures'
                  : 'Progression of Average Combat Score (ACS) across ingested matches'}
              </p>
            </div>
            <span className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border ${
              isFcSelected 
                ? 'text-amber-400 bg-amber-950/60 border-amber-500/30' 
                : 'text-cyan-400 bg-cyan-950/60 border-cyan-500/30'
            }`}>
              {activeGameTelemetry.length} {isF1Selected ? 'Sessions Logged' : isFcSelected ? 'Fixtures Logged' : 'Matches Logged'}
            </span>
          </div>

          {/* CHART CONTAINER */}
          <div className="h-64 w-full">
            {activeGameTelemetry.length > 0 ? (
              <ResponsiveContainer height="100%" width="100%">
                <LineChart
                  data={activeGameTelemetry}
                  margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                >
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} opacity={0.4} />
                  <XAxis
                    dataKey="matchIndex"
                    fontFamily="monospace"
                    fontSize={10}
                    stroke="#475569"
                    tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={isF1Selected ? [70, 100] : isFcSelected ? [40, 100] : ['dataMin - 20', 'dataMax + 20']}
                    fontFamily="monospace"
                    fontSize={10}
                    stroke="#475569"
                    tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        if (isFcSelected) {
                          return (
                            <div className="p-3 rounded-xl bg-[#04080e] border border-amber-500/40 shadow-xl font-mono">
                              <div className="text-xs font-black text-white mb-1">
                                Match #{data.sessionIndex} • {data.division}
                              </div>
                              <div className="text-xs font-black text-amber-400">
                                Outcome: <span className="text-white">{data.outcome} ({data.scoreDisplay})</span>
                              </div>
                              <div className="text-xs font-black text-emerald-400 mt-0.5">
                                Performance Score: <span className="text-white">{data.scoreP} Pts</span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Possession: {data.possession}% | Pass Acc: {data.passAccuracy}%
                              </div>
                            </div>
                          );
                        }
                        if (isF1Selected) {
                          return (
                            <div className="p-3 rounded-xl bg-[#04080e] border border-cyan-500/40 shadow-xl font-mono">
                              <div className="text-xs font-black text-white mb-1">
                                Session #{data.sessionIndex} • {data.trackName}
                              </div>
                              <div className="text-xs font-black text-emerald-400">
                                Fastest Lap: <span className="text-white">{formatLapTime(data.lapTime)}</span>
                              </div>
                              <div className="text-xs font-black text-cyan-400 mt-0.5">
                                LCC Score: <span className="text-white">{data.score || data.scoreP} Pts</span>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div className="p-3 rounded-xl bg-[#04080e] border border-cyan-500/40 shadow-xl font-mono">
                            <div className="text-xs font-black text-white mb-1">{data.matchIndex} • {data.map}</div>
                            <div className="text-xs font-black text-cyan-400">
                              ACS : <span className="text-white">{data.acs}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              K/D : <span className="text-emerald-400 font-bold">{data.kd}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="acs"
                    stroke={isFcSelected ? '#f59e0b' : '#22d3ee'}
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#08101a', stroke: isFcSelected ? '#f59e0b' : '#22d3ee', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: isFcSelected ? '#f59e0b' : '#22d3ee', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center border border-dashed border-slate-800/80 rounded-xl py-12">
                <span className="text-xs font-mono text-slate-500">
                  No telemetry data ingested for {selectedGame}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: LATEST INGESTED MATCHES / SESSIONS / FIXTURES */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-[#070e17] border border-slate-800/80 flex flex-col">
          <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">
            {isF1Selected ? 'LATEST INGESTED SESSIONS' : isFcSelected ? 'LATEST INGESTED FIXTURES' : 'LATEST INGESTED MATCHES'}
          </h3>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-64">
            {activeGameTelemetry.length > 0 ? (
              activeGameTelemetry.slice(-4).reverse().map((item, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-xl bg-[#0b131f] border border-slate-800/80 hover:border-slate-700 transition`}
                >
                  {isFcSelected ? (
                    <>
                      <div className="flex items-center gap-2.5">
                        <span className="w-1.5 h-6 rounded-full bg-amber-400"></span>
                        <div>
                          <div className="text-xs font-bold text-white uppercase">{item.map}</div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {item.matchIndex} • {item.division}
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-xs font-bold text-slate-200">
                          POSS: <span className="text-amber-400">{item.possession}%</span>
                        </div>
                        <div className="text-[10px] font-bold text-emerald-400">
                          P: {item.scoreP}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2.5">
                        <span className="w-1.5 h-6 rounded-full bg-cyan-400"></span>
                        <div>
                          <div className="text-xs font-bold text-white uppercase">{item.map}</div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {isF1Selected ? `SESSION #${item.sessionIndex}` : `${item.matchIndex} Ingested`}
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        {isF1Selected ? (
                          <>
                            <div className="text-xs font-bold text-slate-200">
                              LAP: <span className="text-emerald-400">{formatLapTime(item.lapTime)}</span>
                            </div>
                            <div className="text-[10px] font-bold text-cyan-400">
                              SCORE: {item.score || item.scoreP}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-xs font-bold text-slate-200">
                              {selectedGame === 'Dota 2' || selectedGame === 'League of Legends' ? 'K/D/A' : 'K/D'}: <span className="text-cyan-400">{item.kd}</span>
                            </div>
                            <div className="text-[10px] font-bold text-cyan-400">P: {item.scoreP}</div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              <div className="text-xs font-mono text-slate-500 text-center py-10">
                No matches found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PROFESSIONAL SKILL MAPPING MATRIX */}
      <div className="w-full space-y-4 pt-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
            <span>~</span> PROFESSIONAL SKILL MAPPING MATRIX
          </div>
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            EVALUATED FROM {peerReviewsCount} PEER REVIEW{peerReviewsCount !== 1 ? 'S' : ''} ({selectedGame || 'VALORANT'})
          </div>
        </div>

        {/* DYNAMIC 4-COLUMN RESPONSIVE GRID (Collapses to 3 if not IGL) */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${skillScores.hasLeadership ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 w-full`}>

          {/* 1. COMMUNICATION SKILLS (Amber) */}
          <div className={`p-4 rounded-xl flex flex-col justify-between transition-all duration-300 ${
            hasReviews
              ? 'bg-[#070e17] border border-amber-500/30 hover:border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.06)]'
              : 'bg-[#060b13]/60 border border-slate-800/50 opacity-40 grayscale select-none'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-black text-white uppercase tracking-wider">COMMUNICATION SKILLS</h4>
                <span className={`text-sm font-mono font-black ${hasReviews ? 'text-amber-400' : 'text-slate-500'}`}>{skills.comm}%</span>
              </div>
              <div className={`text-[10px] font-mono font-bold uppercase mb-2 ${
                hasReviews ? 'text-amber-400' : 'text-slate-500'
              }`}>
                {!hasReviews ? 'UNCALIBRATED' : skills.comm >= 85 ? 'ELITE STATUS' : skills.comm >= 70 ? 'PRO STATUS' : 'DEVELOPING STATUS'}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Relays clean spatial calls, enemy rotation warnings, and strategic audio/visual coordinates.
              </p>
            </div>
            <div className="w-full h-1.5 bg-slate-800/80 rounded-full mt-4 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${hasReviews ? 'bg-amber-400' : 'bg-slate-700'}`} 
                style={{ width: `${skills.comm}%` }}
              ></div>
            </div>
          </div>

          {/* 2. TEAMPLAY & TACTICS (Emerald) */}
          <div className={`p-4 rounded-xl flex flex-col justify-between transition-all duration-300 ${
            hasReviews
              ? 'bg-[#070e17] border border-emerald-500/30 hover:border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.06)]'
              : 'bg-[#060b13]/60 border border-slate-800/50 opacity-40 grayscale select-none'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-black text-white uppercase tracking-wider">TEAMPLAY & TACTICS</h4>
                <span className={`text-sm font-mono font-black ${hasReviews ? 'text-emerald-400' : 'text-slate-500'}`}>{skills.team}%</span>
              </div>
              <div className={`text-[10px] font-mono font-bold uppercase mb-2 ${
                hasReviews ? 'text-emerald-400' : 'text-slate-500'
              }`}>
                {!hasReviews ? 'UNCALIBRATED' : skills.team >= 85 ? 'ELITE STATUS' : skills.team >= 70 ? 'PRO STATUS' : 'DEVELOPING STATUS'}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Executes coordinated site entries, trade fragging, crossfire positioning, and optimal utility timing.
              </p>
            </div>
            <div className="w-full h-1.5 bg-slate-800/80 rounded-full mt-4 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${hasReviews ? 'bg-emerald-400' : 'bg-slate-700'}`} 
                style={{ width: `${skills.team}%` }}
              ></div>
            </div>
          </div>

          {/* 3. MECHANICAL PRECISION (Cyan) */}
          <div className={`p-4 rounded-xl flex flex-col justify-between transition-all duration-300 ${
            hasReviews
              ? 'bg-[#070e17] border border-cyan-500/30 hover:border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.06)]'
              : 'bg-[#060b13]/60 border border-slate-800/50 opacity-40 grayscale select-none'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-black text-white uppercase tracking-wider">MECHANICAL PRECISION</h4>
                <span className={`text-sm font-mono font-black ${hasReviews ? 'text-cyan-400' : 'text-slate-500'}`}>{skills.mech}%</span>
              </div>
              <div className={`text-[10px] font-mono font-bold uppercase mb-2 ${
                hasReviews ? 'text-cyan-400' : 'text-slate-500'
              }`}>
                {!hasReviews ? 'UNCALIBRATED' : skills.mech >= 85 ? 'ELITE STATUS' : skills.mech >= 70 ? 'PRO STATUS' : 'DEVELOPING STATUS'}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Maintains crosshair placement, first-bullet accuracy, recoil reset control, and clutch composure.
              </p>
            </div>
            <div className="w-full h-1.5 bg-slate-800/80 rounded-full mt-4 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${hasReviews ? 'bg-cyan-400' : 'bg-slate-700'}`} 
                style={{ width: `${skills.mech}%` }}
              ></div>
            </div>
          </div>

          {/* 4. STRATEGIC LEADERSHIP & IN-GAME SHOTCALLING (Purple) */}
          {skillScores.hasLeadership && (
            <div className={`p-4 rounded-xl flex flex-col justify-between transition-all duration-300 ${
              hasReviews
                ? 'bg-[#070e17] border border-purple-500/30 hover:border-purple-400/50 shadow-[0_0_15px_rgba(168,85,247,0.08)]'
                : 'bg-[#060b13]/60 border border-slate-800/50 opacity-40 grayscale select-none'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">STRATEGIC LEADERSHIP</h4>
                  <span className={`text-sm font-mono font-black ${hasReviews ? 'text-purple-400' : 'text-slate-500'}`}>{skills.lead}%</span>
                </div>
                <div className={`text-[10px] font-mono font-bold uppercase mb-2 ${
                  hasReviews ? 'text-purple-400' : 'text-slate-500'
                }`}>
                  {!hasReviews ? 'UNCALIBRATED' : skills.lead >= 85 ? 'ELITE STATUS' : skills.lead >= 70 ? 'PRO STATUS' : 'DEVELOPING STATUS'}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Executes decisive in-game shotcalling, mid-round macro adaptation, and team economy management.
                </p>
              </div>
              <div className="w-full h-1.5 bg-slate-800/80 rounded-full mt-4 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${hasReviews ? 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]' : 'bg-slate-700'}`} 
                  style={{ width: `${skills.lead}%` }}
                ></div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default HomeDashboard;
