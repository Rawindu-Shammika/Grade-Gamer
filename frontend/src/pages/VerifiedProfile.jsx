import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../hooks/useAuth';
import { useVerifiedProfileData } from '../hooks/useVerifiedProfileData';
import { ShieldCheck, RefreshCw, AlertTriangle, Layers, Award, Terminal, Printer, Copy, Check } from 'lucide-react';
import { getUiImageUrl } from '../utils/supabaseAssets';
import { VerifiedResumeCard } from '../components/resume/VerifiedResumeCard';
import { supabase } from '../services/supabaseClient';

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
    const timer = setInterval(handleNextBanner, 10000);
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

      {/* TOP HERO BANNER (CLEAN - NO EMBEDDED BUTTONS) */}
      <div className="relative w-full h-48 sm:h-56 rounded-3xl overflow-hidden border border-slate-800 bg-[#070b13] shadow-2xl flex items-center mb-4">
        {/* Banner Image */}
        <img
          src={
            supabase.storage.from('banners').getPublicUrl('resume-banner.jpg').data.publicUrl ||
            'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80'
          }
          alt="Verified Resume Header Banner"
          className="w-full h-full object-cover object-[center_35%] absolute inset-0 opacity-80"
          onError={(e) => {
            e.target.src =
              'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80';
          }}
        />

        {/* Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070b13]/95 via-[#070b13]/70 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b13]/80 via-transparent to-transparent pointer-events-none" />

        {/* Typography */}
        <div className="relative z-10 p-6 sm:p-10 space-y-2 max-w-2xl">
          <span className="px-2.5 py-1 rounded-full text-[9px] font-mono font-bold bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 uppercase tracking-widest inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            CRYPTOGRAPHIC CREDENTIAL HUB
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold font-mono text-white uppercase tracking-wide">
            VERIFIED RESUME MATRIX
          </h1>

          <p className="text-xs font-mono text-slate-300 leading-relaxed">
            Export authenticated competitive telemetry, verifiable soft skills, and institutional credentials directly to standard formats.
          </p>
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

        <button
          type="button"
          onClick={handlePrint}
          className="px-5 py-2 rounded-xl bg-cyan-400 text-slate-950 font-mono text-xs font-bold uppercase hover:bg-cyan-300 transition-all shadow-[0_0_15px_rgba(6,182,212,0.35)] flex items-center gap-2 cursor-pointer"
        >
          <span>🖨</span>
          <span>PRINT / SAVE AS PDF</span>
        </button>

        <button
          type="button"
          onClick={handleCopyShareLink}
          className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-900/80 text-xs font-mono text-slate-200 hover:text-white hover:border-slate-500 transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>🔗</span>
          <span>{copied ? 'COPIED!' : 'COPY SHARE LINK'}</span>
        </button>
      </div>

      {/* Resume Card template */}
      <VerifiedResumeCard 
        resumeData={resumeData} 
        tournaments={tournaments}
        education={education}
        techStack={techStack}
        softSkills={softSkills}
      />

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
