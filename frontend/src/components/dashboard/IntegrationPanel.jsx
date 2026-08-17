import React, { useState, useEffect } from 'react';
import { ShieldCheck, Play, Clock, Link2 } from 'lucide-react';
import { GAME_RANK_CONFIGS } from '../../config/gameRanks';
import useAuth from '../../hooks/useAuth';
import { supabase } from '../../services/supabaseClient';

/**
 * IntegrationPanel Component
 * 
 * - Shows telemetry parameters and selector grid of rank pills.
 * - Handles interactive rank selection to trigger updates in Supabase.
 * - Displays 3 telemetry summary blocks at the bottom with slate vectors.
 */
export const IntegrationPanel = ({ 
  activeSelectedGame, 
  playerProfile, 
  matchesCount, 
  onUpdateRank 
}) => {
  const { user } = useAuth();
  
  const activeGameKey = activeSelectedGame || 'Valorant';
  const currentConfig = GAME_RANK_CONFIGS[activeGameKey] || GAME_RANK_CONFIGS['Valorant'];
  const initialRankName = playerProfile?.rankTiers?.[activeGameKey] || currentConfig.ranks[0].name;

  const [currentRankName, setCurrentRankName] = useState(initialRankName);
  const [currentElo, setCurrentElo] = useState(null); // Initialize elo

  useEffect(() => {
    // Sync local state when profile changes
    if (playerProfile?.rankTiers?.[activeGameKey]) {
      setCurrentRankName(playerProfile.rankTiers[activeGameKey]);
    } else {
      setCurrentRankName(currentConfig.ranks[0].name);
    }
  }, [playerProfile, activeGameKey]);

  const activeRank = currentConfig.ranks.find(r => r.name === currentRankName) || currentConfig.ranks[0];

  const handleRankChange = async (e) => {
    const newRank = e.target.value;
    setCurrentRankName(newRank);
    if (onUpdateRank) onUpdateRank(newRank);
    if (!user?.id) return;

    const updatedTiers = { ...(playerProfile?.rankTiers || {}), [activeGameKey]: newRank };
    
    await supabase
      .from('profiles')
      .update({ rankTiers: updatedTiers }) 
      .eq('id', user.id);
  };

  return (
    <div className="bg-white dark:bg-[#161b26] border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-md dark:shadow-xl mb-6 space-y-6">
      
      {/* Sync account header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Synced Account Integration</h4>
            <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[8px] font-mono text-cyan-400 uppercase tracking-widest animate-pulse flex items-center gap-1">
              <Link2 className="w-2.5 h-2.5 animate-spin" />
              12 axis signal link stable
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Active tracking profile synced to <span className="text-[#00b4d8] font-bold font-mono">{activeSelectedGame}</span> telemetry node.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
            Badge: {playerProfile.gamerTag}
          </span>
          <button className="bg-[#00b4d8] hover:bg-[#0096c7] text-slate-950 font-black py-2 px-4 rounded-lg transition-all text-[10px] uppercase tracking-wider cursor-pointer border-none shadow-md shadow-cyan-500/10 select-none active:scale-[0.98]">
            Connect Account
          </button>
        </div>
      </div>

      {/* DYNAMIC CURRENT RANK & ELO TELEMETRY CARD */}
      <div className="mt-6 p-5 rounded-2xl bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md dark:shadow-xl">
        
        {/* Rank Emblem & Title */}
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl border flex flex-col items-center justify-center ${activeRank.bgColor} ${activeRank.borderColor} ${activeRank.color}`}
            style={{ boxShadow: `0 0 20px ${activeRank.glowColor}` }}
          >
            <span className="text-lg font-extrabold font-mono">✦</span>
            <span className="text-[9px] font-mono font-bold tracking-tighter uppercase">TIER</span>
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-600 dark:text-slate-400 font-bold">
                {activeGameKey} COMPETITIVE STANDING
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 mt-0.5">
              <h3 className={`text-xl font-extrabold font-mono uppercase tracking-wide ${activeRank.color}`}>
                {activeRank.name}
              </h3>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${activeRank.bgColor} ${activeRank.borderColor} ${activeRank.color}`}>
                {activeRank.percentile}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Elo / Score & Selector */}
        <div className="flex items-center gap-6 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 border-slate-200 dark:border-slate-800 pt-3 md:pt-0">
          <div className="text-left md:text-right">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-600 dark:text-slate-400 font-bold block">
              {currentConfig.metricLabel}
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-extrabold font-mono text-cyan-400">
                {currentElo || currentConfig.defaultElo}
              </span>
              <span className="text-xs font-mono text-slate-400 font-bold">
                {currentConfig.unit}
              </span>
            </div>
          </div>

          {/* Dynamic Game-Specific Rank Selector */}
          <select
            value={activeRank.name}
            onChange={handleRankChange}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-200 hover:border-cyan-400 focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            {currentConfig.ranks.map((r) => (
              <option key={r.name} value={r.name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                {r.name}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* 3 Telemetry Summary Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        
        {/* Total Matches */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[#00b4d8] flex-shrink-0">
            <Play className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="block text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest truncate">
              Total Matches Played
            </span>
            <span className="text-lg font-black text-slate-900 dark:text-white font-mono leading-none block mt-0.5">
              {matchesCount > 0 ? matchesCount : 28}
            </span>
          </div>
        </div>

        {/* Clan/Team Tag */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="block text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest truncate">
              Active Clan or Team Tag
            </span>
            <span className="text-xs font-black text-slate-900 dark:text-white uppercase truncate block mt-0.5">
              {playerProfile.teamTag}
            </span>
          </div>
        </div>

        {/* Hours Competed */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="block text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest truncate">
              Hours Competed
            </span>
            <span className="text-lg font-black text-slate-900 dark:text-white font-mono leading-none block mt-0.5">
              {playerProfile.totalHours} Hrs
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default IntegrationPanel;
