import React from 'react';
import { ShieldCheck, Play, Clock, Link2 } from 'lucide-react';
import { GAME_RANK_SCHEMAS, getRankStyle } from '../../utils/gameRankMap';

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
  const rankSchema = GAME_RANK_SCHEMAS[activeSelectedGame] || [];
  const currentRank = playerProfile?.rankTiers?.[activeSelectedGame] || 'Gold';

  return (
    <div className="bg-[#161b26] border border-slate-800 p-6 rounded-xl shadow-xl mb-6 space-y-6">
      
      {/* Sync account header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-black text-white uppercase tracking-wider">Synced Account Integration</h4>
            <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[8px] font-mono text-cyan-400 uppercase tracking-widest animate-pulse flex items-center gap-1">
              <Link2 className="w-2.5 h-2.5 animate-spin" />
              12 axis signal link stable
            </span>
          </div>
          <p className="text-xs text-slate-400">
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

      {/* Rank Selector Grid */}
      <div className="space-y-3">
        <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
          Update Ranked Tier Telemetry
        </span>
        <div className="flex flex-wrap gap-2">
          {rankSchema.map((rankItem) => {
            const isCurrent = currentRank.toLowerCase() === rankItem.name.toLowerCase();
            const rankStyle = getRankStyle(activeSelectedGame, rankItem.name);

            return (
              <button
                key={rankItem.name}
                onClick={() => onUpdateRank(rankItem.name)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer border select-none active:scale-[0.97] ${
                  isCurrent
                    ? `${rankStyle.bg} ${rankStyle.border} ${rankStyle.text} ${rankStyle.extra || ''} ring-1 ring-white/10`
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {rankItem.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3 Telemetry Summary Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        
        {/* Total Matches */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[#00b4d8] flex-shrink-0">
            <Play className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="block text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest truncate">
              Total Matches Played
            </span>
            <span className="text-lg font-black text-white font-mono leading-none block mt-0.5">
              {matchesCount > 0 ? matchesCount : 28}
            </span>
          </div>
        </div>

        {/* Clan/Team Tag */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="block text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest truncate">
              Active Clan or Team Tag
            </span>
            <span className="text-xs font-black text-white uppercase truncate block mt-0.5">
              {playerProfile.teamTag}
            </span>
          </div>
        </div>

        {/* Hours Competed */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="block text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest truncate">
              Hours Competed
            </span>
            <span className="text-lg font-black text-white font-mono leading-none block mt-0.5">
              {playerProfile.totalHours} Hrs
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default IntegrationPanel;
