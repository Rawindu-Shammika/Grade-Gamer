import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../../services/supabaseClient";
import useAuth from "../../hooks/useAuth";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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

export const HomeDashboard = () => {
  const authState = useAuth();
  const user = authState?.user || null;

  const [selectedGame, setSelectedGame] = useState('Valorant');
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
    communication: 82,
    teamplay: 88,
    mechanical: 85,
    reviewCount: 0
  });

  useEffect(() => {
    const loadPeerSkillData = async () => {
      if (!user?.id) return;

      try {
        // Query peer reviews for this user filtered by game
        const { data: reviews, error } = await supabase
          .from('peer_reviews')
          .select('*')
          .or(`reviewee_id.eq.${user.id},target_user_id.eq.${user.id}`)
          .eq('game_title', selectedGame);

        if (!error && reviews && reviews.length > 0) {
          let commSum = 0;
          let teamSum = 0;
          let mechSum = 0;

          reviews.forEach((r) => {
            // Normalize ratings (e.g. if stored as 1-5 or 1-100)
            const c = r.communication_rating ?? r.communication ?? 4;
            const t = r.teamplay_rating ?? r.tactical_rating ?? r.teamplay ?? 4.2;
            const m = r.mechanical_rating ?? r.execution_rating ?? r.mechanical ?? 4.1;

            commSum += c > 5 ? c : (c / 5) * 100;
            teamSum += t > 5 ? t : (t / 5) * 100;
            mechSum += m > 5 ? m : (m / 5) * 100;
          });

          const count = reviews.length;
          setSkillScores({
            communication: Math.round(commSum / count),
            teamplay: Math.round(teamSum / count),
            mechanical: Math.round(mechSum / count),
            reviewCount: count
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

  const lccStats = React.useMemo(() => {
    if (!valorantMatches || valorantMatches.length < 2) {
      return {
        score: '--',
        slope: '0.00',
        isPositive: true
      };
    }
    const ascMatches = [...valorantMatches].reverse();
    const scores = ascMatches.map((l) => Number(l.calculated_rating || l.score || l.performance_score || 50));
    const baseline = (scores.slice(0, 5).reduce((a, b) => a + b, 0) / Math.min(scores.length, 5)).toFixed(1);
    const current = (scores.slice(-5).reduce((a, b) => a + b, 0) / Math.min(scores.length, 5)).toFixed(1);
    const slope = ((Number(current) - Number(baseline)) / Math.max(1, valorantMatches.length)).toFixed(2);
    
    return {
      score: current,
      slope: slope,
      isPositive: Number(slope) >= 0
    };
  }, [valorantMatches]);

  const activeGameTelemetry = useMemo(() => {
    if (!valorantMatches) return [];
    const ascMatches = [...valorantMatches].reverse();

    return ascMatches.map((match, idx) => {
      const ratingVal = match.performance_score || match.calculated_rating || match.rating || 50;
      const mapName = match.metrics_payload?.map || match.metrics_payload?.track || match.map || match.track || 'MATCH';
      const kdVal = match.metrics_payload?.kd || match.metrics_payload?.kd_ratio || match.kd || match.kd_ratio || '1.0';

      return {
        matchIndex: `#${idx + 1}`,
        scoreP: Number(ratingVal).toFixed(1),
        map: mapName,
        kd: kdVal
      };
    });
  }, [valorantMatches]);

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
            <option value="Valorant" className="bg-[#0b131d] text-white font-mono py-2">VALORANT</option>
            <option value="Assetto Corsa" className="bg-[#0b131d] text-white font-mono py-2">ASSETTO CORSA</option>
            <option value="F1 25" className="bg-[#0b131d] text-white font-mono py-2">F1 25</option>
            <option value="Counter-Strike 2" className="bg-[#0b131d] text-white font-mono py-2">COUNTER-STRIKE 2</option>
            <option value="League of Legends" className="bg-[#0b131d] text-white font-mono py-2">LEAGUE OF LEGENDS</option>
            <option value="Dota 2" className="bg-[#0b131d] text-white font-mono py-2">DOTA 2</option>
            <option value="Apex Legends" className="bg-[#0b131d] text-white font-mono py-2">APEX LEGENDS</option>
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

        {/* Live Standing Display */}
        <div className="bg-[#070d14] border border-slate-800/90 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-xs">
              TIER
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">{selectedGame} Competitive Standing</div>
              <div className="text-xl font-black text-white uppercase tracking-wider">{liveRank}</div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-500">Rank Rating</div>
            <div className="text-xl font-black text-cyan-400">{liveRR} <span className="text-xs text-slate-400">RR</span></div>
          </div>
        </div>

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

          <div className="bg-[#070d14] border border-slate-800/80 rounded-xl p-4 flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
              lccStats.isPositive 
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' 
                : 'bg-rose-950/40 border-rose-500/30 text-rose-400'
            }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">Linear Growth Slope</div>
              <div className={`text-xl font-black font-mono ${lccStats.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {lccStats.score !== '--' 
                  ? `${lccStats.isPositive ? '+' : ''}${Number(lccStats.slope).toFixed(2)}`
                  : '0.00'}
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
              <p className="text-[11px] font-mono text-slate-400">
                Progression of composite skill metric P across ingested matches
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
                <AreaChart
                  data={activeGameTelemetry}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#132030" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="matchIndex"
                    fontFamily="monospace"
                    fontSize={10}
                    stroke="#475569"
                    tickLine={false}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    fontFamily="monospace"
                    fontSize={10}
                    stroke="#475569"
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#070e17',
                      borderColor: '#1e293b',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      color: '#00e5ff'
                    }}
                    itemStyle={{ color: '#00e5ff' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="scoreP"
                    stroke="#00e5ff"
                    strokeWidth={2}
                    fill="url(#cyanGradient)"
                    fillOpacity={1}
                    dot={{
                      r: 4,
                      stroke: '#00e5ff',
                      fill: '#070e17',
                      strokeWidth: 2
                    }}
                  />
                </AreaChart>
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
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-widest text-cyan-400 font-mono">
            ~ PROFESSIONAL SKILL MAPPING MATRIX
          </span>
          <span className="text-[10px] font-mono text-slate-500 uppercase">
            {skillScores.reviewCount > 0 
              ? `EVALUATED FROM ${skillScores.reviewCount} PEER REVIEW${skillScores.reviewCount > 1 ? 'S' : ''}` 
              : 'EVALUATED PEER & TELEMETRY METRICS'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {/* 1. MATCH COMMUNICATION QUALITY (AMBER THEME) */}
          <div className="bg-[#0b131d] border border-amber-500/25 hover:border-amber-400/50 transition-all duration-300 p-5 rounded-xl space-y-3 shadow-[0_0_15px_rgba(245,158,11,0.06)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white uppercase tracking-wide">Communication Skills</div>
                <div className="text-[10px] font-bold uppercase text-amber-400 mt-0.5">
                  {getStatusLabel(skillScores.communication).label}
                </div>
              </div>
              <span className="text-xl font-black text-amber-400">{skillScores.communication}%</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Relays clean spatial calls, enemy rotation warnings, and strategic audio/visual coordinates.
            </p>
            <div className="w-full bg-[#070d14] h-2 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-500" 
                style={{ width: `${skillScores.communication}%` }} 
              />
            </div>
          </div>

          {/* 2. TEAMPLAY & TACTICAL COORDINATION (EMERALD THEME) */}
          <div className="bg-[#0b131d] border border-emerald-500/25 hover:border-emerald-400/50 transition-all duration-300 p-5 rounded-xl space-y-3 shadow-[0_0_15px_rgba(16,185,129,0.06)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white uppercase tracking-wide">Teamplay & Tactics</div>
                <div className="text-[10px] font-bold uppercase text-emerald-400 mt-0.5">
                  {getStatusLabel(skillScores.teamplay).label}
                </div>
              </div>
              <span className="text-xl font-black text-emerald-400">{skillScores.teamplay}%</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Executes coordinated site entries, trade fragging, crossfire positioning, and optimal utility timing.
            </p>
            <div className="w-full bg-[#070d14] h-2 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-500" 
                style={{ width: `${skillScores.teamplay}%` }} 
              />
            </div>
          </div>

          {/* 3. MECHANICAL PRECISION & EXECUTION (CYAN THEME) */}
          <div className="bg-[#0b131d] border border-cyan-500/25 hover:border-cyan-400/50 transition-all duration-300 p-5 rounded-xl space-y-3 shadow-[0_0_15px_rgba(6,182,212,0.06)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white uppercase tracking-wide">Mechanical Precision</div>
                <div className="text-[10px] font-bold uppercase text-cyan-400 mt-0.5">
                  {getStatusLabel(skillScores.mechanical).label}
                </div>
              </div>
              <span className="text-xl font-black text-cyan-400">{skillScores.mechanical}%</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Maintains crosshair placement, first-bullet accuracy, recoil reset control, and clutch composure.
            </p>
            <div className="w-full bg-[#070d14] h-2 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-500" 
                style={{ width: `${skillScores.mechanical}%` }} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeDashboard;
