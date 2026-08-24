import React from 'react';
import { ArrowLeft, BookOpen, ShieldCheck, Trophy, Users, Calendar, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AboutGradeGamer({ onViewChange }) {
  const handleGoTo = (path, tabKey) => {
    if (onViewChange) {
      onViewChange(tabKey);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (typeof window !== 'undefined') {
      localStorage.setItem('grade_gamer_active_view', tabKey);
      localStorage.setItem('gg_active_view', tabKey);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const guides = [
    {
      step: '01',
      title: 'ROSTER INITIALIZATION & ROLES',
      badge: 'SQUAD ARCHITECTURE',
      icon: Users,
      desc: 'IGLs (In-Game Leaders) create squads for specific competitive titles (Sim Racing, Valorant, CS2, Dota 2) and assign tactical seats like Primary Driver, Duelist, Initiator, or Shot Caller directly to athlete IDs.',
    },
    {
      step: '02',
      title: 'EVENT SCHEDULING & COMPLETION',
      badge: 'MATCH PARTICIPATION',
      icon: Calendar,
      desc: 'Squad leaders manually schedule upcoming leagues, scrims, or tournaments. Once an event finishes, the IGL marks it completed, cryptographically unlocking peer calibration for participating athletes.',
    },
    {
      step: '03',
      title: '360° PEER EVALUATIONS',
      badge: 'SOFT-SKILL VERIFICATION',
      icon: Trophy,
      desc: 'Lineup athletes submit 1 double-blind anonymous review per teammate per completed event across Match Communication, Tactical Teamplay, and Mechanical Precision. Reviews roll over 5-match calibration cycles.',
    },
    {
      step: '04',
      title: 'VERIFIED RESUME MATRIX',
      badge: 'INDUSTRY ACCREDITATION',
      icon: ShieldCheck,
      desc: 'All competitive telemetry, telemetry hours, and live peer review indexes compile into a standardized, shareable esports resume with exportable PDF and verification hashes.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-200 py-16 px-4 md:px-12 pt-28">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* Top Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              SYSTEM DOCUMENTATION & PROTOCOLS
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white uppercase tracking-wide font-mono pt-1">
              HOW GRADEGAMER OPERATES
            </h1>
            <p className="text-xs font-mono text-slate-400 max-w-2xl">
              A comprehensive guide to verified performance telemetry, IGL squad match scheduling, double-blind peer calibration, and accredited resumes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleGoTo('/', 'home')}
            className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-xs font-mono font-bold text-slate-300 hover:text-white hover:border-cyan-500/50 transition cursor-pointer flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            BACK TO HOME
          </button>
        </div>

        {/* Core Architecture Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {guides.map((item) => {
            const IconComp = item.icon;
            return (
              <div
                key={item.step}
                className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-6 relative overflow-hidden shadow-xl hover:border-cyan-500/40 transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-extrabold font-mono text-cyan-400">
                      {item.step}
                    </span>
                    <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                      <IconComp className="w-4 h-4" />
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 uppercase tracking-wider">
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-sm font-bold font-mono uppercase text-white mb-2 group-hover:text-cyan-300 transition">
                  {item.title}
                </h3>
                <p className="text-xs font-mono text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Verification Rules Card */}
        <div className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-6 shadow-xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
            <h3 className="text-sm font-mono uppercase font-bold text-emerald-400 tracking-wider">
              PEER EVALUATION INTEGRITY RULES
            </h3>
          </div>
          <ul className="space-y-2 text-xs font-mono text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span><strong>Event Gating:</strong> Evaluations remain locked until an active squad event is scheduled and marked completed by the IGL.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span><strong>Submission Constraint:</strong> Each squad member can submit strictly 1 review per teammate per completed event.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span><strong>Rolling 5-Match Calibration:</strong> Overall scores reflect the rolling average across the active 5-match cycle window.</span>
            </li>
          </ul>
        </div>

        {/* Footer Navigation CTA */}
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <button
            type="button"
            onClick={() => handleGoTo('/dashboard', 'dashboard')}
            className="px-6 py-3 rounded-xl bg-cyan-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider hover:bg-cyan-300 transition shadow-[0_0_20px_rgba(6,182,212,0.35)] cursor-pointer border-none"
          >
            ENTER DASHBOARD →
          </button>
          <button
            type="button"
            onClick={() => handleGoTo('/peer-reviews', 'peer-reviews')}
            className="px-6 py-3 rounded-xl border border-slate-800 bg-slate-900 text-white font-mono text-xs font-bold uppercase tracking-wider hover:border-cyan-500/50 hover:text-cyan-300 transition cursor-pointer"
          >
            VIEW PEER REVIEWS
          </button>
        </div>

      </div>
    </div>
  );
}
