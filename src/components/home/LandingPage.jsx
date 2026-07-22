import React from 'react';
import { 
  ArrowRight, 
  Activity, 
  Users, 
  MessageSquare, 
  Award,
  Sparkles
} from 'lucide-react';

/**
 * LandingPage - Production Presentation Layout (Cleaned)
 * 
 * - Styled in deep dark cyber-aesthetic theme.
 * - Alternating block layout architecture matching reference.
 * - Decoupled: only contains Hero, asymmetric feature panels, and footer integrations.
 * - Top Navigation is moved to the RootLayout.
 */
export const LandingPage = ({ uiImages, onAuthClick, onDashboardClick, esportsShowcase }) => {
  const tealBtnClass = 'bg-[#00b4d8] hover:bg-[#0096c7] text-slate-950 font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/10 active:scale-[0.98] select-none border-none cursor-pointer text-xs uppercase tracking-wider font-bold';
  const outlineBtnClass = 'border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all active:scale-[0.98] select-none cursor-pointer text-xs uppercase tracking-wider font-bold';
  const sectionTitleClass = 'text-2xl md:text-4xl font-black tracking-tight leading-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400';
  
  return (
    <div className="bg-[#0b0f19] text-slate-100 font-sans min-h-screen selection:bg-cyan-500/30 relative overflow-hidden flex flex-col justify-between">
      
      {/* Background ambient neon glows */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-[#00b4d8]/10 to-transparent blur-[130px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-indigo-500/10 to-transparent blur-[130px] pointer-events-none z-0"></div>

      {/* Main Sections */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-24 pb-12 space-y-28 flex-grow">
        
        {/* HERO SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero Pane */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#00b4d8]/10 border border-[#00b4d8]/20 text-[10px] font-mono font-bold text-[#00b4d8] uppercase tracking-widest animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              WELCOME TO GRADEGAMER PLATFORM
            </div>

            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight uppercase text-white">
              Competitive gaming <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00b4d8] to-indigo-400">infrastructure</span> for verified skill tracking at any scale.
            </h2>

            <p className="text-xs text-slate-400 leading-relaxed max-w-xl font-medium">
              GradeGamer bridges academic pathways and professional competitive leagues, mapping every rotation, clutch buy, and execution velocity metrics node directly to your verified gaming resume.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button 
                onClick={() => onAuthClick('signup')}
                className={tealBtnClass}
              >
                Get Started
                <ArrowRight className="w-4 h-4 text-slate-950 stroke-[3]" />
              </button>
              <button 
                onClick={() => onAuthClick('signin')}
                className={outlineBtnClass}
              >
                Create an Account
              </button>
            </div>

            {/* Asymmetrical Stats Matrix */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/5 max-w-lg">
              <div className="space-y-1">
                <span className="block text-2xl font-black text-white font-mono">40k+</span>
                <span className="block text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest leading-none">Verified Players</span>
              </div>
              <div className="space-y-1">
                <span className="block text-2xl font-black text-white font-mono">120+</span>
                <span className="block text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest leading-none">Collegiate Clubs</span>
              </div>
              <div className="space-y-1">
                <span className="block text-2xl font-black text-white font-[#00b4d8] font-mono">&lt; 3ms</span>
                <span className="block text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest leading-none">Telemetry Latency</span>
              </div>
            </div>
          </div>

          {/* Right Hero Card Graphic */}
          <div className="lg:col-span-5 relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#00b4d8]/20 to-indigo-500/20 rounded-2xl blur-xl transition-all group-hover:blur-2xl"></div>
            <div className="relative rounded-2xl p-0.5 overflow-hidden">
              {esportsShowcase}
            </div>
          </div>
        </section>

        {/* SECTION 1: Performance Tracking */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#00b4d8]/10 to-transparent rounded-2xl blur-lg"></div>
            <div className="relative rounded-xl border border-white/5 bg-[#121620]/90 p-1.5 overflow-hidden shadow-xl">
              {uiImages?.trackingArt ? (
                <img 
                  src={uiImages.trackingArt} 
                  alt="Performance Graphs Telemetry" 
                  className="w-full h-[240px] object-cover rounded-lg grayscale opacity-80 group-hover:grayscale-0 transition-all duration-500"
                />
              ) : (
                <div className="w-full h-[240px] bg-slate-950 rounded-lg flex items-center justify-center text-slate-800">
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
            <h3 className={sectionTitleClass}>Performance Tracking</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Synchronize direct telemetry parameters from match API sockets. Log structural variables (LCC, combat scores, economy multipliers) and analyze growth vectors in responsive performance metric bars.
            </p>
            <button 
              onClick={onDashboardClick}
              className={tealBtnClass}
            >
              Open Dashboard
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
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Collect verified peer inputs assessing coordination, economics buys, spatial comms, and stress tolerances. Generate detailed capability progress maps verified for structural team rosters.
            </p>
            <button 
              onClick={() => onAuthClick('signin')}
              className={outlineBtnClass}
            >
              Launch Review Portal
            </button>
          </div>

          <div className="relative group order-1 lg:order-2">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-2xl blur-lg"></div>
            <div className="relative rounded-xl border border-white/5 bg-[#121620]/90 p-1.5 overflow-hidden shadow-xl">
              {uiImages?.reviewArt ? (
                <img 
                  src={uiImages.reviewArt} 
                  alt="Sim Racing Roster Telemetry" 
                  className="w-full h-[240px] object-cover rounded-lg grayscale opacity-80 group-hover:grayscale-0 transition-all duration-500"
                />
              ) : (
                <div className="w-full h-[240px] bg-slate-950 rounded-lg flex items-center justify-center text-slate-800">
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
            <div className="relative rounded-xl border border-white/5 bg-[#121620]/90 p-1.5 overflow-hidden shadow-xl">
              {uiImages?.rosterArt ? (
                <img 
                  src={uiImages.rosterArt} 
                  alt="Roster Configurations Team" 
                  className="w-full h-[240px] object-cover rounded-lg grayscale opacity-80 group-hover:grayscale-0 transition-all duration-500"
                />
              ) : (
                <div className="w-full h-[240px] bg-slate-950 rounded-lg flex items-center justify-center text-slate-800">
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
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Manage academic club roster assignments, draft replacements, and assign performance badges (IGL, Lurker, Entry Fragger) backed by database metrics profiles.
            </p>
            <button 
              onClick={() => onAuthClick('signin')}
              className={tealBtnClass}
            >
              Manage Rosters
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
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Establish a public, verified competitive profile showcasing collegiate affiliations, raw telemetry logs, and rank credentials checked directly by Supabase.
            </p>
            <button 
              onClick={() => onAuthClick('signin')}
              className={outlineBtnClass}
            >
              View Public Profile
            </button>
          </div>

          <div className="relative group order-1 lg:order-2">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#00b4d8]/10 to-transparent rounded-2xl blur-lg"></div>
            <div className="relative rounded-xl border border-white/5 bg-[#121620]/90 p-1.5 overflow-hidden shadow-xl">
              {uiImages?.profileArt ? (
                <img 
                  src={uiImages.profileArt} 
                  alt="Verified Gamers Resume" 
                  className="w-full h-[240px] object-cover rounded-lg grayscale opacity-80 group-hover:grayscale-0 transition-all duration-500"
                />
              ) : (
                <div className="w-full h-[240px] bg-slate-950 rounded-lg flex items-center justify-center text-slate-800">
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
