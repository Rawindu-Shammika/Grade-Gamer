import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { getUiImageUrl } from '../../utils/supabaseAssets';

const DASHBOARD_BANNERS = [
  'AC i.jpg',
  'AC ii.jpg',
  'AC iii.jpg',
  'APEX i.jpg',
  'DOTA i.webp',
  'DOTA ii.webp',
  'DOTA iii.webp',
  'FC i.webp',
  'LOL i.jpg',
  'LOL ii.webp',
  'OVERWATCH 2 i.jpg',
  'OVERWATCH 2 ii.webp',
  'PUBG i.jpg',
  'PUBG ii.jpg'
].filter(img => !img.toLowerCase().includes('team i'));

export const DashboardHeroShowcase = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % DASHBOARD_BANNERS.length);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + DASHBOARD_BANNERS.length) % DASHBOARD_BANNERS.length);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      handleNext();
    }, 7000);
    return () => clearInterval(interval);
  }, [isPlaying, handleNext]);

  const handleDotClick = (idx) => {
    setCurrentIndex(idx);
  };

  return (
    <div className="relative w-full h-64 sm:h-72 md:h-80 rounded-3xl overflow-hidden border border-slate-800 bg-[#070b13] shadow-2xl group">
      
      {/* Carousel Image Container with Optimized Framing */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#070b13]">
        {DASHBOARD_BANNERS.map((banner, index) => (
          <img
            key={banner}
            src={getUiImageUrl(banner)}
            alt="Esports Tactical Command"
            className={`absolute inset-0 w-full h-full object-cover object-[center_20%] transition-all duration-1000 ease-out ${
              index === currentIndex ? 'opacity-60 scale-100' : 'opacity-0 scale-105 pointer-events-none'
            }`}
          />
        ))}
      </div>

      {/* High-Contrast Gradient Scrim (Leaves artwork visible while keeping text readable) */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#070b13]/95 via-[#070b13]/70 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#070b13]/80 via-transparent to-transparent pointer-events-none" />

      {/* Left & Right Carousel Navigation Arrows */}
      <button
        type="button"
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-slate-900/80 border border-slate-700/80 text-white flex items-center justify-center hover:bg-cyan-500 hover:text-slate-950 transition shadow-lg cursor-pointer opacity-0 group-hover:opacity-100"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center hover:bg-cyan-300 transition shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer opacity-0 group-hover:opacity-100"
      >
        ›
      </button>

      {/* Content Layer */}
      <div className="relative z-10 h-full flex flex-col justify-between p-6 sm:p-10 max-w-2xl">
        <div className="space-y-2">
          <span className="px-2.5 py-1 rounded-full text-[9px] font-mono font-bold bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 uppercase tracking-widest inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            LIVE TELEMETRY PORTAL
          </span>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-mono text-white uppercase tracking-tight">
            ESPORTS TACTICAL COMMAND
          </h1>

          <p className="text-xs font-mono text-slate-300 leading-relaxed max-w-lg">
            Monitor scholastic achievements, view roster sync channels, and track gaming translations inside the GradeGamer system.
          </p>
        </div>

        {/* Carousel Pagination & Pause Controls */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-6 h-6 rounded-md bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-[10px] font-mono cursor-pointer"
          >
            {isPlaying ? '❚❚' : '▶'}
          </button>
          <div className="flex items-center gap-1.5">
            {DASHBOARD_BANNERS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleDotClick(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  currentIndex === idx ? 'w-6 bg-cyan-400' : 'w-2 bg-slate-700 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeroShowcase;
