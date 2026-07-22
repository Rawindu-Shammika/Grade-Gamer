import React from 'react';
import { getRankStyle } from '../../utils/gameRankMap';

const GAMES_DATA = [
  { id: 'FC26', title: 'FC26', genre: 'Sports Sim', tier: 'The Elite Tier', tag: 'FC_Pro_DeSilva', club: 'RAW Gaming', defaultLcc: 1.25 },
  { id: 'F1 25', title: 'F1 25', genre: 'Sim Racing', tier: 'Platinum', tag: 'F1_DeSilva', club: 'SLIIT Esports', defaultLcc: 0.85 },
  { id: 'Valorant', title: 'Valorant', genre: 'Immortal', tag: 'DeSilva#IGL', club: 'SLIIT Esports', defaultLcc: 2.42 },
  { id: 'CS2', title: 'CS2', genre: 'Tactical FPS', tier: 'Platinum', tag: 'CS_DeSilva', club: 'RAW Gaming', defaultLcc: -0.15 },
  { id: 'Dota 2', title: 'Dota 2', genre: 'MOBA Arena', tier: 'Gold', tag: 'Dota_DeSilva', club: 'SLIIT Esports', defaultLcc: 1.12 },
  { id: 'Overwatch 2', title: 'Overwatch 2', genre: 'Hero Shooter', tier: 'Gold', tag: 'OW_DeSilva', club: 'RAW Gaming', defaultLcc: 0.00 },
  { id: 'League of Legends', title: 'League of Legends', genre: 'MOBA Arena', tier: 'Platinum', tag: 'LoL_DeSilva', club: 'SLIIT Esports', defaultLcc: 0.45 }
];

/**
 * ActiveGamesGrid Component
 * 
 * - Horizontally scrollable row containing cards for the 7 designated games.
 * - Displays categories, tiers, titles, tags, clubs, and computed LCC delta indicators.
 * - Highlights active selected game using a neon cyan outline border.
 */
export const ActiveGamesGrid = ({ activeSelectedGame, setActiveSelectedGame, currentLccDelta, playerProfile }) => {
  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">
          Active Designated Games
        </span>
        <span className="text-[10px] font-mono text-slate-500 uppercase">
          7 Tactical Profiles
        </span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {GAMES_DATA.map((game) => {
          const isActive = activeSelectedGame === game.id;
          const displayLcc = isActive ? currentLccDelta : game.defaultLcc;
          const userRank = playerProfile?.rankTiers?.[game.id] || game.tier;
          const rankStyle = getRankStyle(game.id, userRank);

          return (
            <button
              key={game.id}
              onClick={() => setActiveSelectedGame(game.id)}
              className={`flex-shrink-0 w-52 p-4 rounded-xl border text-left transition-all duration-300 relative overflow-hidden bg-[#161b26] cursor-pointer select-none active:scale-[0.98] ${
                isActive 
                  ? 'border-[#00b4d8] shadow-lg shadow-cyan-500/5' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Decorative radial overlay */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#00b4d8]/5 blur-lg pointer-events-none rounded-full"></div>

              <div className="relative z-10 space-y-3">
                {/* Top labels */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[8px] font-mono font-bold text-slate-500 uppercase truncate max-w-[90px]">
                    {game.genre}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider border ${rankStyle.text} ${rankStyle.border} ${rankStyle.bg} ${rankStyle.extra || ''}`}>
                    {userRank}
                  </span>
                </div>

                {/* Centered game title */}
                <h4 className="text-sm font-black text-white uppercase tracking-wide truncate">
                  {game.title}
                </h4>

                {/* Secondary footer blocks */}
                <div className="space-y-0.5 border-t border-slate-800/80 pt-2 text-[9px] text-slate-400 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold uppercase text-[8px]">Tag:</span>
                    <span className="truncate max-w-[120px]">{game.tag}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold uppercase text-[8px]">Club:</span>
                    <span className="truncate text-slate-300">{game.club}</span>
                  </div>
                </div>

                {/* LCC bottom indicator */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/50">
                  <span className="text-slate-500 font-bold font-mono uppercase text-[7.5px]">LEARNING CURVE LCC:</span>
                  <span className={`font-mono font-black text-[9px] ${
                    displayLcc > 0 ? 'text-emerald-400' : displayLcc < 0 ? 'text-red-400' : 'text-slate-500'
                  }`}>
                    {displayLcc > 0 ? `+${displayLcc}` : displayLcc}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ActiveGamesGrid;
