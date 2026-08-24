import React, { useState, useEffect } from 'react';
import { ShieldCheck, Award, Mail, Phone, MapPin, Globe, Terminal, Cpu, BookOpen } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { supabase } from '../../services/supabaseClient';
import { SoftSkillCalibrationCard } from './SoftSkillCalibrationCard';
import { ResumeTelemetrySection } from './ResumeTelemetrySection';
import { calculateLCCMetrics } from '../../utils/lccCalculator';
import { calculateDotaLinearGrowth } from '../../utils/dotaStats';
import { fetchCurrentValorantAct } from '../../utils/valorantActService';
import { applyGlobalActReset } from '../../utils/actDataSync';

export const VerifiedResumeCard = ({ 
  resumeData, 
  tournaments = [], 
  education = [], 
  techStack = [], 
  softSkills = [],
  gameStats: passedGameStats,
  evaluations: passedEvaluations
}) => {
  const { user, profile } = useAuth();
  const registeredTitles = profile?.esports_titles?.length ? profile.esports_titles : ['Valorant'];

  const [evaluations, setEvaluations] = useState([]);
  const [actInfo, setActInfo] = useState(null);
  const [gameStats, setGameStats] = useState({
    valorant: { hours: 0, slope: 0, matches: 0 },
    cs2: { hours: 0, slope: 0, matches: 0 },
    assettoCorsa: { hours: 0, slope: 0, matches: 0 },
    f1_25: { hours: 0, slope: 0, matches: 0 },
  });

  useEffect(() => {
    fetchCurrentValorantAct().then((data) => setActInfo(data));
  }, []);

  useEffect(() => {
    if (passedEvaluations) {
      setEvaluations(passedEvaluations);
      return;
    }

    const fetchPeerMetrics = async () => {
      try {
        const targetUserId = profile?.id || user?.id;
        if (!targetUserId) return;

        const { data: reviews, error } = await supabase
          .from('peer_reviews')
          .select('communication_rating, teamplay_rating, mechanical_rating, leadership_rating, overall_rating')
          .eq('target_user_id', targetUserId)
          .order('created_at', { ascending: false })
          .limit(15);

        if (!error && reviews) {
          setEvaluations(reviews);
        }
      } catch (err) {
        console.error('Error fetching resume peer ratings:', err);
      }
    };

    fetchPeerMetrics();
  }, [profile?.id, user?.id, passedEvaluations]);

  useEffect(() => {
    if (passedGameStats) {
      setGameStats(passedGameStats);
      return;
    }

    const fetchTelemetryStats = async () => {
      try {
        const targetUserId = profile?.id || user?.id;
        if (!targetUserId) return;

        // Fetch Valorant matches
        const { data: valMatches } = await supabase
          .from('valorant_match_telemetry')
          .select('*')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: true });

        // Fetch Dota 2 matches
        const { data: dotaMatches } = await supabase
          .from('dota2_match_telemetry')
          .select('*')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: true });

        // Fetch League of Legends matches
        const { data: lolMatches } = await supabase
          .from('lol_match_telemetry')
          .select('*')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: true });

        // Fetch CS2 matches
        const { data: cs2Matches } = await supabase
          .from('cs2_match_telemetry')
          .select('*')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: true });

        // Fetch F1 25 matches
        const { data: f1Matches } = await supabase
          .from('f1_match_telemetry')
          .select('*')
          .order('created_at', { ascending: true });

        // Fetch EA FC 27 matches
        const { data: fcMatches } = await supabase
          .from('fc27_match_telemetry')
          .select('*')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: true });

        // Fetch Apex Legends matches
        const { data: apexMatches } = await supabase
          .from('apex_match_telemetry')
          .select('*')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: true });

        const stats = {
          valorant: { hours: 0, slope: 0, matches: 0 },
          dota2: { hours: 0, slope: 0, matches: 0 },
          league_of_legends: { hours: 0, slope: 0, matches: 0 },
          lol: { hours: 0, slope: 0, matches: 0 },
          cs2: { hours: 0, slope: 0, matches: 0 },
          assettoCorsa: { hours: 0, slope: 0, matches: 0 },
          f1_25: { hours: 0, slope: 0, matches: 0 },
          fc27: { hours: 0, slope: 0, matches: 0 },
          apex: { hours: 0, slope: 0, matches: 0 },
        };

        const processGameMatches = (matchesList, gameKey) => {
          if (!matchesList || matchesList.length === 0) return;

          let filteredList = matchesList;
          if (gameKey === 'valorant') {
            // Apply strict competitive filter for Valorant
            filteredList = matchesList.filter((match) => {
              const mode = String(
                match.metrics_payload?.mode ||
                match.metrics_payload?.queue ||
                match.metadata?.mode ||
                match.metadata?.queue ||
                match.mode ||
                match.game_mode ||
                ''
              ).toLowerCase();

              return (
                (mode === 'competitive' || mode === 'comp') &&
                !mode.includes('deathmatch') &&
                !mode.includes('escalation') &&
                !mode.includes('spikerush')
              );
            });

            // Apply global act reset filter
            filteredList = applyGlobalActReset(filteredList, 'Valorant', actInfo);
          }

          const count = filteredList.length;
          if (count === 0) return;

          // Calculate hours competed
          const totalSeconds = filteredList.reduce((acc, m) => {
            const payload = m.metrics_payload || m;
            const duration =
              payload.game_length_in_seconds ||
              payload.duration_seconds ||
              (payload.duration_ms ? payload.duration_ms / 1000 : 0) ||
              ((Number(payload.rounds_won || 0) + Number(payload.rounds_lost || 0)) * 105) ||
              2100;
            return acc + duration;
          }, 0);
          const hours = totalSeconds / 3600;

          // Calculate Linear Growth Slope (using the unified LCC metrics or Dota/LoL/CS2 regression)
          const lcc = (gameKey === 'dota2' || gameKey === 'league_of_legends' || gameKey === 'lol' || gameKey === 'cs2')
            ? calculateDotaLinearGrowth(filteredList)
            : calculateLCCMetrics(filteredList);

          stats[gameKey] = {
            hours: parseFloat(hours.toFixed(1)),
            slope: (gameKey === 'dota2' || gameKey === 'league_of_legends' || gameKey === 'lol' || gameKey === 'cs2') ? lcc.slope : lcc.slopeNumeric,
            matches: count,
          };
        };

        processGameMatches(valMatches, 'valorant');
        processGameMatches(dotaMatches, 'dota2');
        processGameMatches(lolMatches, 'league_of_legends');
        processGameMatches(cs2Matches, 'cs2');
        processGameMatches(f1Matches, 'f1_25');
        processGameMatches(fcMatches, 'fc27');
        processGameMatches(apexMatches, 'apex');

        setGameStats(stats);
      } catch (err) {
        console.error('Error fetching telemetry stats:', err);
      }
    };

    fetchTelemetryStats();
  }, [profile?.id, user?.id, actInfo, passedGameStats]);

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
        <ResumeTelemetrySection gameStats={gameStats} userProfile={profile} />

        {/* LATEST PEER EVALUATION & SOFT-SKILL CALIBRATION */}
        <SoftSkillCalibrationCard evaluations={evaluations} />

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
