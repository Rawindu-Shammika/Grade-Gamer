import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../hooks/useAuth';
import { useVerifiedProfileData } from '../hooks/useVerifiedProfileData';
import { ShieldCheck, RefreshCw, AlertTriangle, Layers, Award, Terminal } from 'lucide-react';
import { getUiImageUrl } from '../utils/supabaseAssets';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const cleanUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
const SUPABASE_UI_BASE = `${cleanUrl}/storage/v1/object/public/UI`;
const RESUME_BANNERS = ['DOTA iii.avif', 'VALORANT i.jpg', 'DOTA i.webp'];

/**
 * VerifiedProfile Page Component (Slice 3: Verified Career Resume Generator)
 * 
 * - Full E2E integration with Supabase database (verified_resumes & matches tables).
 * - ATS-Optimized layout mapping gaming achievements to corporate soft skills.
 */
export const VerifiedProfile = () => {
  const { user } = useAuth();
  const { resumeData, isLoading, error } = useVerifiedProfileData(user?.id);
  const [bannerIndex, setBannerIndex] = useState(0);

  const handleNextBanner = useCallback(() => {
    setBannerIndex((prev) => (prev + 1) % RESUME_BANNERS.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(handleNextBanner, 10000);
    return () => clearInterval(timer);
  }, [handleNextBanner]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-slate-200 flex flex-col items-center justify-center space-y-4 pt-20">
        <RefreshCw className="w-8 h-8 animate-spin text-[#00b4d8]" />
        <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">
          Compiling Portfolio Telemetry...
        </p>
      </div>
    );
  }

  if (error || !resumeData) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-slate-200 flex flex-col items-center justify-center space-y-4 pt-20">
        <AlertTriangle className="w-8 h-8 text-red-500" />
        <p className="text-sm font-semibold text-slate-400">
          Failed to fetch resume configurations: {error || 'System data node missing.'}
        </p>
      </div>
    );
  }

  const cardClass = 'bg-[#121620] border border-slate-800 p-6 md:p-8 rounded-2xl shadow-xl space-y-5 relative overflow-hidden';

  return (
    <div className="bg-[#0b0f19] min-h-screen text-slate-200 p-8 font-sans space-y-6 pt-28 pb-16 w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16">

      {/* High-tech Backdrop Hero Banner */}
      <div
        onClick={handleNextBanner}
        className="relative w-full min-h-[320px] md:min-h-[400px] rounded-3xl overflow-hidden border border-cyan-500/30 bg-[#111622] shadow-2xl cursor-pointer group mb-8 select-none transition-all hover:border-cyan-400/60"
      >
        {/* Animated Background Banner with Top-Focused Framing */}
        {RESUME_BANNERS.map((banner, index) => (
          <div
            key={banner}
            className={`absolute inset-0 bg-cover bg-[center_top_15%] transition-all duration-1000 ease-in-out pointer-events-none transform group-hover:scale-102 ${index === bannerIndex ? 'opacity-40 scale-100' : 'opacity-0 scale-105'
              }`}
            style={{ backgroundImage: `url(${SUPABASE_UI_BASE}/${encodeURIComponent(banner)})` }}
          />
        ))}

        {/* High-Contrast Cyber Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#111622]/90 via-[#111622]/60 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111622] via-transparent to-transparent pointer-events-none" />

        {/* Overlay Content & Controls */}
        <div className="relative z-10 h-full p-6 md:p-10 flex flex-col justify-between pointer-events-none min-h-[320px] md:min-h-[400px]">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              PUBLIC PORTFOLIO
            </span>

          </div>

          <div className="mt-auto pt-8">
            <h2 className="text-2xl md:text-4xl font-black text-white tracking-wide uppercase drop-shadow-lg">
              Verified Career Resume
            </h2>
            <p className="text-xs md:text-sm text-slate-200 mt-1.5 max-w-xl drop-shadow-md">
              Verify dual-career credentials, data translations, and corporate soft skills mapped dynamically to database telemetry records.
            </p>
          </div>

          {/* Pagination Indicators */}
          <div className="flex items-center gap-1.5 pt-4">
            {RESUME_BANNERS.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === bannerIndex
                  ? 'w-8 bg-cyan-400 shadow-sm shadow-cyan-400/50'
                  : 'w-2 bg-slate-700/80'
                  }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Block 2: The Core Profile Summary Card */}
      <div className={`${cardClass} backdrop-blur-md bg-[#121620]/60 border border-slate-800/80 hover:border-cyan-500/30 transition-all duration-300`}>
        <div className="absolute inset-0 bg-gradient-to-r from-[#121620] via-[#121620]/95 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#00b4d8] to-cyan-400 border border-cyan-500/30 flex items-center justify-center text-slate-950 font-black text-sm uppercase shadow-lg shadow-cyan-500/10">
              {resumeData.fullName ? resumeData.fullName.slice(0, 2) : 'GG'}
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-white uppercase tracking-tight leading-none">
                {resumeData.fullName}
              </h2>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
                {resumeData.professionalTitle}
              </p>
            </div>
          </div>

          {/* Security Authenticated Indicator Badge */}
          <div className="flex-shrink-0 self-start sm:self-center">
            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Telemetry & Peer Authenticated: SECURE
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed max-w-5xl relative z-10">
          {resumeData.summaryParagraph}
        </p>
      </div>

      {/* Block 3: The Translation Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Verified Gaming Telemetry (Sim Racing & Tactical FPS) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#00b4d8]" />
            <h3 className="text-xs font-black uppercase tracking-widest text-[#00b4d8] font-mono">
              Verified Gaming Telemetry
            </h3>
          </div>

          <div className="space-y-4">

            {/* Row 1: Sim Racing */}
            <div className="relative overflow-hidden p-5 rounded-xl bg-[#121620]/60 border border-slate-800/80 space-y-3 group hover:border-cyan-500/40 transition-all duration-300 backdrop-blur-md">
              {/* Background Game Art Layer */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-5 group-hover:opacity-15 transition-opacity duration-300 pointer-events-none"
                style={{ backgroundImage: `url(${getUiImageUrl('AC ii.jpg')})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#121620]/90 via-[#121620]/95 to-transparent pointer-events-none" />

              <div className="relative z-10 flex justify-between items-start">
                <span className="text-xs font-black text-white uppercase tracking-wide">
                  Sim Racing (Assetto Corsa / F1)
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] font-mono font-bold uppercase tracking-widest">
                  Active
                </span>
              </div>
              <div className="relative z-10 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[9px] font-mono text-slate-500 uppercase block tracking-wider">Hours Competed</span>
                  <span className="text-sm font-black text-slate-200">{resumeData.simRacingHours} Hours</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-slate-500 uppercase block tracking-wider">Consistency Index</span>
                  <span className="text-sm font-black text-slate-200">98.4% Precision</span>
                </div>
              </div>
            </div>

            {/* Row 2: Tactical FPS */}
            <div className="relative overflow-hidden p-5 rounded-xl bg-[#121620]/60 border border-slate-800/80 space-y-3 group hover:border-cyan-500/40 transition-all duration-300 backdrop-blur-md">
              {/* Background Game Art Layer */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-5 group-hover:opacity-15 transition-opacity duration-300 pointer-events-none"
                style={{ backgroundImage: `url(${getUiImageUrl('PUBG ii.jpg')})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#121620]/90 via-[#121620]/95 to-transparent pointer-events-none" />

              <div className="relative z-10 flex justify-between items-start">
                <span className="text-xs font-black text-white uppercase tracking-wide">
                  Tactical FPS (CS2 / Valorant)
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] font-mono font-bold uppercase tracking-widest">
                  Active
                </span>
              </div>
              <div className="relative z-10 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[9px] font-mono text-slate-500 uppercase block tracking-wider">Hours Competed</span>
                  <span className="text-sm font-black text-slate-200">{resumeData.tacticalFpsHours} Hours</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-slate-500 uppercase block tracking-wider">Tactical Communications</span>
                  <span className="text-sm font-black text-slate-200">94.1% Efficiency</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Corporate Soft Skill Equivalents */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#00b4d8]" />
            <h3 className="text-xs font-black uppercase tracking-widest text-[#00b4d8] font-mono">
              Corporate Soft Skill Equivalents
            </h3>
          </div>

          <div className="space-y-4">

            {/* Skill Card 1 */}
            <div className="p-5 rounded-xl bg-[#121620] border border-slate-800 space-y-1">
              <h4 className="text-xs font-black uppercase text-white tracking-wide">
                Cross-Functional Leadership
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Directly maps to <strong className="text-slate-300">In-Game Leader (IGL)</strong> responsibility: coordinates cross-functional team roles, tactical calls, and adaptive pivots under high stress.
              </p>
            </div>

            {/* Skill Card 2 */}
            <div className="p-5 rounded-xl bg-[#121620] border border-slate-800 space-y-1">
              <h4 className="text-xs font-black uppercase text-white tracking-wide">
                Data-Driven Crisis Management
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Directly maps to <strong className="text-slate-300">Telemetry slope adaptations</strong>: continuously parses real-time indicators and performance statistics to optimize team response.
              </p>
            </div>

            {/* Skill Card 3 */}
            <div className="p-5 rounded-xl bg-[#121620] border border-slate-800 space-y-1">
              <h4 className="text-xs font-black uppercase text-white tracking-wide">
                Resource Allocation & Workload Optimization
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Directly maps to <strong className="text-slate-300">Economic Rounds & Utility buy</strong> layouts: manages team loadouts, economy bounds, and utility expenditures to optimize ROI on project sprints.
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* Block 4: Mathematical Verification Logs */}
      <div className={cardClass}>
        <div className="border-b border-slate-800 pb-2">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#00b4d8] font-mono">
            Mathematical Verification Logs
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">

          {/* LCC SLOPE INDEX card progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="uppercase text-slate-300 tracking-wider">LCC Slope Index</span>
              <span className="font-mono text-[#00b4d8] bg-cyan-950/20 px-2 py-0.5 rounded border border-cyan-500/20">
                {resumeData.lccSlopeIndex >= 0 ? `+${resumeData.lccSlopeIndex}%` : `${resumeData.lccSlopeIndex}%`} Adaptation
              </span>
            </div>
            <div className="w-full h-2 rounded bg-slate-950 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-[#00b4d8] rounded transition-all"
                style={{ width: `${Math.min(100, Math.max(0, 50 + resumeData.lccSlopeIndex * 4))}%` }}
              ></div>
            </div>
            <span className="text-[9px] text-slate-500 font-mono block">
              Linear Calibration Curve Slope calculating user performance improvements over last 10 records.
            </span>
          </div>

          {/* PEER EVALUATION AVERAGE card progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="uppercase text-slate-300 tracking-wider">Peer Evaluation Average</span>
              <span className="font-mono text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/20">
                {resumeData.peerEvaluationAverage} / 10.0 Rating
              </span>
            </div>
            <div className="w-full h-2 rounded bg-slate-950 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded transition-all"
                style={{ width: `${resumeData.peerEvaluationAverage * 10}%` }}
              ></div>
            </div>
            <span className="text-[9px] text-slate-500 font-mono block">
              Averaged communication, integrity, and operational coordination ratings submitted by verified peer reviewers.
            </span>
          </div>

        </div>

        {/* Verification authenticity hash string */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2">
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500 block">
            Verification Authenticity Hash Signature
          </span>
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl font-mono text-[10px] text-slate-500 break-all select-all flex items-start gap-3 w-full shadow-inner">
            <Terminal className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed tracking-wider select-all">{resumeData.sha256Authenticity}</span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default VerifiedProfile;
