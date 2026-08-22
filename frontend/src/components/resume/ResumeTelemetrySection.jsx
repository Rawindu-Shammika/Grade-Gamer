import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';

// Universal OpenDota Rank Resolver
const extractDotaRank = (profile, matches) => {
  // 1. Direct profile column
  if (profile?.dota2_rank && profile.dota2_rank !== 'UNRATED' && profile.dota2_rank !== 'CALIBRATED' && profile.dota2_rank !== 'ACTIVE PROTOCOL') {
    return profile.dota2_rank;
  }
  if (profile?.dota_rank && profile.dota_rank !== 'UNRATED' && profile.dota_rank !== 'CALIBRATED') {
    return profile.dota_rank;
  }

  // 2. Check Match Telemetry Payloads (deep inspection)
  const p = matches?.[0]?.metrics_payload;
  if (p) {
    // Explicit string already formatted
    if (p.rank && p.rank !== 'CALIBRATED' && p.rank !== 'UNRATED') return p.rank;
    if (p.competitive_rank && p.competitive_rank !== 'CALIBRATED' && p.competitive_rank !== 'UNRATED') return p.competitive_rank;
    if (p.standing && p.standing !== 'CALIBRATED' && p.standing !== 'UNRATED') return p.standing;

    // Leaderboard Rank (IMMORTAL #16)
    const lbRank = p.leaderboard_rank || p.profile?.leaderboard_rank || p.player_profile?.leaderboard_rank || p.player_data?.leaderboard_rank;
    if (lbRank) {
      return `IMMORTAL #${lbRank}`;
    }

    // Tier Decoder (e.g. 80 -> IMMORTAL, 72 -> DIVINE II)
    const tier = p.rank_tier || p.profile?.rank_tier || p.player_profile?.rank_tier || p.player_data?.rank_tier;
    if (tier) {
      const tierNum = parseInt(tier, 10);
      if (tierNum >= 80) {
        return lbRank ? `IMMORTAL #${lbRank}` : 'IMMORTAL';
      }
      if (tierNum > 0) {
        const tiers = ['', 'HERALD', 'GUARDIAN', 'CRUSADER', 'ARCHON', 'LEGEND', 'ANCIENT', 'DIVINE'];
        const leader = tiers[Math.floor(tierNum / 10)] || 'RANK';
        const star = ['', 'I', 'II', 'III', 'IV', 'V'][tierNum % 10] || '';
        return `${leader} ${star}`.trim();
      }
    }
  }

  return 'UNRATED';
};

