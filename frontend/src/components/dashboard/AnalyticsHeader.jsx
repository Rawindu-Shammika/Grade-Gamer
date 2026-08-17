import React from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * AnalyticsHeader Component
 * 
 * - Rendered in premium dark card theme: bg-[#161b26] border border-slate-800.
 * - Displays static Player ID RDeSilva24 adjacent to Status Optimized badge.
 * - Displays title, role, and telemetry refresh utility button.
 */
export const AnalyticsHeader = ({ onRefresh, isRefreshing, teamName = 'SLIIT Esports', playerRole = 'In Game Leader IGL' }) => {
  return (
    <div className="bg-[#161b26] border border-slate-800 p-6 rounded-xl shadow-xl mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Active Team Tag: {teamName}</span>
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-[#00b4d8]/20 text-[9px] font-bold text-[#00b4d8] uppercase tracking-wider animate-pulse">
            Status Optimized
          </span>
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-tight">Esports Analytics Panel</h2>
        <p className="text-xs text-slate-400 font-medium">
          Role: <span className="text-white font-bold font-mono">{playerRole}</span> | Professional performance telemetry matrix
        </p>
      </div>

      <div className="flex-shrink-0">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold py-2.5 px-5 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs uppercase tracking-wider select-none active:scale-[0.98] border-none"
        >
          <RefreshCw className={`w-4 h-4 text-[#00b4d8] ${isRefreshing ? 'animate-spin' : ''}`} />
          Refreshing Telemetry Data
        </button>
      </div>
    </div>
  );
};

export default AnalyticsHeader;
