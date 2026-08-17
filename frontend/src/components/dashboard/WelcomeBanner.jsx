import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

/**
 * WelcomeBanner Component
 * 
 * - Pure UI presentation block displaying high-impact typography.
 * - Accepts 'heroUrl' as a parameter prop to map background overlays.
 * - Entirely decoupled from database queries.
 */
export const WelcomeBanner = ({ heroUrl }) => {
  return (
    <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-white/5 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white min-h-[300px] flex items-center shadow-xl transition-all duration-300">
      
      {/* Dynamic Background Image Overlay */}
      {heroUrl && (
        <div 
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-25 select-none pointer-events-none" 
          style={{ backgroundImage: `url(${heroUrl})` }}
        />
      )}

      {/* Decorative ambient radial glow */}
      <div className="absolute -top-24 -right-24 w-[350px] h-[350px] bg-gradient-to-br from-[#00b4d8]/15 to-transparent blur-[80px] pointer-events-none rounded-full"></div>

      <div className="relative z-10 p-8 md:p-12 space-y-6 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono font-bold text-[#00b4d8] uppercase tracking-wider">
          <Sparkles className="w-3 h-3 text-[#00b4d8] animate-pulse" />
          Verified Dual-Career Telemetry Registry
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400 uppercase">
            Welcome to <span className="text-[#00b4d8]">GradeGamer</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-medium">
            GradeGamer bridges student-athlete academic progress portfolios with dual-career competitive gaming metrics. 
            Analyze baseline memory architectures, motor control response times, and spatial coordination vectors 
            via stateful esports management paradigms and real-time database validation loops.
          </p>
        </div>

        <div>
          <button className="group bg-gradient-to-r from-[#00b4d8] to-cyan-500 hover:from-[#00d8f6] hover:to-cyan-400 text-slate-950 font-black py-3 px-6 rounded-xl transition-all duration-300 cursor-pointer border-none flex items-center gap-2 text-xs uppercase tracking-wider shadow-lg shadow-[#00b4d8]/20 select-none active:scale-[0.98]">
            Get Started
            <ArrowRight className="w-4 h-4 text-slate-950 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBanner;
