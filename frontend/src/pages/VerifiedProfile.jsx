import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../hooks/useAuth';
import { useVerifiedProfileData } from '../hooks/useVerifiedProfileData';
import { ShieldCheck, RefreshCw, AlertTriangle, Layers, Award, Terminal, Printer, Copy, Check } from 'lucide-react';
import { getUiImageUrl } from '../utils/supabaseAssets';
import { VerifiedResumeCard } from '../components/resume/VerifiedResumeCard';
import { supabase } from '../services/supabaseClient';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ResumePDFDocument } from '../components/ResumePDFDocument';
import { AtsResumeDocument } from '../components/resume/AtsResumeDocument';
import { calculateLCCMetrics } from '../utils/lccCalculator';
import { calculateDotaLinearGrowth } from '../utils/dotaStats';
import { fetchCurrentValorantAct } from '../utils/valorantActService';
import { applyGlobalActReset } from '../utils/actDataSync';
import { useMemo } from 'react';

import { getBannerImageUrl, SUPABASE_UI_BASE } from '../utils/supabaseAssets';

// Verified banner assets with guaranteed local fallbacks
const RESUME_BANNERS = [
  { remote: 'DOTA iii.avif', fallback: '/banners/profile_resume.jpg' },
  { remote: 'APEX ii.jpg', fallback: '/banners/Esports.jpg' },
];

/**
 * VerifiedProfile Page Component (Slice 3: Verified Career Resume Generator)
 * 
 * - Full E2E integration with Supabase database (verified_resumes & matches tables).
 * - ATS-Optimized layout mapping gaming achievements to corporate soft skills.
 */
