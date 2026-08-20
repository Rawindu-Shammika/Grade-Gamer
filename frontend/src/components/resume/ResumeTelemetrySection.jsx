import React, { useMemo } from 'react';

export const ResumeTelemetrySection = ({ userProfile = {}, gameStats = {} }) => {
  // Master map of game identifiers to display metadata and internal keys
  const GAME_METADATA = {
    valorant: { label: 'VALORANT', statKey: 'valorant' },
    dota_2: { label: 'DOTA 2', statKey: 'dota2' },
    dota2: { label: 'DOTA 2', statKey: 'dota2' },
    'dota 2': { label: 'DOTA 2', statKey: 'dota2' },
    cs2: { label: 'COUNTER-STRIKE 2', statKey: 'cs2' },
    'counter-strike 2': { label: 'COUNTER-STRIKE 2', statKey: 'cs2' },
    counter_strike_2: { label: 'COUNTER-STRIKE 2', statKey: 'cs2' },
    assetto_corsa: { label: 'ASSETTO CORSA', statKey: 'assettoCorsa' },
    assettocorsa: { label: 'ASSETTO CORSA', statKey: 'assettoCorsa' },
    f1_25: { label: 'F1 25', statKey: 'f1_25' },
    f125: { label: 'F1 25', statKey: 'f1_25' },
  };

  // 1. Resolve registered games list from profile or synced nodes
  const registeredGameKeys = useMemo(() => {
    // Check esports_titles array, or registered_games array, or single primary game, or fallback to stats keys
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
  }, [userProfile, gameStats]);

  // 2. Filter playtime cards strictly for registered games
  const registeredGameCards = useMemo(() => {
    return registeredGameKeys.map((key) => {
      const meta = GAME_METADATA[key] || { label: key.toUpperCase().replace(/_/g, ' '), statKey: key };
      const stat = gameStats[meta.statKey] || gameStats[key] || gameStats[meta.label] || {};
      const hours = Number(stat?.hours || 0);

      return {
        key,
        label: meta.label,
        hours: hours > 0 ? `${hours.toFixed(1)} Hours` : '0.0+ Hours',
      };
    });
  }, [registeredGameKeys, gameStats]);

  // 3. Filter active Linear Growth slopes (non-zero) strictly for registered games
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
          formattedText: isPositive ? `+${formattedNum} Growth` : `${formattedNum} Growth`,
          colorClass: isPositive ? 'text-emerald-550 dark:text-emerald-400' : 'text-rose-550 dark:text-rose-400',
          borderClass: isPositive
            ? 'border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20'
            : 'border-rose-500/30 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-950/20',
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

      {/* Grid of Hours and Active Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Playtime Hours Cards (Only Registered Games) */}
        {registeredGameCards.map((game) => (
          <div
            key={`hours-${game.key}`}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 print-bg-white print-border-slate"
          >
            <span className="text-[9px] font-mono font-bold text-slate-600 dark:text-slate-500 uppercase tracking-wider block mb-1">
              {game.label}
            </span>
            <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-1 block print-text-dark">
              {game.hours}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 block print-text-slate">
              Top 5% Telemetry Analytics
            </span>
          </div>
        ))}

        {/* Dynamic Linear Growth Cards (One per registered game with valid slope) */}
        {activeSlopeCards.length > 0 ? (
          activeSlopeCards.map((slopeCard) => (
            <div
              key={`slope-${slopeCard.key}`}
              className={`p-4 rounded-xl border font-mono print-bg-white print-border-slate shadow-sm ${slopeCard.borderClass}`}
            >
              <span className="text-[9px] font-mono font-bold text-slate-600 dark:text-slate-500 uppercase tracking-wider block mb-1">
                LCC SLOPE COEFFICIENT ({slopeCard.label})
              </span>
              <div className={`text-lg font-black mt-1 block print-text-dark ${slopeCard.colorClass}`}>
                {slopeCard.formattedText}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 block print-text-slate">
                Calibrated via {slopeCard.matches} matches
              </span>
            </div>
          ))
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 print-bg-white print-border-slate">
            <span className="text-[9px] font-mono font-bold text-slate-600 dark:text-slate-500 uppercase tracking-wider block mb-1">
              LCC SLOPE COEFFICIENT
            </span>
            <div className="text-lg font-black text-slate-400 dark:text-slate-600 font-mono mt-1 block print-text-slate">
              Pending
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 block print-text-slate">
              Awaiting calibrated matches
            </span>
          </div>
        )}

      </div>
    </div>
  );
};

export default ResumeTelemetrySection;
