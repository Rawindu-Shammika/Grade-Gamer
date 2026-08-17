import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Activity, 
  Users, 
  MessageSquare, 
  Award,
  Sparkles
} from 'lucide-react';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const cleanUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
const SUPABASE_ASSETS_BASE = `${cleanUrl}/storage/v1/object/public/assets`;

const HERO_IMAGES = ['DASHBOARD.png', 'TEAMMATES.webp', 'ROSTER%20M.avif', 'PROFILES.png'];

/**
 * LandingPage - Production Presentation Layout (Cleaned)
 * 
 * - Styled in deep dark cyber-aesthetic theme.
 * - Alternating block layout architecture matching reference.
 * - Decoupled: only contains Hero, asymmetric feature panels, and footer integrations.
 * - Top Navigation is moved to the RootLayout.
 */
export const LandingPage = ({ uiImages, onAuthClick, onDashboardClick, onViewChange, setActiveTab, onNavigate, user, logout, heroBanners }) => {
  const banners = heroBanners && heroBanners.length > 0 ? heroBanners : HERO_IMAGES.map(img => `${SUPABASE_ASSETS_BASE}/${img}`);
  const [heroIndex, setHeroIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  const handleGoTo = (path, tabKey) => {
    if (setActiveTab) {
      setActiveTab(tabKey);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (onNavigate) {
      onNavigate(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (onViewChange) {
      onViewChange(tabKey);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (onDashboardClick && tabKey === 'dashboard') {
      onDashboardClick();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (typeof window !== 'undefined') {
      window.location.pathname = path;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextHeroImage = () => {
    if (isFading) return;
    setIsFading(true);
    setTimeout(() => {
      setHeroIndex((prevIndex) => (prevIndex + 1) % banners.length);
      setIsFading(false);
    }, 300);
  };

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setHeroIndex((prev) => (prev + 1) % banners.length);
        setIsFading(false);
      }, 700);
    }, 10000);
    return () => clearInterval(timer);
  }, [banners.length, heroIndex]);

  const tealBtnClass = 'bg-[#00b4d8] hover:bg-[#0096c7] text-slate-950 font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/10 active:scale-[0.98] select-none border-none cursor-pointer text-xs uppercase tracking-wider font-bold';
  const outlineBtnClass = 'border border-slate-300 dark:border-white/10 hover:border-cyan-500 bg-white dark:bg-white/5 text-slate-800 dark:text-white font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all active:scale-[0.98] select-none cursor-pointer text-xs uppercase tracking-wider font-bold';
  const sectionTitleClass = 'text-2xl md:text-4xl font-extrabold tracking-tight leading-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-slate-900 dark:from-white via-slate-600 dark:via-slate-200 to-slate-400';
  
  return (
    <div className="bg-slate-50 dark:bg-[#070b13] text-slate-900 dark:text-slate-100 font-sans min-h-screen selection:bg-cyan-500/30 relative overflow-hidden flex flex-col justify-between">
      
      {/* Background ambient neon glows */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-[#00b4d8]/10 to-transparent blur-[130px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-indigo-500/10 to-transparent blur-[130px] pointer-events-none z-0"></div>
 
      {/* Main Sections */}
      <main className="relative z-10 w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16 pt-24 pb-12 space-y-28 flex-grow">
        
        {/* HERO SECTION */}
        <section 
          onClick={handleNextHeroImage}
          className="relative w-full min-h-[calc(100vh-6rem)] rounded-3xl overflow-hidden border border-slate-800 bg-[#070b13] shadow-2xl p-8 md:p-16 flex flex-col justify-center mb-12 cursor-pointer group select-none transition-all"
        >
          {/* Dynamic Key Prop Forces Immediate Visual Background Re-Mount */}
          <div 
            key={banners[heroIndex]}
            className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-500 transform pointer-events-none ${
              isFading ? 'opacity-0 scale-102' : 'opacity-80 group-hover:opacity-90'
            }`}
            style={{ 
              backgroundImage: `url("${banners[heroIndex]}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top 15%'
            }}
          />

          {/* Clean Dark Vignette/Scrim (NO white mist) */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#070b13]/95 via-[#070b13]/70 to-transparent pointer-events-none" />

          {/* Hero Text Content */}
          <div className="relative z-10 max-w-3xl my-auto pointer-events-auto">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/90 border border-cyan-500/50 text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                WELCOME TO GRADEGAMER PLATFORM
              </div>

              <h2 className="text-3xl md:text-5xl font-extrabold uppercase text-white leading-tight">
                Competitive gaming <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00b4d8] to-indigo-400">infrastructure</span> for verified skill tracking at any scale.
              </h2>

              <p className="text-xs text-slate-300 font-mono leading-relaxed max-w-xl">
                GradeGamer bridges academic pathways and professional competitive leagues, mapping every rotation, clutch buy, and execution velocity metrics node directly to your verified gaming resume.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => handleGoTo('/about', 'about')}
                  className="px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono text-xs font-bold uppercase tracking-wider hover:border-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all shadow-lg cursor-pointer flex items-center gap-2"
                >
                  <span>LEARN ABOUT GRADEGAMER</span>
                  <span className="text-cyan-400">ⓘ</span>
                </button>

                {!user && (
                  <button 
                    type="button"
                    onClick={() => onAuthClick && onAuthClick('signin')}
                    className={outlineBtnClass}
                  >
                    Create an Account
                  </button>
                )}
              </div>

              {/* Asymmetrical Stats Matrix */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-800/80 max-w-lg">
                <div className="space-y-1">
                  <span className="block text-2xl font-extrabold text-white font-mono">40k+</span>
                  <span className="block text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest leading-none">Verified Players</span>
                </div>
                <div className="space-y-1">
                  <span className="block text-2xl font-extrabold text-white font-mono">120+</span>
                  <span className="block text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest leading-none">Collegiate Clubs</span>
                </div>
                <div className="space-y-1">
                  <span className="block text-2xl font-extrabold text-[#00b4d8] font-mono">&lt; 3ms</span>
                  <span className="block text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest leading-none">Telemetry Latency</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1: Performance Tracking */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#00b4d8]/10 to-transparent rounded-2xl blur-lg"></div>
            <div className="relative rounded-xl border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-[#121620]/90 p-1.5 overflow-hidden shadow-md dark:shadow-xl">
              {uiImages?.trackingArt ? (
                <img 
                  src={uiImages.trackingArt} 
                  alt="Performance Graphs Telemetry" 
                  className="w-full max-h-64 md:max-h-80 lg:max-h-[320px] object-cover object-top rounded-2xl transition-all duration-500 filter-none"
                />
              ) : (
                <div className="w-full h-64 bg-slate-950 rounded-2xl flex items-center justify-center text-slate-800">
                  <Activity className="w-8 h-8" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <span className="text-[9px] font-mono font-bold text-[#00b4d8] uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              REAL-TIME ANALYTICS INTEGRATION
            </span>
            <h3 className="text-slate-900 dark:text-white font-extrabold uppercase text-2xl md:text-4xl tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 dark:from-white via-slate-600 dark:via-slate-200 to-slate-400">Performance Tracking</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-mono leading-relaxed">
              Synchronize direct telemetry parameters from match API sockets. Log structural variables (LCC, combat scores, economy multipliers) and analyze growth vectors in responsive performance metric bars.
            </p>
            <button 
              type="button"
              onClick={() => handleGoTo('/dashboard', 'dashboard')}
              className={`${tealBtnClass} cursor-pointer z-10`}
            >
              OPEN DASHBOARD
            </button>
          </div>
        </section>

        {/* SECTION 2: Teammate Reviews */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-5 order-2 lg:order-1">
            <span className="text-[9px] font-mono font-bold text-[#00b4d8] uppercase tracking-widest flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              PEER EVALUATED HR CAPABILITIES
            </span>
            <h3 className={sectionTitleClass}>Teammate Reviews</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-mono">
              Collect verified peer inputs assessing coordination, economics buys, spatial comms, and stress tolerances. Generate detailed capability progress maps verified for structural team rosters.
            </p>
            <button 
              type="button"
              onClick={() => handleGoTo('/peer-reviews', 'peer-reviews')}
              className={`${outlineBtnClass} cursor-pointer z-10`}
            >
              LAUNCH REVIEW PORTAL
            </button>
          </div>

          <div className="relative group order-1 lg:order-2">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-2xl blur-lg"></div>
            <div className="relative rounded-xl border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-[#121620]/90 p-1.5 overflow-hidden shadow-md dark:shadow-xl">
              {uiImages?.reviewArt ? (
                <img 
                  src={uiImages.reviewArt} 
                  alt="Sim Racing Roster Telemetry" 
                  className="w-full max-h-64 md:max-h-80 lg:max-h-[320px] object-cover object-top rounded-2xl transition-all duration-500 filter-none"
                />
              ) : (
                <div className="w-full h-64 bg-slate-950 rounded-2xl flex items-center justify-center text-slate-800">
                  <MessageSquare className="w-8 h-8" />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 3: Roster Management */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#00b4d8]/10 to-transparent rounded-2xl blur-lg"></div>
            <div className="relative rounded-xl border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-[#121620]/90 p-1.5 overflow-hidden shadow-md dark:shadow-xl">
              {uiImages?.rosterArt ? (
                <img 
                  src={uiImages.rosterArt} 
                  alt="Roster Configurations Team" 
                  className="w-full max-h-64 md:max-h-80 lg:max-h-[320px] object-cover object-top rounded-2xl transition-all duration-500 filter-none"
                />
              ) : (
                <div className="w-full h-64 bg-slate-950 rounded-2xl flex items-center justify-center text-slate-800">
                  <Users className="w-8 h-8" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <span className="text-[9px] font-mono font-bold text-[#00b4d8] uppercase tracking-widest flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              COHESIVE LEAGUE COMPILATIONS
            </span>
            <h3 className={sectionTitleClass}>Roster Management</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-mono">
              Manage academic club roster assignments, draft replacements, and assign performance badges (IGL, Lurker, Entry Fragger) backed by database metrics profiles.
            </p>
            <button 
              type="button"
              onClick={() => handleGoTo('/roster-management', 'roster-management')}
              className={`${tealBtnClass} cursor-pointer z-10`}
            >
              MANAGE ROSTERS
            </button>
          </div>
        </section>

        {/* SECTION 4: Verified Career Profiles */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-5 order-2 lg:order-1">
            <span className="text-[9px] font-mono font-bold text-[#00b4d8] uppercase tracking-widest flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              VERIFIED PORTFOLIO CERTIFICATIONS
            </span>
            <h3 className={sectionTitleClass}>Verified Career Profiles</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-mono">
              Establish a public, verified competitive profile showcasing collegiate affiliations, raw telemetry logs, and rank credentials checked directly by Supabase.
            </p>
            <button 
              type="button"
              onClick={() => handleGoTo('/verified-resume', 'verified-resume')}
              className={`${outlineBtnClass} cursor-pointer z-10`}
            >
              VIEW PUBLIC PROFILE
            </button>
          </div>

          <div className="relative group order-1 lg:order-2">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#00b4d8]/10 to-transparent rounded-2xl blur-lg"></div>
            <div className="relative rounded-xl border border-white/5 bg-[#121620]/90 p-1.5 overflow-hidden shadow-xl">
              {uiImages?.profileArt ? (
                <img 
                  src={uiImages.profileArt} 
                  alt="Verified Gamers Resume" 
                  className="w-full max-h-64 md:max-h-80 lg:max-h-[320px] object-cover object-top rounded-2xl transition-all duration-500 filter-none"
                />
              ) : (
                <div className="w-full h-64 bg-slate-950 rounded-2xl flex items-center justify-center text-slate-800">
                  <Award className="w-8 h-8" />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* INTEGRATIONS AND PARTNERS */}
        <section className="pt-12 border-t border-white/5 text-center space-y-6">
          <span className="block text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest">
            SUPPORTED RAW TELEMETRY PARSERS & INTEGRATIONS
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-45 grayscale">
            <span className="text-[10px] font-black tracking-widest uppercase">RIOT GAMES</span>
            <span className="text-[10px] font-black tracking-widest uppercase">EA SPORTS</span>
            <span className="text-[10px] font-black tracking-widest uppercase">STEAM</span>
            <span className="text-[10px] font-black tracking-widest uppercase">DISCORD</span>
            <span className="text-[10px] font-black tracking-widest uppercase">TWITCH</span>
          </div>
        </section>

      </main>

      {/* Footer copyright */}
      <footer className="w-full border-t border-white/5 py-6 text-center text-[10px] font-mono text-slate-500 relative z-10">
        © {new Date().getFullYear()} GRADEGAMER PLATFORM. ALL TELEMETRY CHANNELS SECURED.
      </footer>

    </div>
  );
};

export default LandingPage;
