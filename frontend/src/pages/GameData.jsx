import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export const AUTOMATED_GAMES = [
  'Valorant',
  'Counter-Strike 2',
  'Dota 2',
  'Apex Legends',
  'PUBG',
  'F1 25',
  'Assetto Corsa'
];

export const MANUAL_GAMES = [
  'EA FC 27',
  'Rainbow Six Siege'
];

export default function GameData() {
  const [user, setUser] = useState(null);
  const [registeredTitles, setRegisteredTitles] = useState([]);
  const [selectedGame, setSelectedGame] = useState('Valorant');
  const [matchHistory, setMatchHistory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);

  // Tracker API state
  const [trackerGamerTag, setTrackerGamerTag] = useState('');
  const [trackerTagLine, setTrackerTagLine] = useState('');
  const [isSyncingTracker, setIsSyncingTracker] = useState(false);
  const [isBound, setIsBound] = useState(false);

  useEffect(() => {
    const checkBoundProfile = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('profiles')
        .select('valorant_ign, valorant_tag')
        .eq('id', user.id)
        .single();

      if (data?.valorant_ign && data?.valorant_tag) {
        setTrackerGamerTag(data.valorant_ign);
        setTrackerTagLine(data.valorant_tag);
        setIsBound(true);
      }
    };
    checkBoundProfile();
  }, [user]);

  const [syncToast, setSyncToast] = useState({ show: false, type: 'success' });

  const showNotification = (config) => {
    setSyncToast(config);
    setTimeout(() => {
      setSyncToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  // Form State: Tactical Shooters / MOBAs
  const [simAcs, setSimAcs] = useState('268');
  const [simKd, setSimKd] = useState('1.65');
  const [simEcon, setSimEcon] = useState('78');
  const [simElo, setSimElo] = useState('248');

  // Form State: Sim Racing
  const [simTrack, setSimTrack] = useState('Spa-Francorchamps');
  const [simTyre, setSimTyre] = useState('Soft (C4)');
  const [simFastestLap, setSimFastestLap] = useState('1:44.820');
  const [simSector1, setSimSector1] = useState('30.2');
  const [simSector2, setSimSector2] = useState('42.4');
  const [simSector3, setSimSector3] = useState('32.2');

  // Form State: Sports / Manual
  const [manualDivision, setManualDivision] = useState('Elite Division');
  const [manualSkillRating, setManualSkillRating] = useState('2150');
  const [manualGoals, setManualGoals] = useState('4');
  const [manualPassAccuracy, setManualPassAccuracy] = useState('91');
  const [manualPossession, setManualPossession] = useState('58');

  // 1. Fetch User & Registered Titles
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('esports_titles')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.esports_titles?.length) {
        setRegisteredTitles(profile.esports_titles);
        setSelectedGame(profile.esports_titles[0]);
      } else {
        const defaults = ['Valorant', 'F1 25', 'EA FC 27'];
        setRegisteredTitles(defaults);
        setSelectedGame(defaults[0]);
      }
    };
    fetchUser();
  }, []);

  // 2. Fetch Telemetry History for Selected Game
  const fetchTelemetryHistory = async () => {
    if (!user?.id) return;
    setIsLoadingFeed(true);
    try {
      const tableName = selectedGame === 'Valorant' ? 'valorant_match_telemetry' : 'game_match_telemetry';
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', user.id)
        .eq('game_title', selectedGame)
        .order('match_date', { ascending: true });

      if (!error && data) {
        setMatchHistory(data);
      }
    } catch (err) {
      console.error('Error fetching telemetry history:', err);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  useEffect(() => {
    fetchTelemetryHistory();
  }, [selectedGame, user?.id]);

  const isAutomated = AUTOMATED_GAMES.includes(selectedGame);

  // 3. Compute LCC Mathematical Logic
  const computeLCC = () => {
    const totalMatches = matchHistory.length;
    if (totalMatches < 5) {
      return {
        lcc: 0,
        pBaseline: 0,
        pCurrent: 0,
        n: totalMatches,
        isCalibrated: false,
        matchesRemaining: 5 - totalMatches
      };
    }

    const baselineSet = matchHistory.slice(0, 5);
    const pBaseline = baselineSet.reduce((acc, m) => acc + Number(m.performance_score), 0) / 5;

    const currentSet = matchHistory.slice(-5);
    const pCurrent = currentSet.reduce((acc, m) => acc + Number(m.performance_score), 0) / 5;

    const n = Math.max(1, totalMatches - 5);
    const lcc = (pCurrent - pBaseline) / n;

    return {
      lcc: Number(lcc.toFixed(3)),
      pBaseline: Number(pBaseline.toFixed(1)),
      pCurrent: Number(pCurrent.toFixed(1)),
      n,
      isCalibrated: true,
      matchesRemaining: 0
    };
  };

  const lccData = computeLCC();

  // 4. Ingestion Handler
  const handleIngestMatch = async (type) => {
    if (!user?.id) return;
    setIsSubmitting(true);

    let performanceScore = 70;
    let payload = {};

    if (selectedGame === 'Valorant' || selectedGame === 'Counter-Strike 2') {
      const acsNum = Number(simAcs) || 200;
      const kdNum = Number(simKd) || 1.0;
      performanceScore = Number(((acsNum / 350) * 60 + (kdNum / 2.0) * 40).toFixed(1));
      payload = {
        acs: acsNum,
        kd: kdNum,
        econ_rating: Number(simEcon),
        elo: simElo
      };
    } else if (selectedGame === 'F1 25' || selectedGame === 'Assetto Corsa') {
      performanceScore = 89.2;
      payload = {
        track: simTrack,
        tyre_compound: simTyre,
        fastest_lap: simFastestLap,
        sectors: { s1: simSector1, s2: simSector2, s3: simSector3 }
      };
    } else if (selectedGame === 'EA FC 27') {
      const goals = Number(manualGoals) || 0;
      const passPct = Number(manualPassAccuracy) || 80;
      performanceScore = Number((goals * 12 + passPct * 0.55).toFixed(1));
      payload = {
        division: manualDivision,
        skill_rating: manualSkillRating,
        goals,
        pass_accuracy: passPct,
        possession: Number(manualPossession)
      };
    }

    try {
      const { error } = await supabase.from('game_match_telemetry').insert({
        user_id: user.id,
        game_title: selectedGame,
        ingestion_type: type,
        performance_score: performanceScore,
        metrics_payload: payload,
      });

      if (error) throw error;
      await fetchTelemetryHistory();
    } catch (err) {
      alert('Ingestion error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Delete Telemetry Record
  const handleDeleteTelemetry = async (id) => {
    try {
      const tableName = selectedGame === 'Valorant' ? 'valorant_match_telemetry' : 'game_match_telemetry';
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (!error) {
        setMatchHistory((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncFromAPI = async () => {
    if (!user?.id) {
      showNotification({ show: true, type: 'error', message: 'Please sign in before syncing match telemetry.' });
      return;
    }
    if (!trackerGamerTag || !trackerTagLine) {
      showNotification({ show: true, type: 'error', message: 'Please enter both Riot ID and Tagline.' });
      return;
    }

    setIsSyncingTracker(true);
    try {
      const res = await fetch('http://localhost:5000/api/sync-valorant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          gameTitle: selectedGame,
          gamerTag: trackerGamerTag.trim(),
          tagLine: trackerTagLine.trim(),
          region: 'ap' // Default Asia-Pacific
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Sync error (Status: ${res.status})`);
      }

      // Trigger Custom Ingestion Notification
      showNotification({
        show: true,
        type: 'success',
        title: 'LIVE TELEMETRY INGESTED',
        map: data.payload?.map || 'Breeze',
        score: data.performanceScore,
        acs: data.payload?.acs,
        kd: data.payload?.kd
      });

      await fetchTelemetryHistory();
    } catch (err) {
      showNotification({
        show: true,
        type: 'error',
        message: err.message || 'Failed to ingest match telemetry.'
      });
    } finally {
      setIsSyncingTracker(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b13] text-slate-900 dark:text-slate-100 p-4 md:p-8 space-y-8 max-w-7xl mx-auto transition-colors pt-28">
      
      {/* HEADER BANNER */}
      <div className="relative w-full h-52 sm:h-60 rounded-3xl overflow-hidden border border-slate-800 bg-[#070b13] shadow-2xl flex items-center p-6 sm:p-10">
        <div className="absolute inset-0 bg-gradient-to-r from-[#070b13]/95 via-[#070b13]/80 to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-2 max-w-2xl">
          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 uppercase tracking-wider inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            TELEMETRY INGESTION & LCC LAB
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-mono text-white uppercase tracking-wide">
            GAME DATA CALIBRATION ENGINE
          </h1>
          <p className="text-xs font-mono text-slate-300 leading-relaxed">
            Ingest raw match telemetry, calibrate game-specific metrics, and verify mathematical Learning Curve Calculator (LCC) outputs before dashboard serialization.
          </p>
        </div>
      </div>

      {/* REGISTERED TITLES SELECTOR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#0b111e] border border-slate-200 dark:border-slate-800 shadow-md dark:shadow-2xl">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            ATHLETE REGISTERED DISCIPLINES
          </span>
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Select an active title to calibrate telemetry and evaluate mathematical curve outputs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {registeredTitles.map((game) => {
            const isSelected = selectedGame === game;
            return (
              <button
                key={game}
                type="button"
                onClick={() => setSelectedGame(game)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                    : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-cyan-400'
                }`}
              >
                <span>{game}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-slate-950' : 'bg-slate-500'}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* LCC MATHEMATICAL ENGINE DISPLAY CARD */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0b111e] border border-slate-200 dark:border-slate-800 shadow-md dark:shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-600 dark:text-cyan-400 font-bold">
              ALGORITHMIC LINEAR GROWTH PROOF
            </span>
            <h2 className="text-xl font-bold font-mono text-slate-900 dark:text-white uppercase">
              LEARNING CURVE CALCULATOR (LCC)
            </h2>
          </div>
          <div className="p-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 font-mono text-xs text-cyan-600 dark:text-cyan-400 font-bold">
            LCC = (P_current - P_baseline) / N
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">P_baseline (Initial 5 Matches)</span>
            <p className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">
              {lccData.isCalibrated ? `${lccData.pBaseline} Pts` : `${matchHistory.length}/5 Sampled`}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">P_current (Recent 5 Matches)</span>
            <p className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">
              {lccData.isCalibrated ? `${lccData.pCurrent} Pts` : 'Pending Samples'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">N (Growth Delta Period)</span>
            <p className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">
              {lccData.isCalibrated ? `${lccData.n} Matches` : `${matchHistory.length} Matches`}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Linear Growth Slope</span>
            <div className="flex items-center gap-2 mt-1">
              <p className={`text-2xl font-extrabold font-mono ${lccData.lcc >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {lccData.lcc >= 0 ? `+${lccData.lcc}` : lccData.lcc}
              </p>
              {lccData.lcc > 0 && matchHistory.length >= 10 && (
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 uppercase">
                  ADAPTABILITY UNLOCKED
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CONDITIONAL SINGLE-CHANNEL INGESTION WORKSPACE */}
      <div className="w-full max-w-4xl mx-auto">
        {isAutomated ? (
          /* CHANNEL A: AUTOMATED API & UDP STREAM */
          <div className="p-7 md:p-8 rounded-3xl bg-white dark:bg-[#0b111e] border border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.12)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">
                  AUTOMATED TELEMETRY CHANNEL
                </span>
                <h3 className="text-lg font-bold font-mono text-slate-900 dark:text-white uppercase mt-0.5">
                  {selectedGame} API & UDP STREAM NODE
                </h3>
              </div>
              <span className="self-start sm:self-auto px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                ACTIVE PROTOCOL
              </span>
            </div>

            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 leading-relaxed">
              Real-time telemetry extraction active for <strong>{selectedGame}</strong> via automated webhooks and memory stream simulator.
            </p>

            {selectedGame === 'F1 25' || selectedGame === 'Assetto Corsa' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1.5">TRACK NAME</label>
                  <input
                    type="text"
                    value={simTrack}
                    onChange={(e) => setSimTrack(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1.5">TYRE COMPOUND</label>
                  <input
                    type="text"
                    value={simTyre}
                    onChange={(e) => setSimTyre(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1.5">FASTEST LAP TIME</label>
                  <input
                    type="text"
                    value={simFastestLap}
                    onChange={(e) => setSimFastestLap(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1.5">SECTORS (S1 / S2 / S3)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <input type="text" value={simSector1} onChange={(e) => setSimSector1(e.target.value)} className="px-2 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-center text-slate-900 dark:text-white focus:border-cyan-400 focus:outline-none" />
                    <input type="text" value={simSector2} onChange={(e) => setSimSector2(e.target.value)} className="px-2 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-center text-slate-900 dark:text-white focus:border-cyan-400 focus:outline-none" />
                    <input type="text" value={simSector3} onChange={(e) => setSimSector3(e.target.value)} className="px-2 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-center text-slate-900 dark:text-white focus:border-cyan-400 focus:outline-none" />
                  </div>
                </div>
              </div>
            ) : (
              /* Tactical Shooters / MOBAs */
              <div className="space-y-4 pt-1">
                {selectedGame === 'Valorant' ? (
                  <>
                    {/* --- VALORANT ACCOUNT GATEWAY --- */}
                    {isBound ? (
                      /* BOUND / SYNCHRONIZED STATE */
                      <div className="bg-[#0b131d] border border-slate-800/90 rounded-xl p-5 shadow-xl mb-4 max-w-3xl">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          {/* Identity Badge */}
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xl font-black">
                              🛡️
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-white font-black text-lg tracking-wide">
                                  {trackerGamerTag}
                                </span>
                                <span className="text-cyan-400 font-mono font-bold text-sm bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
                                  #{trackerTagLine}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">
                                GradeGamer ID is permanently synchronized to this Riot account.
                              </p>
                            </div>
                          </div>

                          {/* Sync Trigger Button */}
                          <button
                            onClick={handleSyncFromAPI}
                            disabled={isSyncingTracker}
                            className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-black text-xs py-2.5 px-6 rounded-lg uppercase tracking-wider transition shadow-[0_0_15px_rgba(6,182,212,0.35)] flex items-center space-x-2"
                          >
                            <span>{isSyncingTracker ? 'FETCHING TELEMETRY...' : '📡 SYNC LATEST MATCH'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* FIRST-TIME USER ONBOARDING */
                      <div className="bg-[#0b131d] border border-slate-800/90 rounded-xl p-6 shadow-xl space-y-4 mb-4 max-w-3xl">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                              Initial Setup
                            </div>
                            <h3 className="text-sm font-black text-white uppercase tracking-wide">
                              Link Valorant Identity
                            </h3>
                          </div>
                          <span className="bg-amber-950/80 border border-amber-800/60 text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-full">
                            UNLINKED
                          </span>
                        </div>

                        {/* PERMANENT BINDING WARNING BANNER */}
                        <div className="bg-amber-950/30 border border-amber-500/40 rounded-lg p-3 text-xs text-amber-200/90 leading-relaxed flex items-start space-x-2.5">
                          <span className="text-base shrink-0">⚠️</span>
                          <div>
                            <strong className="font-bold text-amber-300">IMPORTANT:</strong> Once linked, your GradeGamer profile will be <strong className="text-white">permanently bound</strong> to this Riot ID. Multi-account switching is disabled to ensure telemetry authenticity and anti-smurf integrity.
                          </div>
                        </div>

                        {/* COMPACT INPUT GRID */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end pt-1">
                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Riot ID / In-Game Name
                            </label>
                            <input
                              type="text"
                              value={trackerGamerTag}
                              onChange={(e) => setTrackerGamerTag(e.target.value)}
                              placeholder="e.g. T1 TenZ"
                              className="w-full bg-[#070d14] border border-slate-700/80 focus:border-cyan-400 rounded-lg py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none transition"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Tagline
                            </label>
                            <input
                              type="text"
                              value={trackerTagLine}
                              onChange={(e) => setTrackerTagLine(e.target.value.replace('#', ''))}
                              placeholder="e.g. 2001 (No # needed)"
                              className="w-full bg-[#070d14] border border-slate-700/80 focus:border-cyan-400 rounded-lg py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none transition font-mono"
                            />
                          </div>
                        </div>

                        {/* BIND AND SYNC ACTION BUTTON */}
                        <button
                          onClick={handleSyncFromAPI}
                          disabled={isSyncingTracker}
                          className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-black text-xs py-2.5 px-4 rounded-lg uppercase tracking-wider transition shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center space-x-2"
                        >
                          <span>{isSyncingTracker ? 'BINDING IDENTITY...' : '🔒 BIND & SYNC VALORANT ACCOUNT'}</span>
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-800/20 border border-slate-700/50 text-center">
                    <p className="text-xs font-mono text-slate-400">Direct API integration for {selectedGame} is currently under construction. Please use another title.</p>
                  </div>
                )}
              </div>
            )}

            {(selectedGame.includes('F1') || selectedGame.includes('Assetto')) && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleIngestMatch('UDP_TELEMETRY')}
                className="w-full py-3.5 rounded-xl bg-cyan-400 text-slate-950 font-mono text-xs font-bold uppercase hover:bg-cyan-300 transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)] disabled:opacity-40 cursor-pointer mt-4"
              >
                {isSubmitting ? 'INGESTING TELEMETRY PACKET...' : '⚡ INGEST MANUAL SIMULATOR STREAM'}
              </button>
            )}

          </div>
        ) : (
          /* CHANNEL B: MANUAL SCORECARD VERIFICATION */
          <div className="p-7 md:p-8 rounded-3xl bg-white dark:bg-[#0b111e] border border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.12)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                  MANUAL SCORECARD VERIFICATION
                </span>
                <h3 className="text-lg font-bold font-mono text-slate-900 dark:text-white uppercase mt-0.5">
                  {selectedGame} MATCH REPORT ENTRY
                </h3>
              </div>
              <span className="self-start sm:self-auto px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-950/70 border border-amber-500/40 text-amber-300 uppercase">
                MANUAL ENTRY REQUIRED
              </span>
            </div>

            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 leading-relaxed">
              Direct telemetry API hooks are unavailable for <strong>{selectedGame}</strong>. Submit verified scorecard data below to calibrate match growth.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1.5">DIVISION / BRACKET</label>
                <input
                  type="text"
                  value={manualDivision}
                  onChange={(e) => setManualDivision(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1.5">SKILL RATING (SR)</label>
                <input
                  type="text"
                  value={manualSkillRating}
                  onChange={(e) => setManualSkillRating(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1.5">GOALS / ROUND IMPACT</label>
                <input
                  type="number"
                  value={manualGoals}
                  onChange={(e) => setManualGoals(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1.5">PASS ACCURACY %</label>
                <input
                  type="number"
                  value={manualPassAccuracy}
                  onChange={(e) => setManualPassAccuracy(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1.5">POSSESSION %</label>
                <input
                  type="number"
                  value={manualPossession}
                  onChange={(e) => setManualPossession(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleIngestMatch('MANUAL_ENTRY')}
              className="w-full py-3.5 rounded-xl bg-amber-400 text-slate-950 font-mono text-xs font-bold uppercase hover:bg-amber-300 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-40 cursor-pointer mt-4"
            >
              {isSubmitting ? 'SUBMITTING SCORECARD...' : '✍ SUBMIT MANUAL SCORECARD RECORD'}
            </button>

          </div>
        )}
      </div>

      {/* RAW TELEMETRY STREAM LOG */}
      <div className="w-full max-w-4xl mx-auto p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0b111e] border border-slate-200 dark:border-slate-800 shadow-md dark:shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-bold">
              DATA PIPELINE
            </span>
            <h2 className="text-xl font-bold font-mono text-slate-900 dark:text-white uppercase">
              RAW TELEMETRY STREAM LOG
            </h2>
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-indigo-950/70 border border-indigo-500/40 text-indigo-300 uppercase">
            {matchHistory.length} PACKETS INGESTED
          </span>
        </div>

        {isLoadingFeed ? (
          <div className="text-center p-8 text-slate-500 font-mono text-xs animate-pulse">
            SYNCING TELEMETRY PIPELINE...
          </div>
        ) : matchHistory.length === 0 ? (
          <div className="text-center p-8 text-slate-500 font-mono text-xs uppercase tracking-widest">
            NO TELEMETRY DATA FOUND FOR {selectedGame}.
          </div>
        ) : (
          <div className="space-y-3 mt-6 custom-scrollbar max-h-[800px] overflow-y-auto pr-2">
            {/* TOP AGGREGATE SUMMARY BAR */}
            <div className="bg-[#0f1923]/90 border border-slate-800 rounded-lg px-4 py-3 flex flex-wrap items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-3">
                <span className="text-white font-bold text-sm">Recent Matches</span>
                <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-300 font-semibold text-[11px]">
                  {matchHistory.length}
                </span>
                <div className="flex items-center space-x-1 font-bold">
                  <span className="text-emerald-400">
                    {matchHistory.filter(l => l.metrics_payload?.outcome === 'VICTORY').length} W
                  </span>
                  <span className="text-slate-600">//</span>
                  <span className="text-rose-400">
                    {matchHistory.filter(l => l.metrics_payload?.outcome !== 'VICTORY').length} L
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Avg K/D</div>
                  <div className="text-white font-bold text-sm">
                    {(matchHistory.reduce((acc, curr) => acc + Number(curr.metrics_payload?.kd || 1), 0) / matchHistory.length).toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Avg ACS</div>
                  <div className="text-cyan-400 font-bold text-sm">
                    {Math.round(matchHistory.reduce((acc, curr) => acc + Number(curr.metrics_payload?.acs || 200), 0) / matchHistory.length)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Avg Score (P)</div>
                  <div className="text-emerald-400 font-bold text-sm">
                    {(matchHistory.reduce((acc, curr) => acc + Number(curr.performance_score || 50), 0) / matchHistory.length).toFixed(1)}
                  </div>
                </div>
              </div>
            </div>

            {/* MATCH CARD LIST */}
            {matchHistory.map((log) => {
              const payload = log.metrics_payload || {};
              const isWin = payload.outcome === 'VICTORY';
              const kdRatio = Number(payload.kd || 1.0);
              const kills = payload.kills ?? Math.round(kdRatio * 14);
              const deaths = payload.deaths ?? 14;
              const assists = payload.assists ?? 4;
              const rounds = (payload.score_rounds || '13 : 8').split(':');
              const playerRounds = rounds[0]?.trim() || (isWin ? '13' : '9');
              const enemyRounds = rounds[1]?.trim() || (isWin ? '9' : '13');

              // Agent icon fallback resolver
              const agentName = payload.agent || 'Reyna';
              const agentSlug = agentName.toLowerCase();

              return (
                <div
                  key={log.id}
                  className="relative bg-[#0d1620] hover:bg-[#121c27] transition border border-slate-800/80 rounded-lg flex flex-col md:flex-row md:items-center justify-between p-3.5 overflow-hidden shadow-lg gap-4"
                >
                  {/* Left Status Color Bar */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      isWin ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                    }`}
                  />

                  {/* Left: Match Info & Text Agent Name */}
                  <div className="flex flex-col justify-center pl-3 flex-1">
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 mb-0.5">
                      <span>{new Date(log.created_at || log.match_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      <span className="text-slate-600">//</span>
                      <span className="text-slate-300 font-medium">{payload.mode || 'Competitive'}</span>
                      <span className="text-slate-600">//</span>
                      <span className="text-cyan-400 font-bold uppercase tracking-wider text-[10px]">
                        {payload.agent || 'Reyna'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-black text-base tracking-wide">
                        {payload.map || 'Breeze'}
                      </span>
                      <span className="bg-slate-800/90 border border-slate-700 text-[10px] text-slate-300 px-1.5 py-0.5 rounded font-medium">
                        {payload.rank || 'Platinum 2'}
                      </span>
                    </div>
                  </div>

                  {/* Center: Score & Performance Score P */}
                  <div className="flex items-center space-x-8 md:flex-none">
                    <div className="text-center">
                      <div className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider mb-0.5">Score</div>
                      <div className="font-black text-base flex items-center space-x-1 justify-center leading-none">
                        <span className={isWin ? 'text-emerald-400' : 'text-slate-300'}>{playerRounds}</span>
                        <span className="text-slate-600">:</span>
                        <span className={!isWin ? 'text-rose-400' : 'text-slate-300'}>{enemyRounds}</span>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider mb-0.5">Perf. Score</div>
                      <div className="text-emerald-400 font-black text-base leading-none">
                        {log.performance_score?.toFixed(1)}
                      </div>
                    </div>
                  </div>

                  {/* Right: Metrics (K/D, KDA, HS%, ACS) */}
                  <div className="flex items-center space-x-6 text-right pr-2 md:flex-none">
                    <div>
                      <div className="text-[10px] uppercase text-slate-500 font-semibold mb-0.5">K/D</div>
                      <div className={`font-black text-sm leading-none ${kdRatio >= 1.0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                        {kdRatio.toFixed(2)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase text-slate-500 font-semibold mb-0.5">K/D/A</div>
                      <div className="text-slate-200 font-bold text-xs leading-none">
                        {kills} <span className="text-slate-500">/</span> {deaths} <span className="text-slate-500">/</span> {assists}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase text-slate-500 font-semibold mb-0.5">HS%</div>
                      <div className="text-slate-200 font-bold text-xs leading-none">
                        {payload.hs_percent ?? 21}%
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase text-slate-500 font-semibold mb-0.5">ACS</div>
                      <div className="text-white font-bold text-sm leading-none">
                        {payload.acs ?? 200}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteTelemetry(log.id)}
                      className="ml-2 p-1.5 rounded bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition border border-rose-500/20"
                      title="Delete Record"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- CUSTOM TELEMETRY STATUS TOAST --- */}
      {syncToast.show && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          {syncToast.type === 'success' ? (
            <div className="bg-[#0f1923]/95 border border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.25)] rounded-xl p-4 min-w-[340px] backdrop-blur-md flex items-start space-x-3.5">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping mt-1.5 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400">
                    {syncToast.title || 'TELEMETRY INGESTED'}
                  </span>
                  <button
                    onClick={() => setSyncToast((prev) => ({ ...prev, show: false }))}
                    className="text-slate-500 hover:text-slate-300 text-xs transition"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="text-white font-bold text-sm mt-0.5">
                  Map: <span className="text-cyan-200">{syncToast.map}</span>
                </div>

                <div className="flex items-center space-x-3 mt-2 pt-2 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Score</span>
                    <span className="text-emerald-400 font-extrabold text-sm">{syncToast.score?.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">ACS</span>
                    <span className="text-slate-200 font-bold">{syncToast.acs}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">K/D</span>
                    <span className="text-cyan-400 font-bold">{syncToast.kd?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#1a0f14]/95 border border-rose-500/50 shadow-[0_0_25px_rgba(244,63,94,0.25)] rounded-xl p-4 min-w-[320px] backdrop-blur-md flex items-start space-x-3">
              <div className="w-2 h-2 rounded-full bg-rose-400 mt-1.5 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-rose-400">Sync Notice</span>
                  <button
                    onClick={() => setSyncToast((prev) => ({ ...prev, show: false }))}
                    className="text-slate-500 hover:text-slate-300 text-xs transition"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                  {syncToast.message}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