export const ResumeTelemetrySection = ({ userProfile = {}, gameStats = {} }) => {
  // Master map of game identifiers to display metadata and internal keys
  const GAME_METADATA = {
    valorant: { label: 'VALORANT', statKey: 'valorant', shortLabel: 'VALORANT' },
    dota_2: { label: 'DOTA 2', statKey: 'dota2', shortLabel: 'DOTA 2' },
    dota2: { label: 'DOTA 2', statKey: 'dota2', shortLabel: 'DOTA 2' },
    'dota 2': { label: 'DOTA 2', statKey: 'dota2', shortLabel: 'DOTA 2' },
    league_of_legends: { label: 'LEAGUE OF LEGENDS', statKey: 'league_of_legends', shortLabel: 'LEAGUE' },
    'league of legends': { label: 'LEAGUE OF LEGENDS', statKey: 'league_of_legends', shortLabel: 'LEAGUE' },
    lol: { label: 'LEAGUE OF LEGENDS', statKey: 'league_of_legends', shortLabel: 'LEAGUE' },
    cs2: { label: 'COUNTER-STRIKE 2', statKey: 'cs2', shortLabel: 'CS2' },
    'counter-strike 2': { label: 'COUNTER-STRIKE 2', statKey: 'cs2', shortLabel: 'CS2' },
    counter_strike_2: { label: 'COUNTER-STRIKE 2', statKey: 'cs2', shortLabel: 'CS2' },
    assetto_corsa: { label: 'ASSETTO CORSA', statKey: 'assettoCorsa', shortLabel: 'ASSETTO' },
    assettocorsa: { label: 'ASSETTO CORSA', statKey: 'assettoCorsa', shortLabel: 'ASSETTO' },
    f1_25: { label: 'F1 25', statKey: 'f1_25', shortLabel: 'F1 25' },
    f125: { label: 'F1 25', statKey: 'f1_25', shortLabel: 'F1 25' },
  };

  const [activeTitles, setActiveTitles] = useState(() => (
    userProfile?.esports_titles?.length 
      ? userProfile.esports_titles 
      : (userProfile?.active_titles?.length ? userProfile.active_titles : [])
  ));

  useEffect(() => {
    if (userProfile?.esports_titles?.length) {
      setActiveTitles(userProfile.esports_titles);
    } else if (userProfile?.active_titles?.length) {
      setActiveTitles(userProfile.active_titles);
    }
  }, [userProfile]);

  useEffect(() => {
    const handleTitlesSync = (e) => {
      const updated = e.detail?.activeTitles || e.detail?.esports_titles;
      if (updated && Array.isArray(updated) && updated.length > 0) {
        setActiveTitles(updated);
      }
    };

    window.addEventListener('gg_titles_updated', handleTitlesSync);
    return () => window.removeEventListener('gg_titles_updated', handleTitlesSync);
  }, []);

  const [valorantMatches, setValorantMatches] = useState([]);
  const [dotaMatches, setDotaMatches] = useState([]);
  const [lolMatches, setLolMatches] = useState([]);
  const [cs2Matches, setCs2Matches] = useState([]);

  // Fetch direct game telemetry rows on mount for accurate live ranks
  useEffect(() => {
    const targetUserId = userProfile?.id;
    if (!targetUserId) return;

    const fetchLatestMatchData = async () => {
      try {
        const [valRes, dotaRes, lolRes, cs2Res] = await Promise.all([
          supabase
            .from('valorant_match_telemetry')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('dota2_match_telemetry')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('lol_match_telemetry')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('cs2_match_telemetry')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false })
            .limit(5)
        ]);

        if (valRes.data) setValorantMatches(valRes.data);
        if (dotaRes.data) setDotaMatches(dotaRes.data);
        if (lolRes.data) setLolMatches(lolRes.data);
        if (cs2Res.data) setCs2Matches(cs2Res.data);
      } catch (e) {
        console.warn('Could not fetch auxiliary telemetry rows:', e.message);
      }
    };

    fetchLatestMatchData();
  }, [userProfile?.id]);

  // Universal Rank & Identity Parser for all titles
  const metrics = useMemo(() => {
    // --- 1. VALORANT ---
    const valPayload = valorantMatches?.[0]?.metrics_payload;
    const valId = 
      userProfile?.valorant_id || 
      (valPayload?.name && valPayload?.tag ? `${valPayload.name}#${valPayload.tag}` : null) || 
      (userProfile?.valorant_ign && userProfile?.valorant_tag ? `${userProfile.valorant_ign}#${userProfile.valorant_tag}` : null) ||
      valPayload?.player_name || 
      'UNLINKED';
    const valRank = 
      (userProfile?.valorant_rank && userProfile.valorant_rank !== 'UNRATED' && userProfile.valorant_rank !== 'ACTIVE PROTOCOL')
        ? userProfile.valorant_rank
        : (valPayload?.currenttierpatched || valPayload?.tier_name || valPayload?.rank || (valorantMatches?.length > 0 ? 'CALIBRATED' : 'UNRATED'));

    // --- 2. DOTA 2 (Universal OpenDota & Profile Resolver) ---
    const dotaPayload = dotaMatches?.[0]?.metrics_payload;
    const dotaId = userProfile?.dota2_steam_id || userProfile?.steam_id || (dotaPayload?.account_id ? `${dotaPayload.account_id}` : 'UNLINKED');
    const dotaRank = extractDotaRank(userProfile, dotaMatches);

    // --- 3. LEAGUE OF LEGENDS ---
    const lolPayload = lolMatches?.[0]?.metrics_payload;
    const lolId = userProfile?.lol_riot_id || (lolPayload?.game_name && lolPayload?.tag_line ? `${lolPayload.game_name}#${lolPayload.tag_line}` : 'UNLINKED');
    const lolRank = 
      (userProfile?.lol_rank && userProfile.lol_rank !== 'UNRATED' && userProfile.lol_rank !== 'ACTIVE PROTOCOL')
        ? userProfile.lol_rank
        : (lolPayload?.tier 
            ? `${lolPayload.tier} ${lolPayload.rank || ''} ${lolPayload.leaguePoints ? `(${lolPayload.leaguePoints} LP)` : ''}`.trim() 
            : (lolMatches?.length > 0 || Number(gameStats?.league_of_legends?.matches || 0) > 0 ? 'CALIBRATED' : 'UNRATED'));

    // --- 4. COUNTER-STRIKE 2 ---
    const cs2Payload = cs2Matches?.[0]?.metrics_payload;
    const cs2Id = userProfile?.cs2_steam_id ? `STEAM: ${userProfile.cs2_steam_id}` : (cs2Matches?.length > 0 || Number(gameStats?.cs2?.matches || 0) > 0 ? 'MANUAL VERIFIED' : 'STANDBY');
    const cs2Rank = userProfile?.cs2_rank || cs2Payload?.rank || cs2Payload?.competitive_rank || (cs2Matches?.length > 0 || Number(gameStats?.cs2?.matches || 0) > 0 ? 'CALIBRATED MANUAL' : 'UNRATED');

    return {
      val: { id: valId, rank: valRank },
      dota: { id: dotaId, rank: dotaRank },
      lol: { id: lolId, rank: lolRank },
      cs2: { id: cs2Id, rank: cs2Rank }
    };
  }, [userProfile, valorantMatches, dotaMatches, lolMatches, cs2Matches, gameStats]);

  const getGameCardDetails = (key) => {
    const k = (key || '').toLowerCase().trim();
    if (k.includes('val')) {
      return {
        idLabel: 'ID',
        idValue: metrics.val.id,
        rank: metrics.val.rank,
        shortLabel: 'VALORANT',
        theme: {
          border: 'border-rose-500/20 hover:border-rose-500/40',
          headerText: 'text-rose-400',
          badge: 'text-rose-300 bg-rose-950/70 border border-rose-500/30',
          footerText: 'text-rose-300',
          footerBorder: 'border-rose-500/10'
        }
      };
    }
    if (k.includes('dota')) {
      return {
        idLabel: 'STEAM',
        idValue: String(metrics.dota.id).replace('STEAM: ', ''),
        rank: metrics.dota.rank,
        shortLabel: 'DOTA 2',
        theme: {
          border: 'border-amber-500/20 hover:border-amber-500/40',
          headerText: 'text-amber-400',
          badge: 'text-amber-300 bg-amber-950/70 border border-amber-500/30',
          footerText: 'text-amber-300',
          footerBorder: 'border-amber-500/10'
        }
      };
    }
    if (k.includes('lol') || k.includes('league')) {
      return {
        idLabel: 'RIOT',
        idValue: metrics.lol.id,
        rank: metrics.lol.rank,
        shortLabel: 'LEAGUE',
        theme: {
          border: 'border-cyan-500/20 hover:border-cyan-500/40',
          headerText: 'text-cyan-400',
          badge: 'text-cyan-300 bg-cyan-950/70 border border-cyan-500/30',
          footerText: 'text-cyan-300',
          footerBorder: 'border-cyan-500/10'
        }
      };
    }
    if (k.includes('cs') || k.includes('counter')) {
      return {
        idLabel: 'ENTRY',
        idValue: metrics.cs2.id,
        rank: metrics.cs2.rank,
        shortLabel: 'CS2',
        theme: {
          border: 'border-amber-500/20 hover:border-amber-500/40',
          headerText: 'text-amber-400',
          badge: 'text-amber-300 bg-amber-950/70 border border-amber-500/30',
          footerText: 'text-amber-300',
          footerBorder: 'border-amber-500/10'
        }
      };
    }
    return {
      idLabel: 'STATUS',
      idValue: 'VERIFIED NODE',
      rank: 'CALIBRATED',
      shortLabel: key.toUpperCase().replace(/_/g, ' '),
      theme: {
        border: 'border-purple-500/20 hover:border-purple-500/40',
        headerText: 'text-purple-400',
        badge: 'text-purple-300 bg-purple-950/70 border border-purple-500/30',
        footerText: 'text-purple-300',
        footerBorder: 'border-purple-500/10'
      }
    };
  };

  // 2. Resolve registered games list from profile or synced nodes
  const registeredGameKeys = useMemo(() => {
    if (Array.isArray(activeTitles) && activeTitles.length > 0) {
      return activeTitles.map((g) => g.toLowerCase().trim().replace(/[\s-]/g, '_'));
    }
    if (Array.isArray(userProfile?.esports_titles) && userProfile.esports_titles.length > 0) {
      return userProfile.esports_titles.map((g) => g.toLowerCase().trim().replace(/[\s-]/g, '_'));
    }
    if (Array.isArray(userProfile?.registered_games) && userProfile.registered_games.length > 0) {
      return userProfile.registered_games.map((g) => g.toLowerCase().trim().replace(/[\s-]/g, '_'));
    }
    if (userProfile?.primary_game) {
      return [userProfile.primary_game.toLowerCase().trim().replace(/[\s-]/g, '_')];
    }
    // Fallback: only include games that have active telemetry recorded in gameStats
    return Object.keys(gameStats).filter((key) => {
      const g = gameStats[key];
      return (Number(g?.hours || 0) > 0 || Number(g?.matches || 0) > 0);
    });
  }, [activeTitles, userProfile, gameStats]);

  // 3. Filter playtime cards strictly for registered games
  const registeredGameCards = useMemo(() => {
    return registeredGameKeys.map((key) => {
      const meta = GAME_METADATA[key] || { label: key.toUpperCase().replace(/_/g, ' '), statKey: key, shortLabel: key.toUpperCase() };
      const stat = gameStats[meta.statKey] || gameStats[key] || gameStats[meta.label] || {};
      const hours = Number(stat?.hours || 0);
      const cardDetails = getGameCardDetails(key);

      return {
        key,
        label: meta.label,
        hoursFormatted: hours > 0 ? hours.toFixed(1) : '0.0',
        ...cardDetails
      };
    });
  }, [registeredGameKeys, gameStats, metrics]);

  // 4. Filter active Linear Growth slopes (non-zero) strictly for registered games
  const activeSlopeCards = useMemo(() => {
    const validSlopes = [];

    registeredGameKeys.forEach((key) => {
      const meta = GAME_METADATA[key] || { label: key.toUpperCase().replace(/_/g, ' '), statKey: key };
      const stat = gameStats[meta.statKey] || gameStats[key] || gameStats[meta.label] || {};
      const slope = typeof stat?.slope === 'number' ? stat.slope : parseFloat(stat?.slope || 0);
      const matches = Number(stat?.matches || 0);

      if (!isNaN(slope) && slope !== 0) {
        const isPositive = slope > 0;
        const formattedNum = slope.toFixed(2);
        validSlopes.push({
          key,
          label: meta.label,
          matches,
          formattedText: isPositive ? `+${formattedNum}` : `${formattedNum}`,
          colorClass: isPositive ? 'text-emerald-400' : 'text-rose-400',
          borderClass: isPositive
            ? 'border-emerald-500/20 bg-[#0b1320]'
            : 'border-rose-500/20 bg-[#0b1320]',
        });
      }
    });

    return validSlopes;
  }, [registeredGameKeys, gameStats]);

  return (
    <div className="space-y-3 print-avoid-break">
      <h2 className="text-xs font-black uppercase tracking-widest text-cyan-600 dark:text-[#00b4d8] font-mono print-text-dark">
        Esports Competitive Telemetry & Performance Metrics
      </h2>

      {/* Standardized 5-Column Grid with Compact Proportions */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        
        {/* Playtime Hours Cards with Embedded ID & Live Rank Badge */}
        {registeredGameCards.map((game) => (
          <div
            key={`hours-${game.key}`}
            className={`bg-[#0b1320] border ${game.theme.border} rounded-lg p-3.5 flex flex-col justify-between transition-all`}
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className={`text-[10px] font-mono font-bold ${game.theme.headerText} uppercase tracking-wider`}>
                  {game.shortLabel || game.label}
                </span>
                <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded truncate max-w-[110px] ${game.theme.badge}`}>
                  {game.rank}
                </span>
              </div>
              <h4 className="text-lg font-black text-white leading-tight">
                {game.hoursFormatted} <span className="text-xs font-normal text-slate-400">Hrs</span>
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Top 5% Telemetry</p>
            </div>

            <div className={`mt-2.5 pt-2 border-t ${game.theme.footerBorder} flex items-center justify-between text-[11px] font-mono`}>
              <span className="text-slate-600 text-[9px]">{game.idLabel}</span>
              <span className={`font-bold ${game.theme.footerText} truncate max-w-[110px]`}>
                {game.idValue}
              </span>
            </div>
          </div>
        ))}

        {/* Dynamic Linear Growth Cards (One per registered game with valid slope) */}
        {activeSlopeCards.length > 0 ? (
          activeSlopeCards.map((slopeCard) => (
            <div
              key={`slope-${slopeCard.key}`}
              className={`bg-[#0b1320] border ${slopeCard.borderClass} rounded-lg p-3.5 flex flex-col justify-between font-mono`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider truncate max-w-[80px]">
                    LCC {slopeCard.label}
                  </span>
                  <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 rounded">
                    ACTIVE
                  </span>
                </div>
                <h4 className={`text-lg font-black leading-tight ${slopeCard.colorClass}`}>
                  {slopeCard.formattedText} <span className="text-xs font-normal text-slate-400">Growth</span>
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">{slopeCard.matches} Calibrated</p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-600 text-[9px]">STATUS</span>
                <span className="font-bold text-emerald-400">LIVE FEED</span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 md:col-span-1 bg-[#0b1320] border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  LCC SLOPE
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold text-slate-400 bg-slate-900 border border-slate-700 rounded">
                  CALIBRATING
                </span>
              </div>
              <h4 className="text-lg font-black text-slate-200 leading-tight">Pending</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Linear proof active</p>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-600 text-[9px]">STATUS</span>
              <span className="font-bold text-slate-400">LIVE FEED</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ResumeTelemetrySection;
