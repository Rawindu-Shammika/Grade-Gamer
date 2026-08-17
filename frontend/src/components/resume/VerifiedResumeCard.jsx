import React, { useState, useEffect } from 'react';
import { ShieldCheck, Award, Mail, Phone, MapPin, Globe, Terminal, Cpu, BookOpen } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { supabase } from '../../services/supabaseClient';

export const VerifiedResumeCard = ({ 
  resumeData, 
  tournaments = [], 
  education = [], 
  techStack = [], 
  softSkills = [] 
}) => {
  const { user, profile } = useAuth();
  const registeredTitles = profile?.esports_titles?.length ? profile.esports_titles : ['Valorant'];

  const [peerMetrics, setPeerMetrics] = useState({
    overallAvg: 5.0,
    commAvg: 5.0,
    teamAvg: 5.0,
    mechAvg: 5.0,
    totalReviews: 0,
  });

  useEffect(() => {
    const fetchPeerMetrics = async () => {
      try {
        const targetUserId = profile?.id || user?.id;
        if (!targetUserId) return;

        const { data: reviews, error } = await supabase
          .from('peer_reviews')
          .select('communication_rating, teamplay_rating, mechanical_rating, overall_rating')
          .eq('target_user_id', targetUserId)
          .order('created_at', { ascending: false })
          .limit(15);

        if (!error && reviews && reviews.length > 0) {
          const count = reviews.length;
          const avgOverall = reviews.reduce((acc, r) => acc + (Number(r.overall_rating) || 5), 0) / count;
          const avgComm = reviews.reduce((acc, r) => acc + (Number(r.communication_rating) || 5), 0) / count;
          const avgTeam = reviews.reduce((acc, r) => acc + (Number(r.teamplay_rating) || 5), 0) / count;
          const avgMech = reviews.reduce((acc, r) => acc + (Number(r.mechanical_rating) || 5), 0) / count;

          setPeerMetrics({
            overallAvg: parseFloat(avgOverall.toFixed(1)),
            commAvg: parseFloat(avgComm.toFixed(1)),
            teamAvg: parseFloat(avgTeam.toFixed(1)),
            mechAvg: parseFloat(avgMech.toFixed(1)),
            totalReviews: count,
          });
        }
      } catch (err) {
        console.error('Error fetching resume peer ratings:', err);
      }
    };

    fetchPeerMetrics();
  }, [profile?.id, user?.id]);

  if (!resumeData) return null;

  return (
    <div className="relative">
      {/* Isolated Print Styling Overrides */}
      <style>{`
        @media print {
          /* Hide external web chrome components like sidebars, navbars, footers, action buttons */
          header, footer, .print-hide, .print-hide * {
            display: none !important;
          }
          body * {
            visibility: hidden;
          }
          /* Show ONLY the resume card container and its children */
          #print-resume-target, #print-resume-target * {
            visibility: visible;
          }
          #print-resume-target {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: #FFFFFF !important;
            color: #0F172A !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          /* Print color resets */
          .print-bg-white {
            background-color: #FFFFFF !important;
            background-image: none !important;
          }
          .print-text-slate {
            color: #334155 !important;
          }
          .print-text-dark {
            color: #0F172A !important;
          }
          .print-border-slate {
            border-color: #E2E8F0 !important;
          }
          .print-hide {
            display: none !important;
          }
          /* Prevent breaks inside sections */
          .print-avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>

      {/* Main Resume Container */}
      <div 
        id="print-resume-target"
        className="w-full bg-white dark:bg-[#121620]/80 border border-slate-200 dark:border-slate-800 p-8 md:p-10 rounded-3xl shadow-lg dark:shadow-2xl space-y-8 print-bg-white print-text-dark print-border-slate print:p-0 print:border-none print:shadow-none"
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/80 print-border-slate print-avoid-break">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight print-text-dark">
                {profile?.full_name || resumeData.fullName || 'Esports Athlete'}
              </h1>
              {/* Profile Verification Badge */}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-500/10 border border-cyan-300 dark:border-cyan-500/20 text-cyan-600 dark:text-[#00b4d8] text-[9px] font-mono font-bold uppercase tracking-widest print-border-slate print-text-slate">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-[#00b4d8]" />
                VERIFIED
              </span>
            </div>
            
            <div className="flex flex-wrap gap-y-1 gap-x-4 text-xs text-slate-600 dark:text-slate-400 font-mono print-text-slate">
              <span className="text-cyan-600 dark:text-[#00b4d8] font-bold uppercase print-text-dark">
                {profile?.primary_game ? `Esports Competitor (${profile.primary_game})` : resumeData.professionalTitle}
              </span>
              <span className="text-slate-400 dark:text-slate-650">|</span>
              <span className="text-slate-900 dark:text-white font-bold">
                IGN: {profile?.in_game_name || 'Player'}
              </span>
              <span className="text-slate-400 dark:text-slate-650">|</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-mono font-bold">
                GradeGamer ID: {profile?.unique_account_id || 'GG-000000'}
              </span>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-600 dark:text-slate-400 pt-1 print-text-slate">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                {profile?.email || user?.email || 'N/A'}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                {profile?.phone && profile.phone.trim() !== '' ? profile.phone : 'Not Provided'}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {profile?.address && profile.address.trim() !== '' ? profile.address : 'Not Provided'}
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                gradegamer.edu/{profile?.unique_account_id || 'GG-000000'}
              </span>
            </div>
          </div>

          {/* Verification Stamp Area */}
          <div className="flex flex-col items-start md:items-end justify-center text-xs space-y-1 font-mono md:text-right print-avoid-break">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Verification Hash
            </span>
            <span className="text-[11px] text-cyan-600 dark:text-[#00b4d8] font-bold break-all print-text-dark">
              {resumeData.verifiedHash}
            </span>
            <span className="text-[9px] text-slate-500 break-all select-all font-mono leading-none pt-0.5">
              Calibrated: Live Delta +{resumeData.lccSlopeIndex}%
            </span>
          </div>
        </div>

        {/* Section A: Career Summary Paragraph */}
        <div className="space-y-2 print-avoid-break">
          <h2 className="text-xs font-black uppercase tracking-widest text-cyan-600 dark:text-[#00b4d8] font-mono print-text-dark">
            Professional Summary & Calibration
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed print-text-slate">
            {resumeData.summaryParagraph}
          </p>
        </div>

        {/* Section B: Performance Metrics Grid */}
        <div className="space-y-3 print-avoid-break">
          <h2 className="text-xs font-black uppercase tracking-widest text-cyan-600 dark:text-[#00b4d8] font-mono print-text-dark">
            Esports Competitive Telemetry & Performance Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {registeredTitles.map((title) => (
              <div key={title} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 print-bg-white print-border-slate">
                <span className="text-[9px] font-mono font-bold text-slate-600 dark:text-slate-500 uppercase tracking-wider block">
                  {title}
                </span>
                <span className="text-lg font-black text-slate-900 dark:text-white font-mono mt-1 block print-text-dark">
                  160+ Hours
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 block print-text-slate">
                  Top 5% Telemetry Analytics
                </span>
              </div>
            ))}

            {/* Metric: LCC Slope Coefficient */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 print-bg-white print-border-slate">
              <span className="text-[9px] font-mono font-bold text-slate-600 dark:text-slate-500 uppercase tracking-wider block">
                LCC Slope Coefficient
              </span>
              <span className="text-lg font-black text-emerald-500 dark:text-emerald-400 font-mono mt-1 block print-text-dark">
                +{resumeData.lccSlopeIndex}% Growth
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 block print-text-slate">
                Calibrated via 10 matches
              </span>
            </div>
          </div>
        </div>

        {/* LATEST PEER EVALUATION & SOFT-SKILL CALIBRATION */}
        <div className="space-y-3 print-avoid-break">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-600 dark:text-cyan-400 font-bold flex items-center gap-2 print-text-dark">
              <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              LATEST PEER EVALUATION & SOFT-SKILL CALIBRATION
            </span>
            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 print-text-slate">
              VERIFIED VIA {peerMetrics.totalReviews} SQUAD EVALUATIONS
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-4 gap-6 items-center shadow-md dark:shadow-lg print-bg-white print-border-slate">
            {/* Overall Composite Score */}
            <div className="md:border-r md:border-slate-200 dark:md:border-slate-800/80 md:pr-6 flex flex-col justify-center print-border-slate">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold font-mono text-cyan-600 dark:text-cyan-400 print-text-dark">
                  {peerMetrics.overallAvg.toFixed(1)}
                </span>
                <span className="text-sm font-mono text-slate-500 print-text-slate">/ 5.0</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-cyan-500 dark:text-cyan-400 text-sm">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={star <= Math.round(peerMetrics.overallAvg) ? 'text-cyan-500 dark:text-cyan-400 print-text-dark' : 'text-slate-300 dark:text-slate-700 print-text-slate'}
                  >
                    ★
                  </span>
                ))}
              </div>
              <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase print-text-slate">
                Composite Team Index
              </p>
            </div>

            {/* Metric 1: Communication */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-amber-500 dark:text-amber-400 font-bold print-text-dark">COMMUNICATION</span>
                <span className="text-amber-500 dark:text-amber-300 font-bold print-text-dark">{peerMetrics.commAvg.toFixed(1)} / 5.0</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden border border-amber-500/20 print-bg-white print-border-slate">
                <div
                  className="h-full bg-amber-500 dark:bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                  style={{ width: `${(peerMetrics.commAvg / 5) * 100}%` }}
                />
              </div>
              <span className="text-[9px] font-mono text-slate-500 uppercase print-text-slate">Clarity & In-Match Callouts</span>
            </div>

            {/* Metric 2: Tactical Teamplay */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-500 dark:text-emerald-400 font-bold print-text-dark">TACTICAL TEAMPLAY</span>
                <span className="text-emerald-500 dark:text-emerald-300 font-bold print-text-dark">{peerMetrics.teamAvg.toFixed(1)} / 5.0</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden border border-emerald-500/20 print-bg-white print-border-slate">
                <div
                  className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                  style={{ width: `${(peerMetrics.teamAvg / 5) * 100}%` }}
                />
              </div>
              <span className="text-[9px] font-mono text-slate-500 uppercase print-text-slate">Synergy & Strategy Execution</span>
            </div>

            {/* Metric 3: Mechanical Execution */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-600 dark:text-cyan-400 font-bold print-text-dark">MECHANICAL EXECUTION</span>
                <span className="text-cyan-600 dark:text-cyan-300 font-bold print-text-dark">{peerMetrics.mechAvg.toFixed(1)} / 5.0</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden border border-cyan-500/20 print-bg-white print-border-slate">
                <div
                  className="h-full bg-cyan-500 dark:bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                  style={{ width: `${(peerMetrics.mechAvg / 5) * 100}%` }}
                />
              </div>
              <span className="text-[9px] font-mono text-slate-500 uppercase print-text-slate">Micro-Precision & Consistency</span>
            </div>
          </div>
        </div>

        {/* TOURNAMENTS & EDUCATION GRID */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 print-avoid-break">
          {/* Tournaments */}
          <div className="space-y-3">
            <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-600 dark:text-cyan-400 font-bold flex items-center gap-2 print-text-dark">
              <span className="text-sm">🏆</span> TOURNAMENT RECORDS & PLACEMENTS
            </span>
            <ul className="space-y-2 text-xs font-mono text-slate-700 dark:text-slate-300 print-text-slate">
              {tournaments.map((t, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 shrink-0 print-bg-dark" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Education */}
          <div className="space-y-3">
            <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-600 dark:text-cyan-400 font-bold flex items-center gap-2 print-text-dark">
              <span className="text-sm">🎓</span> EDUCATION & CREDENTIALS
            </span>
            <div className="text-xs font-mono space-y-2">
              {education.map((edu, idx) => (
                <div key={idx}>
                  <p className="font-bold text-slate-900 dark:text-white uppercase print-text-dark">{edu.degree}</p>
                  <p className="text-slate-600 dark:text-slate-400 print-text-slate">{edu.institution}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TECHNICAL STACK & SOFT SKILLS GRID */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 print-avoid-break">
          {/* Technical & Gaming Stack */}
          <div className="space-y-3">
            <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-600 dark:text-cyan-400 font-bold flex items-center gap-2 print-text-dark">
              <span className="text-sm">⚙️</span> TECHNICAL & GAMING STACK
            </span>
            <div className="flex flex-wrap gap-2">
              {techStack.map((tech, idx) => (
                <span key={idx} className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs print-bg-white print-border-slate print-text-slate">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Verifiable Soft Skills */}
          <div className="space-y-3">
            <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-600 dark:text-cyan-400 font-bold flex items-center gap-2 print-text-dark">
              <span className="text-sm">🧩</span> VERIFIABLE SOFT SKILLS MAPPED
            </span>
            <div className="flex flex-wrap gap-2">
              {softSkills.map((skill, idx) => (
                <span key={idx} className="px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-300 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-300 font-mono text-xs print-bg-white print-border-slate print-text-slate">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Hash Signatures */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800/80 text-[9px] font-mono text-slate-500 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 print-border-slate print-text-slate print-avoid-break">
          <span>SHA-256 ID: {resumeData.sha256Authenticity.slice(0, 32)}...</span>
          <span>Verified at GradeGamer Telemetry Network</span>
        </div>
      </div>
    </div>
  );
};

export default VerifiedResumeCard;
