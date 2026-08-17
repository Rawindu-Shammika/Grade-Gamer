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
    <div className="relative w-full h-[320px] rounded-3xl overflow-hidden border border-slate-800 bg-[#070b13] shadow-2xl group">
      {/* Background Slides */}
      {DASHBOARD_BANNERS.map((banner, index) => (
        <div
          key={banner}
          className={`w-full h-full object-cover absolute inset-0 transition-all duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-80 scale-100' : 'opacity-0 scale-105'
          }`}
          style={{ backgroundImage: `url(${getUiImageUrl(banner)})` }}
        />
      ))}

      {/* Cyber Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#070b13]/95 via-[#070b13]/70 to-transparent pointer-events-none" />

      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 p-8 z-10 space-y-2 max-w-lg">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Live Telemetry Portal
        </span>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight leading-none">
          Esports Tactical Command
        </h1>
        <p className="text-xs text-slate-300 leading-relaxed font-medium">
          Monitor scholastic achievements, view roster sync channels, and track gaming translations inside the GradeGamer system.
        </p>
      </div>

      {/* Navigation Controls */}
      <div className="absolute inset-y-0 left-4 right-4 flex items-center justify-between pointer-events-none">
        <button
          onClick={handlePrev}
          className="p-2 rounded-xl bg-[#111622]/80 border border-slate-800/80 text-white hover:bg-cyan-500 hover:border-cyan-400 hover:text-slate-950 transition-all pointer-events-auto cursor-pointer opacity-0 group-hover:opacity-100 shadow-lg"
          title="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={handleNext}
          className="p-2 rounded-xl bg-[#111622]/80 border border-slate-800/80 text-white hover:bg-cyan-500 hover:border-cyan-400 hover:text-slate-950 transition-all pointer-events-auto cursor-pointer opacity-0 group-hover:opacity-100 shadow-lg"
          title="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Play/Pause & Dots Indicator Panel */}
      <div className="absolute bottom-8 right-8 z-20 flex items-center gap-4">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white hover:border-cyan-500 transition-colors pointer-events-auto cursor-pointer"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
        <div className="flex items-center gap-1.5">
          {DASHBOARD_BANNERS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleDotClick(idx)}
              className={`w-2.5 h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIndex ? 'bg-cyan-400 w-5' : 'bg-slate-700 hover:bg-slate-600'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardHeroShowcase;
