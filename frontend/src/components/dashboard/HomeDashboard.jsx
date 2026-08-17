import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import useDashboardData from '../../hooks/useDashboardData';
import useEsportsEcosystem from '../../hooks/useEsportsEcosystem';
import AnalyticsHeader from './AnalyticsHeader';
import ActiveGamesGrid from './ActiveGamesGrid';
import IntegrationPanel from './IntegrationPanel';
import SkillMatrix from './SkillMatrix';
import DashboardHeroShowcase from './DashboardHeroShowcase';
import {
  Plus,
  Terminal,
  RefreshCw,
  Clock,
  BookMarked,
  Award,
  Flame,
  LogOut
} from 'lucide-react';

/**
 * Realigned HomeDashboard Component (Slice 2 Authenticated View)
 * 
 * - pt-24 px-8 pb-12 wrapper style sitting clear of sticky Navbar.
 * - Section A: Welcome Banner Card with 'TERMINATE CONNECTION' action.
 * - Section B: 3-column Profile Data Matrix (Scholastic, Competitive, Genres).
 * - Section C: Esports Analytics Console (Analytics Header, designated games grid, sync panel, capability matrix).
 */
export const HomeDashboard = ({ session, logout }) => {
  const { profile } = useAuth();
  const registeredTitles = profile?.esports_titles?.length ? profile.esports_titles : ['Valorant'];

  const [activeSelectedGame, setActiveSelectedGameRaw] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('activeSelectedGame');
      if (saved && registeredTitles.includes(saved)) return saved;
    }
    return registeredTitles[0];
  });

  useEffect(() => {
    if (registeredTitles.length > 0 && !registeredTitles.includes(activeSelectedGame)) {
      setActiveSelectedGame(registeredTitles[0]);
    }
  }, [registeredTitles, activeSelectedGame]);

  const setActiveSelectedGame = (game) => {
    setActiveSelectedGameRaw(game);
    localStorage.setItem('activeSelectedGame', game);
  };
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  // Decoupled hooks integration
  const {
    matchesList,
    playerProfile,
    lccDelta,
    isLoading,
    syncTelemetry,
    updateRankTier,
    addMockMatch
  } = useDashboardData(session, activeSelectedGame);

  const { currentActiveRoster, userRole } = useEsportsEcosystem(activeSelectedGame);

  const handleInjectMockMatch = async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const randomScore = Math.floor(Math.random() * 100) + 1;
      await addMockMatch(randomScore);
      setTimeout(() => setIsSyncing(false), 800);
    } catch (err) {
      console.error('Telemetry injection failed:', err);
      setSyncError(err?.message || 'Database write blocked by Row-Level Security.');
      setIsSyncing(false);
    }
  };

  const cardClass = 'bg-white dark:bg-[#0b111e] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-md dark:shadow-2xl space-y-4';
  const labelClass = 'block text-[8px] font-mono font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400';
  const valClass = 'text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide';

  const userEmail = session?.email || session?.user?.email || 'N/A';
  const userId = session?.id || session?.user?.id || 'N/A';
  const gamerTag = session?.user_metadata?.gamerTag || session?.user?.user_metadata?.gamerTag || 'RDeSilva24';
  const fullName = session?.user_metadata?.fullName || session?.user?.user_metadata?.fullName || 'Anonymous Student';
  const institution = session?.user_metadata?.institution || session?.user?.user_metadata?.institution || 'Unassigned';
  const eduLevel = session?.user_metadata?.eduLevel || session?.user?.user_metadata?.eduLevel || 'Undergraduate';
  const titles = session?.user_metadata?.titles || session?.user?.user_metadata?.titles || [];

  return (
    <div className="bg-slate-50 dark:bg-[#070b13] text-slate-900 dark:text-slate-100 font-sans relative z-10 w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16 pt-24 pb-12 space-y-8 flex-grow">

      {/* Hero Showcase Banner */}
      <DashboardHeroShowcase />

      {/* SECTION A: Welcome Banner Card */}
      <div className="bg-white dark:bg-[#0b111e] border-l-4 border-[#00b4d8] p-6 rounded-r-xl rounded-l-none mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-md dark:shadow-2xl">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            Welcome back, <span className="text-[#00b4d8]">{gamerTag}</span>!
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Your dual-career portfolio registry telemetry is fully authenticated. Active data transmission channels are open.
          </p>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={logout}
            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold py-2 px-4 rounded-lg transition-all text-[10px] uppercase tracking-wider cursor-pointer select-none active:scale-[0.98] flex items-center gap-1.5 border-none"
          >
            <LogOut className="w-3.5 h-3.5" />
            TERMINATE CONNECTION
          </button>
        </div>
      </div>

      {/* SECTION B: Profile Data Matrix (3-Column Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* 1. Academic Profile */}
        <div className={cardClass}>
          <h3 className="text-xs font-black uppercase tracking-widest text-[#00b4d8] border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2 font-mono">
            <BookMarked className="w-4 h-4 text-[#00b4d8]" />
            Academic Profile
          </h3>
          <div className="space-y-3 pt-1">
            <div>
              <span className={labelClass}>Student Name</span>
              <span className={valClass}>{fullName}</span>
            </div>
            <div>
              <span className={labelClass}>Academic Institution</span>
              <span className={valClass}>{institution}</span>
            </div>
            <div>
              <span className={labelClass}>Academic Level</span>
              <span className={valClass}>{eduLevel}</span>
            </div>
          </div>
        </div>

        {/* 2. Competitive Profile */}
        <div className={cardClass}>
          <h3 className="text-xs font-black uppercase tracking-widest text-[#00b4d8] border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2 font-mono">
            <Award className="w-4 h-4 text-[#00b4d8]" />
            Competitive Profile
          </h3>
          <div className="space-y-3 pt-1">
            <div>
              <span className={labelClass}>Verified Gamer Tag</span>
              <span className={valClass}>{gamerTag}</span>
            </div>
            <div>
              <span className={labelClass}>Email Address</span>
              <span className="text-xs font-black text-slate-900 dark:text-white font-mono">{userEmail}</span>
            </div>
            <div>
              <span className={labelClass}>System UID</span>
              <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 break-all">{userId}</span>
            </div>
          </div>
        </div>

        {/* 3. Registered Genres */}
        <div className={cardClass}>
          <h3 className="text-xs font-black uppercase tracking-widest text-[#00b4d8] border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2 font-mono">
            <Flame className="w-4 h-4 text-[#00b4d8]" />
            Registered Genres
          </h3>
          <div className="space-y-2 pt-1">
            {titles.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {titles.map((genre) => (
                  <span
                    key={genre}
                    className="px-2 py-0.5 rounded bg-[#00b4d8]/10 border border-[#00b4d8]/20 text-[9px] font-mono font-bold text-[#00b4d8] uppercase tracking-wider"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic">No genres selected during onboarding.</div>
            )}
          </div>
        </div>

      </div>

      {/* SECTION C: Esports Analytics Console */}
      <div className="pt-4 space-y-6">

        {/* Analytics Section Header */}
        <AnalyticsHeader
          onRefresh={syncTelemetry}
          isRefreshing={isLoading}
          teamName={currentActiveRoster?.team_name || 'SLIIT Esports'}
          playerRole={userRole}
        />

        {/* Render game switch pills restricted to registered titles */}
        <div className="flex items-center gap-2 overflow-x-auto py-2 mb-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {registeredTitles.map((game) => (
            <button
              key={game}
              type="button"
              onClick={() => setActiveSelectedGame(game)}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition uppercase whitespace-nowrap ${
                activeSelectedGame === game
                  ? 'bg-[#00b4d8] text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-white dark:bg-[#161b26] border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-700'
              }`}
            >
              {game}
            </button>
          ))}
        </div>

        {/* Main calculation workspace panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          <div className="lg:col-span-8 space-y-6">
            {/* Synced Account configuration panel */}
            <IntegrationPanel
              activeSelectedGame={activeSelectedGame}
              playerProfile={playerProfile}
              matchesCount={matchesList.length}
              onUpdateRank={updateRankTier}
            />

            {/* capability progress bars grid */}
            <SkillMatrix />
          </div>

          <div className="lg:col-span-4 space-y-6">
            {/* E2E database feedback flags */}
            {syncError && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl text-amber-400 text-xs flex flex-col gap-1">
                <span className="font-bold font-mono uppercase tracking-wide text-[9px]">Sync Block Warning</span>
                <p className="text-[11px] leading-relaxed">{syncError}</p>
                <p className="text-[9px] text-slate-500 font-medium pt-1">
                  Tip: SQL INSERT policy for the matches table is required in your Supabase configuration.
                </p>
              </div>
            )}

            {/* manual testing telemetry trigger */}
            <div className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-md dark:shadow-xl space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">Manual Telemetry Injection</h4>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-normal">
                  Trigger a mock performance entry (1-100 rating) to calculate and broadcast live LCC growth coefficients.
                </p>
              </div>

              <button
                onClick={handleInjectMockMatch}
                disabled={isLoading || isSyncing}
                className="w-full bg-[#00b4d8] hover:bg-[#0096c7] disabled:bg-slate-800 text-slate-950 font-black py-2.5 px-4 rounded-xl transition-all cursor-pointer border-none flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-md shadow-cyan-500/10 select-none active:scale-[0.98]"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    Syncing telemetry...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
                    Inject Mock Match
                  </>
                )}
              </button>
            </div>

            {/* stream data log */}
            <div className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-md dark:shadow-xl space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2 font-mono">
                <Clock className="w-4 h-4 text-[#00b4d8]" />
                Telemetry stream log
              </h4>

              <div className="max-h-[250px] overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {isLoading && matchesList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-2 text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="text-[9px] font-mono uppercase tracking-wider">Loading...</span>
                  </div>
                ) : matchesList.length === 0 ? (
                  <div className="text-center py-8 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/10 text-slate-500 space-y-2">
                    <Terminal className="w-5 h-5 mx-auto opacity-55" />
                    <p className="text-xs font-medium">No matches logged for {activeSelectedGame}.</p>
                    <p className="text-[9px] text-slate-600 dark:text-slate-500">Inject mock match data above.</p>
                  </div>
                ) : (
                  [...matchesList].reverse().map((match, idx) => {
                    const date = new Date(match.match_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div
                        key={match.id || idx}
                        className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/60 flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-800 transition-all shadow-sm"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-slate-600 dark:text-slate-500">{date}</span>
                            <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                              Match #{matchesList.length - idx}
                            </span>
                          </div>
                          <p className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest truncate">{activeSelectedGame}</p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <span className="text-xs font-black text-slate-900 dark:text-white font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/5 px-2.5 py-1 rounded-md">
                            {match.performance_score}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default HomeDashboard;
