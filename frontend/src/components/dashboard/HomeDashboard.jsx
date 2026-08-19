import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../../services/supabaseClient";
import useAuth from "../../hooks/useAuth";
import { calculateLCCMetrics } from '../../utils/lccCalculator';
import { fetchCurrentValorantAct } from '../../utils/valorantActService';
import { filterMatchesByOfficialAct } from '../../utils/actFilter';
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

const SUPABASE_UI_BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/UI`;

// Only using the 2 requested images
const DASHBOARD_BANNERS = [
  'PUBG i.jpg',
  'APEX iv.jpg',
];

// 1. Color Helper for Text, Box Accent, and Dot Glow
const getRankTheme = (tierName) => {
  const rank = String(tierName || '').toUpperCase();

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

export const HomeDashboard = () => {
  const { user, profile } = useAuth();
  const registeredTitles = profile?.esports_titles?.length ? profile.esports_titles : ['Valorant'];

  const [selectedGame, setSelectedGame] = useState('Valorant');
  const [actInfo, setActInfo] = useState(null);

  useEffect(() => {
    if (String(selectedGame || '').toLowerCase().includes('val')) {
      fetchCurrentValorantAct().then((data) => setActInfo(data));
    }
  }, [selectedGame]);

  useEffect(() => {
    if (registeredTitles.length > 0 && !registeredTitles.includes(selectedGame)) {
      setSelectedGame(registeredTitles[0]);
    }
  }, [registeredTitles, selectedGame]);
  const [valorantMatches, setValorantMatches] = useState([]);
  const [boundHandle, setBoundHandle] = useState('UNLINKED');
  const [loading, setLoading] = useState(true);

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
  const [skillScores, setSkillScores] = useState({
    communication: 0,
    teamplay: 0,
    mechanical: 0,
    leadership: 0,
    reviewCount: 0,
    hasLeadership: false
  });

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

        if (!error && reviews && reviews.length > 0) {
          let commSum = 0;
          let teamSum = 0;
          let mechSum = 0;
          let leadSum = 0;
          let leadCount = 0;

          reviews.forEach((r) => {
            // Normalize ratings (e.g. if stored as 1-5 or 1-100)
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

          const count = reviews.length;
          setSkillScores({
            communication: Math.round(commSum / count),
            teamplay: Math.round(teamSum / count),
            mechanical: Math.round(mechSum / count),
            leadership: leadCount > 0 ? Math.round(leadSum / leadCount) : 0,
            reviewCount: count,
            hasLeadership: isIGLForGame && leadCount > 0
          });
        } else {
          setSkillScores({
            communication: 0,
            teamplay: 0,
            mechanical: 0,
            leadership: 0,
            reviewCount: 0,
            hasLeadership: false
          });
        }
      } catch (err) {
        console.error("Error loading peer skill reviews:", err);
      }
    };

    loadPeerSkillData();
  }, [user, selectedGame]);

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
        const { data: profile } = await supabase
          .from('profiles')
          .select('valorant_ign, valorant_tag')
          .eq('id', user.id)
          .maybeSingle();

        if (isMounted && profile?.valorant_ign) {
          setBoundHandle(`${profile.valorant_ign}#${profile.valorant_tag || ''}`);
        }

        // Fetch matches from telemetry table dynamically
        const tableName = selectedGame === 'Valorant' ? 'valorant_match_telemetry' : 'game_match_telemetry';
        let query = supabase
          .from(tableName)
          .select('*')
          .eq('user_id', user.id);
          
        if (selectedGame !== 'Valorant') {
          query = query.eq('game_title', selectedGame);
        }

        const { data: matches, error } = await query.order(
          selectedGame === 'Valorant' ? 'created_at' : 'match_date', 
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

  const liveRank = payload?.rank || payload?.rank_tier || (totalMatchesCount > 0 ? 'Diamond 3' : 'Unrated');
  const liveRR = payload?.elo ?? payload?.rank_rating ?? 0;

  const activeDashboardMatches = useMemo(() => {
    return filterMatchesByOfficialAct(valorantMatches || [], selectedGame, actInfo);
  }, [valorantMatches, selectedGame, actInfo]);

  const dashLCC = React.useMemo(() => calculateLCCMetrics([...(activeDashboardMatches || [])].reverse()), [activeDashboardMatches]);

  const activeGameTelemetry = useMemo(() => {
    if (!activeDashboardMatches || activeDashboardMatches.length === 0) return [];
    const ascMatches = [...activeDashboardMatches].reverse();

    return ascMatches.map((match, idx) => {
      const ratingVal = match.performance_score || match.calculated_rating || match.rating || 50;
      const mapName = match.metrics_payload?.map || match.metrics_payload?.track || match.map || match.track || 'MATCH';
      const kdVal = match.metrics_payload?.kd || match.metrics_payload?.kd_ratio || match.kd || match.kd_ratio || '1.0';

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
  }, [activeDashboardMatches]);

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
        className="relative w-full min-h-[320px] md:min-h-[400px] rounded-3xl overflow-hidden border border-slate-800 bg-[#070b13] shadow-2xl cursor-pointer group mb-8 select-none transition-all"
      >
        {/* Animated Background Banner with Top-Focused Framing */}
        {DASHBOARD_BANNERS.map((banner, index) => (
          <div
            key={banner}
            className={`w-full h-full object-cover absolute inset-0 transition-all duration-1000 ease-in-out pointer-events-none transform group-hover:scale-102 ${
              index === bannerIndex ? 'opacity-80 scale-100' : 'opacity-0 scale-105'
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

        {/* Overlay Content & Controls */}
        <div className="relative z-10 h-full p-6 md:p-10 flex flex-col justify-between pointer-events-none min-h-[320px] md:min-h-[400px]">
          
          {/* Top Header Badge */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 uppercase tracking-widest backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              ATHLETE TELEMETRY & OVERVIEW
            </span>
          </div>

          {/* Main Title & Subtitle block */}
          <div className="mt-auto pt-8">
            <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-wide uppercase drop-shadow-lg font-sans">
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
            {registeredTitles.map((title) => (
              <option key={title} value={title} className="bg-[#0b131d] text-white font-mono py-2">
                {title.toUpperCase()}
              </option>
            ))}
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
              <div className={`text-base sm:text-lg font-black uppercase tracking-wide ${getRankTheme(liveRank).text}`}>
                {liveRank || 'IMMORTAL 1'}
              </div>
            </div>

          </div>
        </div>

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#070d14] border border-slate-800/80 rounded-xl p-4 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400 font-black">
              ▶
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Total Matches Played</div>
              <div className="text-xl font-black text-white">{totalMatchesCount}</div>
            </div>
          </div>

          {/* TOP METRIC CARD: LINEAR GROWTH SLOPE */}
          <div className="p-4 rounded-xl bg-[#08101a] border border-slate-800/80 flex items-center gap-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg border ${
              dashLCC.slopeNumeric >= 0
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-950/40 border-rose-500/30 text-rose-400'
            }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                LINEAR GROWTH SLOPE
              </div>
              <div className={`text-base sm:text-lg font-mono font-black ${
                dashLCC.slopeNumeric >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {dashLCC.slope}
              </div>
            </div>
          </div>

          <div className="bg-[#070d14] border border-slate-800/80 rounded-xl p-4 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-amber-400 font-black">
              ⏱
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Hours Competed</div>
              <div className="text-xl font-black text-white">
                {totalMatchesCount > 0 ? (totalMatchesCount * 0.65).toFixed(1) : '0.0'} <span className="text-xs text-slate-400">Hrs</span>
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
                Progression of Average Combat Score (ACS) across ingested matches
              </p>
            </div>
            <span className="px-2.5 py-1 text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 rounded-lg">
              {activeGameTelemetry.length} Matches Logged
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
                    domain={['dataMin - 20', 'dataMax + 20']}
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
                    stroke="#22d3ee"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#08101a', stroke: '#22d3ee', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#22d3ee', stroke: '#ffffff', strokeWidth: 2 }}
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

        {/* RIGHT: LATEST INGESTED MATCHES */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-[#070e17] border border-slate-800/80 flex flex-col">
          <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">
            LATEST INGESTED MATCHES
          </h3>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-64">
            {activeGameTelemetry.length > 0 ? (
              activeGameTelemetry.slice(-4).reverse().map((item, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#0b131f] border border-slate-800/80 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-1.5 h-6 rounded-full bg-cyan-400"></span>
                    <div>
                      <div className="text-xs font-bold text-white uppercase">{item.map}</div>
                      <div className="text-[10px] font-mono text-slate-400">{item.matchIndex} Ingested</div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-slate-200">K/D: {item.kd}</div>
                    <div className="text-[10px] font-bold text-cyan-400">P: {item.scoreP}</div>
                  </div>
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