export const VerifiedProfile = () => {
  const { user, profile } = useAuth();
  const { resumeData, isLoading, error } = useVerifiedProfileData(user?.id);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [savingCredentials, setSavingCredentials] = useState(false);

  // Form state for editable sections
  const [tournaments, setTournaments] = useState([
    '1st Place - SLIIT Inter-University Esports Championship (2025)',
    'Top 5 - F1 Sim-League Asia Regionals Division I (2024)',
    'Finalist - Valorant Red Bull Campus Clutch National Qualifier (2024)',
    'Semi-Finalist - CS2 Cyber League South Asia Spring Cup (2024)'
  ]);

  const [education, setEducation] = useState([
    { degree: 'BSC (HONS) IN COMPUTER SCIENCE', institution: 'SLIIT City University (2023 - Present)' },
    { degree: 'ESPORTS ANALYTICS & TELEMETRY CERTIFICATION', institution: 'GradeGamer Verified Platform Accreditation (2025)' }
  ]);

  const [techStack, setTechStack] = useState([
    'MoTeC i2 Pro', 'F1 Telemetry Tool', 'Fanatec DD2 Wheelbase', 'Gamer Dashboard SDK', 'TailwindCSS', 'Supabase API'
  ]);

  const [softSkills, setSoftSkills] = useState([
    'Cross-Functional Leadership (IGL)', 'Data-Driven Decision Making', 'Crisis Management under Stress', 'Strategic Resource Allocation'
  ]);

  // Populate from profile on load
  useEffect(() => {
    if (profile) {
      if (profile.tournament_records?.length) setTournaments(profile.tournament_records);
      if (profile.education_credentials?.length) setEducation(profile.education_credentials);
      if (profile.technical_stack?.length) setTechStack(profile.technical_stack);
      if (profile.verifiable_soft_skills?.length) setSoftSkills(profile.verifiable_soft_skills);
    }
  }, [profile]);

  const handleSaveCredentials = async () => {
    if (!user?.id) return;
    setSavingCredentials(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          tournament_records: tournaments,
          education_credentials: education,
          technical_stack: techStack,
          verifiable_soft_skills: softSkills
        })
        .eq('id', user.id);

      if (error) throw error;
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Failed to save resume credentials:', err);
      alert('Failed to save credentials: ' + err.message);
    } finally {
      setSavingCredentials(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyShareLink = () => {
    if (resumeData) {
      const shareUrl = `${window.location.origin}/verified-resume/${resumeData.sha256Authenticity}`;
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNextBanner = useCallback(() => {
    setBannerIndex((prev) => (prev + 1) % RESUME_BANNERS.length);
  }, []);

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
  }, [profile?.id, user?.id]);

  useEffect(() => {
    const fetchTelemetryStats = async () => {
      try {
        const targetUserId = profile?.id || user?.id;
        if (!targetUserId) return;

        // Fetch Valorant matches
        const { data: valMatches } = await supabase
          .from('valorant_match_telemetry')
          .select('*')
          .eq('user_id', targetUserId)
          .eq('game_title', 'Valorant')
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
            filteredList = applyGlobalActReset(filteredList, 'Valorant', actInfo);
          }

          const count = filteredList.length;
          if (count === 0) return;

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
  }, [profile?.id, user?.id, actInfo]);

  const peerEvaluations = useMemo(() => {
    if (!evaluations || evaluations.length === 0) {
      return {
        communication: 4.0,
        teamplay: 3.0,
        mechanical: 5.0,
        leadership: null,
        composite: 4.0,
      };
    }

    let totalComm = 0;
    let totalTeam = 0;
    let totalMech = 0;
    let totalLead = 0;
    let leadCount = 0;

    evaluations.forEach((item) => {
      totalComm += Number(item.communication_score || item.communication || item.communication_rating || 0);
      totalTeam += Number(item.teamplay_score || item.teamplay || item.teamplay_rating || 0);
      totalMech += Number(item.mechanical_score || item.mechanical || item.mechanical_rating || 0);

      const leadershipScore = item.leadership_score || item.leadership || item.shotcalling_score || item.leadership_rating;
      if (leadershipScore !== undefined && leadershipScore !== null && Number(leadershipScore) > 0) {
        totalLead += Number(leadershipScore);
        leadCount += 1;
      }
    });

    const count = evaluations.length;
    const avgComm = parseFloat((totalComm / count).toFixed(1));
    const avgTeam = parseFloat((totalTeam / count).toFixed(1));
    const avgMech = parseFloat((totalMech / count).toFixed(1));
    const avgLead = leadCount > 0 ? parseFloat((totalLead / leadCount).toFixed(1)) : null;

    const baseMetrics = [avgComm, avgTeam, avgMech];
    if (avgLead !== null) baseMetrics.push(avgLead);

    const composite = parseFloat(
      (baseMetrics.reduce((sum, val) => sum + val, 0) / baseMetrics.length).toFixed(1)
    );

    return {
      communication: avgComm,
      teamplay: avgTeam,
      mechanical: avgMech,
      leadership: avgLead,
      composite,
    };
  }, [evaluations]);

  const [profileSettings, setProfileSettings] = useState({
    platform_id: '',
    in_game_name: '',
    primary_game: ''
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const fetchProfileSettings = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('platform_id, in_game_name, primary_game')
          .eq('id', user.id)
          .maybeSingle();
        if (data) {
          setProfileSettings({
            platform_id: data.platform_id || '',
            in_game_name: data.in_game_name || '',
            primary_game: data.primary_game || ''
          });
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };
    fetchProfileSettings();
  }, [user?.id]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsSavingSettings(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          platform_id: profileSettings.platform_id.trim(),
          in_game_name: profileSettings.in_game_name.trim(),
          primary_game: profileSettings.primary_game.trim()
        });
      if (error) throw error;
      alert('Settings updated successfully!');
      setShowSettings(false);
    } catch (err) {
      console.error('Failed to update settings:', err);
      alert('Failed to update settings: ' + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  useEffect(() => {
    if (RESUME_BANNERS.length <= 1) return;
    const timer = setInterval(handleNextBanner, 6000);
    return () => clearInterval(timer);
  }, [handleNextBanner]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-200 flex flex-col items-center justify-center space-y-4 pt-20">
        <RefreshCw className="w-8 h-8 animate-spin text-[#00b4d8]" />
        <p className="text-xs font-mono text-slate-600 dark:text-slate-400 uppercase tracking-widest">
          Compiling Portfolio Telemetry...
        </p>
      </div>
    );
  }

  if (error || !resumeData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-200 flex flex-col items-center justify-center space-y-4 pt-20">
        <AlertTriangle className="w-8 h-8 text-red-500" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          Failed to fetch resume configurations: {error || 'System data node missing.'}
        </p>
      </div>
    );
  }

  const cardClass = 'bg-white dark:bg-[#121620] border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-2xl shadow-md dark:shadow-xl space-y-5 relative overflow-hidden';

  return (
    <div className="bg-slate-50 dark:bg-[#0b0f19] min-h-screen text-slate-900 dark:text-slate-200 p-8 font-sans space-y-6 pt-28 pb-16 w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16">

      {/* HIGH-TECH INTERACTIVE BACKDROP HERO BANNER */}
      <div
        onClick={handleNextBanner}
        className="relative w-full min-h-[180px] sm:min-h-[240px] md:min-h-[300px] rounded-3xl overflow-hidden border border-slate-800 bg-[#070b13] shadow-2xl cursor-pointer group mb-6 select-none transition-all"
      >
        {/* Animated Background Banner with Top-Focused Framing */}
        {RESUME_BANNERS.map((banner, index) => {
          const remoteUrl = getBannerImageUrl(banner.remote, banner.fallback);
          const fallbackUrl = banner.fallback;
          return (
            <div
              key={banner.remote || index}
              className={`w-full h-full object-cover absolute inset-0 transition-all duration-1000 ease-in-out pointer-events-none transform group-hover:scale-102 ${
                index === bannerIndex ? 'opacity-85 scale-100' : 'opacity-0 scale-105'
              }`}
              style={{
                backgroundImage: `linear-gradient(to right, rgba(7, 11, 19, 0.95), rgba(7, 11, 19, 0.65)), url(${remoteUrl}), url(${fallbackUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center top 15%',
              }}
            />
          );
        })}

        {/* High-Contrast Cyber Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070b13]/95 via-[#070b13]/70 to-transparent pointer-events-none" />

        {/* Overlay Content */}
        <div className="relative z-10 h-full p-6 md:p-10 flex flex-col justify-between pointer-events-none min-h-[180px] sm:min-h-[240px] md:min-h-[300px]">
          
          {/* Top Header Badge */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 uppercase tracking-widest backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              CREDENTIAL VERIFICATION & PORTFOLIO
            </span>
          </div>

          {/* Main Title & Subtitle block */}
          <div className="mt-auto pt-8">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tight uppercase drop-shadow-lg font-sans">
              Verified Resume Matrix
            </h2>
            <p className="text-xs md:text-sm text-slate-300 mt-1.5 max-w-xl drop-shadow-md font-mono">
              Export authenticated competitive telemetry, verifiable soft skills, and institutional credentials directly to standard formats.
            </p>
          </div>

          {/* Dynamic 2-Dot Pagination Indicators */}
          <div className="flex items-center gap-1.5 pt-4">
            {RESUME_BANNERS.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === bannerIndex
                    ? 'w-8 bg-cyan-400 shadow-sm shadow-cyan-400/50'
                    : 'w-2 bg-slate-700/80'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* DEDICATED ACTION TOOLBAR BELOW BANNER */}
      <div className="flex flex-wrap items-center justify-end gap-3 mb-8 print-hide">
        <button
          type="button"
          onClick={() => setIsEditModalOpen(true)}
          className="px-4 py-2 rounded-xl border border-cyan-500/40 bg-cyan-950/40 text-xs font-mono font-bold text-cyan-300 hover:bg-cyan-900/50 hover:text-white transition-all shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <span>✎</span>
          <span>EDIT CREDENTIALS</span>
        </button>

        <PDFDownloadLink
          document={
            <ResumePDFDocument
              profile={{ ...user, ...profile, full_name: profile?.full_name || user?.user_metadata?.full_name, valorant_ign: profile?.in_game_name || profile?.valorant_ign || profile?.ign, primary_game: profile?.primary_game || 'Valorant', gradegamer_id: profile?.platform_id || profile?.gradegamer_id }}
              gameStats={gameStats}
              peerEvaluations={peerEvaluations}
              tournaments={tournaments}
              education={education}
              techStack={techStack}
              softSkills={softSkills}
              verificationHash={resumeData?.verifiedHash || '0x77FA...3184'}
              sha256Id={resumeData?.sha256Authenticity || '31f9d50105120593efbb5ea7e31c890...'}
            />
          }
          fileName={`GradeGamer_ATS_Resume_${profile?.full_name || 'Export'}.pdf`}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
        >
          {({ loading }) => (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {loading ? 'CALIBRATING PDF...' : 'EXPORT ATS RESUME PDF'}
            </>
          )}
        </PDFDownloadLink>

        <button
          type="button"
          onClick={handleCopyShareLink}
          className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-900/80 text-xs font-mono text-slate-200 hover:text-white hover:border-slate-500 transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>🔗</span>
          <span>{copied ? 'COPIED!' : 'COPY SHARE LINK'}</span>
        </button>
      </div>

      {/* Styles for print override */}
      <style>{`
        @media print {
          body, html {
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-hide {
            display: none !important;
          }
          #print-resume-target {
            display: none !important;
          }
          #printable-ats-resume {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>

      {/* Resume Card template */}
      <div id="print-resume-target">
        <VerifiedResumeCard
          resumeData={resumeData}
          tournaments={tournaments}
          education={education}
          techStack={techStack}
          softSkills={softSkills}
          gameStats={gameStats}
          evaluations={evaluations}
        />
      </div>

      {/* ATS Resume View & Print Preview (collapsible/visible at bottom) */}
      <div className="mt-12 pt-8 border-t border-slate-800/80 print-hide">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          ATS / Print Preview Layout
        </h3>
        <AtsResumeDocument
          profile={{ ...user, ...profile, full_name: profile?.full_name || profile?.username || user?.user_metadata?.full_name || 'BUDHDHIKA JAYATHILAKA', valorant_ign: profile?.in_game_name || profile?.valorant_ign || profile?.ign, primary_game: profile?.primary_game || 'Valorant', gradegamer_id: profile?.platform_id || profile?.gradegamer_id }}
          gameStats={gameStats}
          peerEvaluations={peerEvaluations}
          tournaments={tournaments}
          education={education}
          techStack={techStack}
          softSkills={softSkills}
          verificationHash={resumeData?.verifiedHash || '0x77FA...3184'}
          sha256Id={resumeData?.sha256Authenticity || '31f9d50105120593efbb5ea7e31c890...'}
        />
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 dark:bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-[#0b111e] border border-cyan-500/30 rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-[0_0_40px_rgba(6,182,212,0.15)] max-h-[90vh] overflow-y-auto space-y-6">

            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-600 dark:text-cyan-400 font-bold">PORTFOLIO CALIBRATION</span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase">Edit Credentials & Achievements</h2>
              </div>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-mono text-sm cursor-pointer border-none bg-transparent">✕</button>
            </div>

            {/* 1. Tournament Placements */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase text-cyan-600 dark:text-cyan-400 font-bold">🏆 Tournament Records</label>
                <button
                  type="button"
                  onClick={() => setTournaments([...tournaments, ''])}
                  className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer border-none bg-transparent"
                >
                  + Add Placement
                </button>
              </div>
              {tournaments.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const updated = [...tournaments];
                      updated[idx] = e.target.value;
                      setTournaments(updated);
                    }}
                    placeholder="e.g. 1st Place - SLIIT Inter-University Esports Championship (2025)"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => setTournaments(tournaments.filter((_, i) => i !== idx))}
                    className="text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 px-2 font-mono cursor-pointer border-none bg-transparent"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* 2. Education & Credentials */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase text-cyan-600 dark:text-cyan-400 font-bold">🎓 Education & Credentials</label>
                <button
                  type="button"
                  onClick={() => setEducation([...education, { degree: '', institution: '' }])}
                  className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer border-none bg-transparent"
                >
                  + Add Degree
                </button>
              </div>
              {education.map((edu, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-2 relative bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => {
                      const updated = [...education];
                      updated[idx].degree = e.target.value;
                      setEducation(updated);
                    }}
                    placeholder="Degree / Certificate Title"
                    className="px-3 py-2 bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-400"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => {
                        const updated = [...education];
                        updated[idx].institution = e.target.value;
                        setEducation(updated);
                      }}
                      placeholder="Institution / Year"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={() => setEducation(education.filter((_, i) => i !== idx))}
                      className="text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 px-2 font-mono cursor-pointer border-none bg-transparent"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 3. Tech Stack */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase text-cyan-600 dark:text-cyan-400 font-bold">⚙️ Technical Stack</label>
                <button
                  type="button"
                  onClick={() => setTechStack([...techStack, ''])}
                  className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer border-none bg-transparent"
                >
                  + Add Tech
                </button>
              </div>
              {techStack.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const updated = [...techStack];
                      updated[idx] = e.target.value;
                      setTechStack(updated);
                    }}
                    placeholder="e.g. TailwindCSS"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => setTechStack(techStack.filter((_, i) => i !== idx))}
                    className="text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 px-2 font-mono cursor-pointer border-none bg-transparent"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* 4. Soft Skills */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase text-cyan-600 dark:text-cyan-400 font-bold">🧩 Soft Skills</label>
                <button
                  type="button"
                  onClick={() => setSoftSkills([...softSkills, ''])}
                  className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer border-none bg-transparent"
                >
                  + Add Skill
                </button>
              </div>
              {softSkills.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const updated = [...softSkills];
                      updated[idx] = e.target.value;
                      setSoftSkills(updated);
                    }}
                    placeholder="e.g. Data-Driven Decision Making"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => setSoftSkills(softSkills.filter((_, i) => i !== idx))}
                    className="text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 px-2 font-mono cursor-pointer border-none bg-transparent"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-xs font-mono text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCredentials}
                disabled={savingCredentials}
                className="px-6 py-2.5 rounded-xl bg-cyan-500 dark:bg-cyan-400 text-slate-950 text-xs font-mono font-bold uppercase hover:bg-cyan-400 dark:hover:bg-cyan-300 transition shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50 cursor-pointer"
              >
                {savingCredentials ? 'Saving...' : 'Save Credentials'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default VerifiedProfile;
