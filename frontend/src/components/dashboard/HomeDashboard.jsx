import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import useAuth from "../../hooks/useAuth";

const SUPPORTED_GAMES = [
  { id: 'Valorant', name: 'VALORANT' },
  { id: 'Assetto Corsa', name: 'ASSETTO CORSA' },
  { id: 'F1 25', name: 'F1 25' },
  { id: 'Counter-Strike 2', name: 'COUNTER-STRIKE 2' },
  { id: 'League of Legends', name: 'LEAGUE OF LEGENDS' },
  { id: 'Dota 2', name: 'DOTA 2' },
];

export const HomeDashboard = () => {
  const authState = useAuth();
  const user = authState?.user || null;

  const [selectedGame, setSelectedGame] = useState('Valorant');
  const [valorantMatches, setValorantMatches] = useState([]);
  const [boundHandle, setBoundHandle] = useState('UNLINKED');
  const [loading, setLoading] = useState(true);

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

        // Fetch matches from telemetry table
        const { data: matches, error } = await supabase
          .from('valorant_match_telemetry')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (isMounted) {
          if (!error && matches) {
            setValorantMatches(matches);
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

  return (
    <div className="min-h-screen bg-[#070b10] text-slate-100 p-6 space-y-6 max-w-7xl mx-auto">
      {/* GAME TABS */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {SUPPORTED_GAMES.map((game) => {
          const isSelected = selectedGame === game.id;
          return (
            <button
              key={game.id}
              onClick={() => setSelectedGame(game.id)}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition ${
                isSelected
                  ? 'bg-cyan-500 text-black font-extrabold shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-[#0e1622] text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              {game.name}
            </button>
          );
        })}
      </div>

      {/* SYNCED ACCOUNT INTEGRATION CARD */}
      <div className="bg-[#0b131d] border border-slate-800/90 rounded-xl p-6 shadow-xl space-y-6">
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
            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400 font-black">
              🛡
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Active Clan or Team Tag</div>
              <div className="text-sm font-black text-white">SLIIT ESPORTS</div>
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

      {/* PROFESSIONAL SKILL MAPPING MATRIX */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <span>∿</span> Professional Skill Mapping Matrix
          </h3>
          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
            {skillScores.reviewCount > 0 
              ? `Evaluated from ${skillScores.reviewCount} Peer Review${skillScores.reviewCount > 1 ? 's' : ''}` 
              : 'Evaluated Peer & Telemetry Metrics'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
