import React from 'react';
import { Sparkles, TrendingUp, TrendingDown } from 'lucide-react';

/**
 * RankMetricBars Component
 * 
 * - Receives 'lccDelta', 'earlyAverage', and 'lateAverage' as props.
 * - Pure rendering logic, mapping data to fluid, glowing progress bars.
 * - Applies color-coded theme accents depending on LCC growth thresholds.
 */
export const RankMetricBars = ({ lccDelta = 0, earlyAverage = 0, lateAverage = 0 }) => {
  // Determine tier based on thresholds
  let tierName = 'Negative/Stagnant';
  let tierDesc = 'Performance velocity is currently neutral or decaying. Focus on baseline drills.';
  let theme = {
    text: 'text-red-400',
    subtext: 'text-slate-400',
    bg: 'bg-red-950/20',
    border: 'border-red-500/20',
    barFill: 'bg-gradient-to-r from-red-500 via-rose-500 to-slate-500',
    glow: 'shadow-red-500/10',
    badge: 'bg-red-500/10 border-red-500/20 text-red-400',
    icon: <TrendingDown className="w-4 h-4 text-red-500" />
  };

  if (lccDelta > 2.0) {
    tierName = 'Elite Mastery';
    tierDesc = 'Demonstrating exceptional exponential growth velocity. Performance is elite.';
    theme = {
      text: 'text-violet-400',
      subtext: 'text-indigo-300',
      bg: 'bg-violet-950/20',
      border: 'border-violet-500/20',
      barFill: 'bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500',
      glow: 'shadow-purple-500/10',
      badge: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
      icon: <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
    };
  } else if (lccDelta > 0.0) {
    tierName = 'Steady Growth';
    tierDesc = 'Consistent incremental improvements detected. Workload and execution are balanced.';
    theme = {
      text: 'text-cyan-400',
      subtext: 'text-emerald-300',
      bg: 'bg-cyan-950/20',
      border: 'border-cyan-500/20',
      barFill: 'bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500',
      glow: 'shadow-cyan-500/10',
      badge: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
      icon: <TrendingUp className="w-4 h-4 text-cyan-400" />
    };
  }

  // Ensure averages are bounded for progress bar width
  const clamp = (val) => Math.min(Math.max(val, 0), 100);

  return (
    <div className={`p-6 rounded-2xl border ${theme.border} ${theme.bg} backdrop-blur-md shadow-xl ${theme.glow} transition-all duration-500 space-y-6 relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

      {/* Header Info */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono">TELEMETRY VELOCITY TIER</span>
          <div className="flex items-center gap-2">
            {theme.icon}
            <h4 className={`text-lg font-black tracking-tight ${theme.text}`}>{tierName}</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md">{tierDesc}</p>
        </div>
        <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold tracking-wider uppercase ${theme.badge}`}>
          Delta: {lccDelta > 0 ? `+${lccDelta}` : lccDelta}
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-4">
        
        {/* Baseline (Early 5 Average) */}
        <div className="space-y-1">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Baseline level (First 5 matches avg)</span>
            <span className="text-xs font-bold text-white font-mono">{earlyAverage} / 100</span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-950/60 overflow-hidden border border-white/5 p-[1px]">
            <div 
              style={{ width: `${clamp(earlyAverage)}%` }} 
              className="h-full rounded-full bg-gradient-to-r from-slate-600 to-slate-400 transition-all duration-1000 ease-out"
            ></div>
          </div>
        </div>

        {/* Current Performance (Last 5 Average) */}
        <div className="space-y-1">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current status (Last 5 matches avg)</span>
            <span className="text-xs font-bold text-white font-mono">{lateAverage} / 100</span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-950/60 overflow-hidden border border-white/5 p-[1px]">
            <div 
              style={{ width: `${clamp(lateAverage)}%` }} 
              className={`h-full rounded-full ${theme.barFill} transition-all duration-1000 ease-out`}
            ></div>
          </div>
        </div>

        {/* Visual Velocity Slope Indicator */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">
            <span>performance decline</span>
            <span>stable</span>
            <span>high acceleration</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-950/40 relative overflow-hidden border border-white/5">
            {/* Midpoint line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/20"></div>
            {/* Dynamic slope slider */}
            <div 
              style={{ 
                left: `${clamp(50 + (lccDelta * 10))}%` 
              }} 
              className={`absolute top-0 bottom-0 w-3 -ml-1.5 rounded-full ${theme.barFill} border border-white/40 shadow-sm`}
            ></div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RankMetricBars;
