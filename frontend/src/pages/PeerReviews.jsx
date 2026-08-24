import React, { useState, useEffect, useCallback } from 'react';
import usePeerReviews from '../hooks/usePeerReviews';
import { Star, ShieldAlert, CheckCircle, Users, Gamepad2, ArrowRight, Lock, AlertTriangle } from 'lucide-react';
import { getBannerImageUrl, getUiImageUrl, SUPABASE_UI_BASE } from '../utils/supabaseAssets';
import useAuth from '../hooks/useAuth';
import { supabase } from '../services/supabaseClient';

const PEER_REVIEW_BANNERS = [
  { remote: 'TEAM i.jpg', fallback: '/banners/Esports.jpg' },
  { remote: 'TEAM ii.png', fallback: '/banners/Valo1.jpg' }
];

const GAME_ART_MAP = {
  'F1 25': {
    banner: getUiImageUrl('AC i.jpg'),
    icon: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=150&h=150&q=80',
    genre: 'Racing Simulation'
  },
  'Assetto Corsa': {
    banner: getUiImageUrl('AC iii.jpg'),
    icon: 'https://images.unsplash.com/photo-1605558202138-0c7f68865844?auto=format&fit=crop&w=150&h=150&q=80',
    genre: 'Racing Simulation'
  },
  'Valorant': {
    banner: getUiImageUrl('TEAM i.jpg'),
    icon: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=150&h=150&q=80',
    genre: 'Tactical Shooter'
  },
  'CS2': {
    banner: getUiImageUrl('PUBG i.jpg'),
    icon: 'https://images.unsplash.com/photo-1553481187-be93c21490a9?auto=format&fit=crop&w=150&h=150&q=80',
    genre: 'Tactical Shooter'
  },
  'Apex Legends': {
    banner: getUiImageUrl('APEX i.jpg'),
    icon: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=150&h=150&q=80',
    genre: 'Battle Royale'
  },
  'PUBG': {
    banner: getUiImageUrl('PUBG ii.jpg'),
    icon: 'https://images.unsplash.com/photo-1553481187-be93c21490a9?auto=format&fit=crop&w=150&h=150&q=80',
    genre: 'Battle Royale'
  },
  'Dota 2': {
    banner: getUiImageUrl('DOTA i.webp'),
    icon: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=150&h=150&q=80',
    genre: 'MOBA'
  },
  'League of Legends': {
    banner: getUiImageUrl('LOL ii.webp'),
    icon: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=150&h=150&q=80',
    genre: 'MOBA'
  },
  'FC26': {
    banner: getUiImageUrl('FC i.webp'),
    icon: 'https://images.unsplash.com/photo-1579952360673-2a04154024be?auto=format&fit=crop&w=150&h=150&q=80',
    genre: 'Sports Simulation'
  }
};

export const PeerReviews = () => {
  const {
    selectedTitle,
    setSelectedTitle,
    selectedTeammateId,
    setSelectedTeammateId,
    overallRating,
    submitTeammateReview,
    activeTeammates,
    reviewedTeammateIds,
    refreshReviews,
    refreshReviewedTeammates
  } = usePeerReviews();

  const { user, profile } = useAuth();
  
  const registeredTitles = profile?.esports_titles?.length ? profile.esports_titles : ['Valorant'];

  useEffect(() => {
    if (registeredTitles.length > 0 && !registeredTitles.includes(selectedTitle)) {
      setSelectedTitle(registeredTitles[0]);
    }
  }, [registeredTitles, selectedTitle, setSelectedTitle]);

  const [myRatingData, setMyRatingData] = useState({
    average: 5.0,
    totalReviews: 0,
    commAvg: 5.0,
    teamAvg: 5.0,
    mechAvg: 5.0,
    matchCountInCycle: 0,
  });

  const fetchMyPeerRatings = async () => {
    if (!user?.id) return;

    try {
      // 1. Fetch all completed matches for the active game where the user participated
      const { data: userMatches, error: matchErr } = await supabase
        .from('match_lineup')
        .select(`
          match_id,
          roster_matches:match_id(id, game_title, status, completed_at, created_at)
        `)
        .eq('user_id', user.id);

      const targetTitleLower = (selectedTitle || 'Valorant').toLowerCase();
      const completedGameMatches = (userMatches || [])
        .filter((m) => {
          const rm = m.roster_matches;
          return rm && rm.status === 'COMPLETED' && String(rm.game_title || '').toLowerCase() === targetTitleLower;
        })
        .sort((a, b) => {
          const tA = new Date(a.roster_matches?.completed_at || a.roster_matches?.created_at || 0).getTime();
          const tB = new Date(b.roster_matches?.completed_at || b.roster_matches?.created_at || 0).getTime();
          return tB - tA;
        });

      if (matchErr || completedGameMatches.length === 0) {
        setMyRatingData({
          average: 5.0,
          totalReviews: 0,
          commAvg: 5.0,
          teamAvg: 5.0,
          mechAvg: 5.0,
          matchCountInCycle: 0,
        });
        return;
      }

      // Determine current 5-match batch (takes the most recent 1 to 5 matches in the current block)
      const totalCompletedMatches = completedGameMatches.length;
      const matchCountInCycle = (totalCompletedMatches % 5) === 0 && totalCompletedMatches > 0 ? 5 : (totalCompletedMatches % 5);
      
      // Slice only the matches belonging to the current 5-match cycle window
      const currentWindowMatchIds = completedGameMatches
        .slice(0, matchCountInCycle)
        .map((m) => m.match_id);

      // 2. Fetch peer reviews received by the user specifically for these matches
      const { data: reviews, error: revErr } = await supabase
        .from('peer_reviews')
        .select('communication_rating, teamplay_rating, mechanical_rating, leadership_rating, overall_rating')
        .eq('target_user_id', user.id)
        .in('match_id', currentWindowMatchIds);

      // Check if user is an IGL in any of their current teams for the selected title
      const { data: userRoleData } = await supabase
        .from('team_members')
        .select('role, teams:team_id(id, team_name, game_title)')
        .eq('user_id', user.id);

      const isCurrentUserIGL = userRoleData?.some(
        (r) => String(r.teams?.game_title || '').toLowerCase() === targetTitleLower && (
          String(r.role || '').toUpperCase().includes('IGL') ||
          String(r.role || '').toUpperCase().includes('CAPTAIN') ||
          String(r.role || '').toUpperCase().includes('LEADER')
        )
      ) || false;

      if (!revErr && reviews && reviews.length > 0) {
        const count = reviews.length;
        const avgOverall = reviews.reduce((acc, r) => acc + Number(r.overall_rating), 0) / count;
        const avgComm = reviews.reduce((acc, r) => acc + Number(r.communication_rating), 0) / count;
        const avgTeam = reviews.reduce((acc, r) => acc + Number(r.teamplay_rating), 0) / count;
        const avgMech = reviews.reduce((acc, r) => acc + Number(r.mechanical_rating), 0) / count;
        
        const leadReviews = reviews.filter(r => r.leadership_rating !== null && r.leadership_rating !== undefined);
        const avgLead = leadReviews.length > 0 
          ? leadReviews.reduce((acc, r) => acc + Number(r.leadership_rating), 0) / leadReviews.length 
          : 0;

        setMyRatingData({
          average: parseFloat(avgOverall.toFixed(1)),
          totalReviews: count,
          commAvg: parseFloat(avgComm.toFixed(1)),
          teamAvg: parseFloat(avgTeam.toFixed(1)),
          mechAvg: parseFloat(avgMech.toFixed(1)),
          leadAvg: parseFloat(avgLead.toFixed(1)),
          isIGL: isCurrentUserIGL || leadReviews.length > 0,
          matchCountInCycle,
        });
      } else {
        setMyRatingData({
          average: 5.0,
          totalReviews: 0,
          commAvg: 5.0,
          teamAvg: 5.0,
          mechAvg: 5.0,
          leadAvg: 5.0,
          isIGL: isCurrentUserIGL,
          matchCountInCycle,
        });
      }
    } catch (err) {
      console.error('Failed to compute rolling peer ratings:', err);
    }
  };

  useEffect(() => {
    fetchMyPeerRatings();
  }, [user?.id, selectedTitle]);

  const [bannerIndex, setBannerIndex] = useState(0);

  const handleNextBanner = useCallback(() => {
    setBannerIndex((prev) => (prev + 1) % PEER_REVIEW_BANNERS.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(handleNextBanner, 10000);
    return () => clearInterval(timer);
  }, [handleNextBanner]);

  // Find single selected player object matching selectedTeammateId
  const selectedTeammate = activeTeammates?.find(t => t.id === selectedTeammateId);

  const isTargetIGL = Boolean(
    selectedTeammate?.is_leader || 
    selectedTeammate?.is_captain || 
    String(selectedTeammate?.role || '').toUpperCase().includes('IGL') ||
    String(selectedTeammate?.role || '').toUpperCase().includes('CAPTAIN')
  );

  // Form input states
  const [commScore, setCommScore] = useState(5);
  const [relScore, setRelScore] = useState(5);
  const [compScore, setCompScore] = useState(5);
  const [leadScore, setLeadScore] = useState(5);
  const [comments, setComments] = useState('');

  // UI state feedback
  const [statusMessage, setStatusMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewStatus, setReviewStatus] = useState({});
  const [isCheckingCompletion, setIsCheckingCompletion] = useState(false);

  const checkTeammatesStatus = async (teammates, activeGame) => {
    if (!user?.id || !teammates?.length) return;
    setIsCheckingCompletion(true);

    const newStatusMap = {};

    try {
      // 1. Get the latest completed match for this game that the user was in
      const { data: userMatches } = await supabase
        .from('match_lineup')
        .select('match_id, roster_matches:match_id(id, event_name, event_type, status, game_title, created_at)')
        .eq('user_id', user.id);

      const targetGameLower = (activeGame || '').toLowerCase();
      const validCompletedMatches = (userMatches || [])
        .filter((m) => {
          const rm = m.roster_matches;
          return rm && rm.status === 'COMPLETED' && String(rm.game_title || '').toLowerCase() === targetGameLower;
        })
        .sort((a, b) => new Date(b.roster_matches?.created_at || 0) - new Date(a.roster_matches?.created_at || 0));

      const latestUserMatch = validCompletedMatches[0]?.roster_matches;

      for (const teammate of teammates) {
        const targetUserId = teammate.user_id || teammate.id;
        if (!targetUserId || targetUserId === user.id) continue;

        if (!latestUserMatch) {
          newStatusMap[targetUserId] = { isEligible: false, hasReviewed: false };
          continue;
        }

        // 2. Verify target teammate was in this exact match
        const { data: inLineup } = await supabase
          .from('match_lineup')
          .select('id')
          .eq('match_id', latestUserMatch.id)
          .eq('user_id', targetUserId)
          .maybeSingle();

        if (!inLineup) {
          newStatusMap[targetUserId] = { isEligible: false, hasReviewed: false };
          continue;
        }

        // 3. Check if current user already submitted a review for this target teammate for this match_id
        const { data: reviewRecord } = await supabase
          .from('peer_reviews')
          .select('id')
          .eq('reviewer_id', user.id)
          .eq('target_user_id', targetUserId)
          .eq('match_id', latestUserMatch.id)
          .maybeSingle();

        newStatusMap[targetUserId] = {
          isEligible: true,
          hasReviewed: Boolean(reviewRecord),
          matchId: latestUserMatch.id,
          eventName: latestUserMatch.event_name,
          eventType: latestUserMatch.event_type
        };
      }
    } catch (err) {
      console.error('Error status check:', err);
    }

    setReviewStatus(newStatusMap);
    setIsCheckingCompletion(false);
  };

  useEffect(() => {
    if (activeTeammates && activeTeammates.length > 0 && selectedTitle) {
      checkTeammatesStatus(activeTeammates, selectedTitle);
    }
  }, [activeTeammates, selectedTitle, user?.id]);

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeammateId || !selectedTeammate) {
      setStatusMessage({ type: 'error', text: 'Select a teammate from the active roster first.' });
      return;
    }

    const targetUserId = selectedTeammate.user_id || selectedTeammate.id;
    const currentTargetStatus = targetUserId ? reviewStatus[targetUserId] : null;
    const isLocked = !currentTargetStatus?.isEligible || currentTargetStatus?.hasReviewed;

    if (isLocked) {
      setStatusMessage({ type: 'error', text: 'Evaluation is locked for this teammate.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const result = await submitTeammateReview({
      target_user_id: selectedTeammateId,
      communication_score: commScore,
      reliability_score: relScore,
      composure_score: compScore,
      leadership_score: isTargetIGL ? leadScore : null,
      isTargetIGL: isTargetIGL,
      constructive_comment: comments,
      match_id: currentTargetStatus?.matchId
    });

    setIsSubmitting(false);

    if (result.success) {
      setStatusMessage({
        type: 'success',
        text: `Peer evaluation for ${selectedTeammate.name} uploaded successfully.`
      });
      setComments('');
      setCommScore(5);
      setRelScore(5);
      setCompScore(5);
      setLeadScore(5);
      fetchMyPeerRatings();

      // Update state locally
      setReviewStatus(prev => ({
        ...prev,
        [targetUserId]: {
          ...prev[targetUserId],
          hasReviewed: true
        }
      }));

      if (activeTeammates && selectedTitle) {
        checkTeammatesStatus(activeTeammates, selectedTitle);
      }

      // Auto-select the next unreviewed teammate in the roster list
      const updatedReviewedIds = new Set([
        ...reviewedTeammateIds,
        String(selectedTeammate.user_id)
      ]);

      const nextUnreviewed = activeTeammates.find(
        (t) => t.id !== selectedTeammateId && !updatedReviewedIds.has(String(t.user_id))
      );

      if (nextUnreviewed) {
        setSelectedTeammateId(nextUnreviewed.id);
      } else {
        setSelectedTeammateId(null);
      }

      // Proactive sync refreshes
      if (refreshReviews) refreshReviews();
      if (refreshReviewedTeammates) refreshReviewedTeammates();
    } else {
      setStatusMessage({
        type: 'error',
        text: result.error || 'Database submission rejected.'
      });
    }
  };

  const cardClass = 'bg-[#070e17] border border-slate-800/80 p-6 md:p-8 rounded-2xl shadow-xl space-y-6 relative overflow-hidden';

  const targetUserId = selectedTeammate?.user_id || selectedTeammate?.id;
  const currentTargetStatus = targetUserId ? reviewStatus[targetUserId] : null;
  const isLocked = !currentTargetStatus?.isEligible || currentTargetStatus?.hasReviewed;

  return (
    <div className="bg-slate-50 dark:bg-[#070b13] min-h-screen text-slate-900 dark:text-slate-100 font-sans pt-28 pb-16 w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16 selection:bg-cyan-500/30">
      
      {/* High-tech Backdrop Hero Banner */}
      <div 
        onClick={handleNextBanner}
        className="relative w-full min-h-[320px] md:min-h-[400px] rounded-3xl overflow-hidden border border-slate-800 bg-[#070b13] shadow-2xl cursor-pointer group mb-8 select-none transition-all"
      >
        {/* Animated Background Banner with Top-Focused Framing */}
        {PEER_REVIEW_BANNERS.map((banner, index) => {
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
                backgroundPosition: 'center top 15%'
              }}
            />
          );
        })}

        {/* High-Contrast Cyber Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070b13]/95 via-[#070b13]/70 to-transparent pointer-events-none" />

        {/* Overlay Content & Controls */}
        <div className="relative z-10 h-full p-6 md:p-10 flex flex-col justify-between pointer-events-none min-h-[320px] md:min-h-[400px]">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 uppercase tracking-widest backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              EVALUATION HUB
            </span>

          </div>

          <div className="mt-auto pt-8">
            <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-wide uppercase drop-shadow-lg">
              360 Degree Teammate Reviews
            </h2>
            <p className="text-xs md:text-sm text-slate-300 mt-1.5 max-w-xl drop-shadow-md">
              Help verify the soft skills, composure, and leadership of your active squad mates across competitive divisions. Ensure reviews remain double-blind and constructive.
            </p>
          </div>

          {/* Pagination Indicators */}
          <div className="flex items-center gap-1.5 pt-4">
            {PEER_REVIEW_BANNERS.map((_, idx) => (
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

      {/* 1. ESPORTS TITLE SELECTOR */}
      <div className="mb-6">
        <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-2">
          Select Active Esports Title
        </label>
        <select
          value={selectedTitle}
          onChange={(e) => setSelectedTitle(e.target.value)}
          className="w-full sm:w-72 bg-[#070e17] border border-slate-800 text-white text-xs font-mono font-bold px-4 py-2.5 rounded-xl focus:border-cyan-500/50 outline-none transition uppercase cursor-pointer"
        >
          {registeredTitles.map((title) => (
            <option key={title} value={title} className="bg-slate-900 text-white">
              {title}
            </option>
          ))}
        </select>
      </div>

      {/* 2. TOP PEER RATING SUMMARY BANNER */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all mb-8 shadow-xl ${
        myRatingData.totalReviews > 0 ? 'bg-[#070e17] border-slate-800/80' : 'bg-[#060b13]/60 border-slate-800/50'
      }`}>
        {/* Left: Overall Rating & Stars */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            <div className="flex items-baseline gap-1.5 font-mono">
              <span className={`text-2xl sm:text-3xl font-black transition-colors ${
                myRatingData.totalReviews > 0 ? 'text-cyan-400' : 'text-slate-500'
              }`}>
                {myRatingData.totalReviews > 0 ? myRatingData.average.toFixed(1) : '0.0'}
              </span>
              <span className={`text-xs font-bold ${myRatingData.totalReviews > 0 ? 'text-slate-500' : 'text-slate-600'}`}>/ 5.0</span>
            </div>

            <div className="space-y-1">
              {/* Star Icons */}
              <div className={`flex items-center gap-1 text-xs transition-colors ${
                myRatingData.totalReviews > 0 ? 'text-cyan-400' : 'text-slate-700'
              }`}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={
                      myRatingData.totalReviews > 0 
                        ? (star <= Math.round(myRatingData.average) ? 'text-cyan-400' : 'text-slate-600')
                        : 'text-slate-700'
                    }
                  >
                    ★
                  </span>
                ))}
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                MY PEER RATING • {myRatingData.totalReviews} REVIEWS • <span className={myRatingData.totalReviews > 0 ? 'text-cyan-400 font-bold' : 'text-slate-600'}>
                  CYCLE: {myRatingData.totalReviews > 0 ? (myRatingData.matchCountInCycle + '/5') : '0/5'} MATCHES
                </span>
              </div>
            </div>
          </div>

          {/* Right: Dimension Badges with generous gap */}
          <div className="flex items-center gap-2.5 flex-wrap font-mono text-[11px] font-bold">
            <span className={`px-3 py-1.5 rounded-lg border transition-all ${
              myRatingData.totalReviews > 0
                ? 'bg-amber-950/40 border-amber-500/30 text-amber-400'
                : 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-50 select-none'
            }`}>
              COMM: {myRatingData.totalReviews > 0 ? myRatingData.commAvg.toFixed(1) : '0.0'} ★
            </span>
            <span className={`px-3 py-1.5 rounded-lg border transition-all ${
              myRatingData.totalReviews > 0
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-50 select-none'
            }`}>
              TEAM: {myRatingData.totalReviews > 0 ? myRatingData.teamAvg.toFixed(1) : '0.0'} ★
            </span>
            <span className={`px-3 py-1.5 rounded-lg border transition-all ${
              myRatingData.totalReviews > 0
                ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-400'
                : 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-50 select-none'
            }`}>
              MECH: {myRatingData.totalReviews > 0 ? myRatingData.mechAvg.toFixed(1) : '0.0'} ★
            </span>
            {myRatingData.isIGL && myRatingData.totalReviews > 0 ? (
              <span className="px-3 py-1.5 rounded-lg bg-purple-950/50 border border-purple-500/40 text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.15)] transition-all">
                LEAD: {myRatingData.leadAvg.toFixed(1)} ★
              </span>
            ) : (
              <span 
                className="px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-500 opacity-60 cursor-not-allowed select-none transition-all"
                title="Leadership rating calibrated exclusively for designated squad IGLs"
              >
                LEAD: 0.0 ★
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. TWO-COLUMN EVALUATION WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: ACTIVE TEAM ROSTER (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            ACTIVE TEAM ROSTER
          </div>

          <div className="space-y-3">
            {activeTeammates && activeTeammates.length > 0 ? (
              activeTeammates.map((teammate) => {
                const targetUserId = teammate.user_id || teammate.id;
                const status = reviewStatus[targetUserId];
                const isSelected = teammate.id === selectedTeammateId;
                return (
                  <div
                    key={teammate.id}
                    onClick={() => {
                      setSelectedTeammateId(teammate.id);
                      setStatusMessage(null);
                    }}
                    className={`p-4 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-4 backdrop-blur-md ${
                      isSelected
                        ? 'border border-cyan-500 bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                        : 'border border-slate-800/80 bg-[#070e17] hover:bg-[#0a1320] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs uppercase transition-colors flex-shrink-0 ${
                        isSelected 
                          ? 'bg-[#00b4d8] border-cyan-400 text-slate-950' 
                          : 'bg-slate-800/40 border-slate-700 text-slate-400'
                      }`}>
                        {teammate.name ? teammate.name.slice(0, 2) : 'TM'}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">
                            {teammate.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                          {teammate.role}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      {status?.hasReviewed ? (
                        <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-slate-850 border border-slate-700 text-slate-400 uppercase tracking-wide">
                          CALIBRATED
                        </span>
                      ) : status?.isEligible ? (
                        <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-cyan-950 border border-cyan-500/50 text-cyan-300 uppercase tracking-wide">
                          READY
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-amber-950/40 border border-amber-500/30 text-amber-400 uppercase tracking-wide">
                          LOCKED
                        </span>
                      )}

                      {isSelected && (
                        <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-[#00b4d8] bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 mt-1">
                          Target
                          <ArrowRight className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-5 rounded-2xl border border-slate-300 dark:border-slate-800 border-dashed text-center bg-slate-50 dark:bg-[#121620]/20 space-y-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block uppercase">No Active Teammates Found</span>
                <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Rosters for {selectedTitle} are currently empty. Register players under the Roster Management workspace first to perform peer evaluations.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: EVALUATION PANEL (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="flex items-center justify-between text-xs font-mono font-bold tracking-wider">
            <div className="flex items-center gap-2 text-cyan-400 uppercase">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              EVALUATION PANEL
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {selectedTeammate && (
                <span className="px-2.5 py-0.5 text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 rounded-md">
                  EVALUATING TEAMMATE: {selectedTeammate.name} ({selectedTeammate.role})
                </span>
              )}
              <span className="px-2.5 py-0.5 text-[10px] text-rose-400 bg-rose-950/60 border border-rose-500/30 rounded-md uppercase">
                DOUBLE-BLIND ANONYMOUS
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className={cardClass}>
            
            {selectedTeammate && (
              <div className="mb-4 animate-in fade-in duration-150">
                {isCheckingCompletion ? (
                  <div className="bg-slate-900/50 border border-slate-850 text-slate-400 p-3.5 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-2 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-slate-455 animate-ping" />
                    Scanning Match History Lineups...
                  </div>
                ) : currentTargetStatus?.hasReviewed ? (
                  <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-[#0b131f] border border-slate-800 text-xs font-mono text-slate-400">
                    <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Review submitted for this teammate. Locked until next match is completed.</span>
                  </div>
                ) : !currentTargetStatus?.isEligible ? (
                  <div className="p-3 mb-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 font-mono text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400"/>
                    <span>No completed matches found with this teammate. Complete a scheduled event to unlock reviews.</span>
                  </div>
                ) : (
                  <div className="p-3 mb-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-mono text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400"/>
                    <span>ELIGIBLE EVENT: <strong>"{currentTargetStatus.eventName}"</strong> ({currentTargetStatus.eventType}) - Unlocked for calibration.</span>
                  </div>
                )}
              </div>
            )}

             {/* 1. COMMUNICATION QUALITY (YELLOW / AMBER THEME) */}
             <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-amber-500/20 hover:border-amber-500/40 transition">
               <div className="flex items-center justify-between mb-2">
                 <label className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"/>
                   Match Communication Quality
                 </label>
                 <span className="px-2.5 py-0.5 rounded font-mono text-xs font-bold bg-amber-950/80 border border-amber-500/40 text-amber-300">
                   {commScore} / 5 Stars
                 </span>
               </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={commScore}
                  onChange={(e) => setCommScore(Number(e.target.value))}
                  disabled={isLocked || isSubmitting}
                  className={`w-full h-3.5 rounded-lg appearance-none ${
                    isLocked ? 'opacity-40 cursor-not-allowed bg-slate-800' : 'cursor-pointer accent-amber-400'
                  }`}
                />
               <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                 <span>1 - Poor / Silent</span>
                 <span>3 - Standard Callouts</span>
                 <span>5 - Clear & Vocal</span>
               </div>
             </div>

             {/* 2. TEAMPLAY & COORDINATION (EMERALD / GREEN THEME) */}
             <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-emerald-500/20 hover:border-emerald-500/40 transition">
               <div className="flex items-center justify-between mb-2">
                 <label className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"/>
                   Teamplay & Tactical Coordination
                 </label>
                 <span className="px-2.5 py-0.5 rounded font-mono text-xs font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                   {relScore} / 5 Stars
                 </span>
               </div>
                 <input
                   type="range"
                   min="1"
                   max="5"
                   step="1"
                   value={relScore}
                   onChange={(e) => setRelScore(Number(e.target.value))}
                   disabled={isLocked || isSubmitting}
                   className={`w-full h-3.5 rounded-lg appearance-none ${
                     isLocked || isSubmitting ? 'opacity-40 cursor-not-allowed bg-slate-800' : 'cursor-pointer accent-emerald-400'
                   }`}
                 />
               <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                 <span>1 - Isolated Play</span>
                 <span>3 - Follows Strategy</span>
                 <span>5 - Synergized Team Player</span>
               </div>
             </div>

             {/* 3. MECHANICAL PRECISION & EXECUTION (CYAN THEME) */}
             <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-cyan-500/20 hover:border-cyan-500/40 transition">
               <div className="flex items-center justify-between mb-2">
                 <label className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"/>
                   Mechanical Precision & Execution
                 </label>
                 <span className="px-2.5 py-0.5 rounded font-mono text-xs font-bold bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                   {compScore} / 5 Stars
                 </span>
               </div>
                 <input
                   type="range"
                   min="1"
                   max="5"
                   step="1"
                   value={compScore}
                   onChange={(e) => setCompScore(Number(e.target.value))}
                   disabled={isLocked || isSubmitting}
                   className={`w-full h-3.5 rounded-lg appearance-none ${
                     isLocked || isSubmitting ? 'opacity-40 cursor-not-allowed bg-slate-800' : 'cursor-pointer accent-cyan-400'
                   }`}
                 />
               <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                 <span>1 - Inconsistent</span>
                 <span>3 - Solid Fundamentals</span>
                 <span>5 - Flawless Execution</span>
               </div>
             </div>

             {/* 4TH DIMENSION: STRATEGIC LEADERSHIP & SHOTCALLING */}
             <div className={`p-4 rounded-xl border transition-all ${
               isTargetIGL 
                 ? 'bg-[#08111e] dark:bg-slate-950/60 border-cyan-500/30 hover:border-cyan-500/50' 
                 : 'bg-[#060b13]/60 dark:bg-slate-900/40 border-slate-800/50 opacity-60'
             }`}>
               <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-2">
                   <span className={`w-2 h-2 rounded-full ${isTargetIGL ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse' : 'bg-slate-600'}`}></span>
                   <label className={`text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 ${isTargetIGL ? 'text-cyan-400' : 'text-slate-500'}`}>
                     Strategic Leadership & In-Game Shotcalling
                   </label>
                   {!isTargetIGL && (
                     <span className="px-2 py-0.5 text-[9px] font-mono text-slate-400 bg-slate-800/80 rounded border border-slate-700">
                       🔒 IGL ONLY
                     </span>
                   )}
                 </div>

                 <span className={`px-2.5 py-0.5 rounded font-mono text-xs font-bold ${
                   isTargetIGL 
                     ? 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-300' 
                     : 'bg-slate-800 border border-slate-700 text-slate-500'
                 }`}>
                   {isTargetIGL ? `${leadScore} / 5 Stars` : 'N/A'}
                 </span>
               </div>
               
               <input
                 type="range"
                 min="1"
                 max="5"
                 step="1"
                 disabled={!isTargetIGL || isLocked || isSubmitting}
                 value={isTargetIGL ? leadScore : 0}
                 onChange={(e) => setLeadScore(Number(e.target.value))}
                 className={`w-full h-3.5 rounded-lg appearance-none ${
                   isTargetIGL && !isLocked && !isSubmitting ? 'cursor-pointer accent-cyan-400' : 'opacity-40 cursor-not-allowed bg-slate-800'
                 }`}
               />

               <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                 <span>1 - Hesitant / Poor Macro</span>
                 <span>3 - Standard Calling</span>
                 <span>5 - Decisive Master Strategist</span>
               </div>
             </div>

            {/* Constructive Comments Textarea */}
            <div className="space-y-2">
              <label className="text-[9px] font-mono font-bold tracking-widest text-[#00b4d8] uppercase block">
                CONSTRUCTIVE TEAM REVIEW COMMENTS
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Submit performance feedback, tactical observations, or structural roster alignment recommendations."
                required
                disabled={isLocked || isSubmitting}
                className={`w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-4 text-xs text-slate-900 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-sans min-h-[100px] resize-none ${
                  isLocked || isSubmitting ? 'opacity-40 cursor-not-allowed' : ''
                }`}
              ></textarea>
            </div>

            {/* Submission Status Alerts */}
            {statusMessage && (
              <div
                className={`p-4 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed border ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Submission Button & Disclaimer Footer */}
            <div className="space-y-4 pt-2">
              <button
                type="submit"
                disabled={isLocked || isSubmitting || !selectedTeammateId}
                className={`w-full py-4 px-6 rounded-xl font-mono text-xs font-bold uppercase transition border-none cursor-pointer ${
                  isLocked
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-cyan-400 text-slate-950 hover:bg-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                }`}
              >
                {isSubmitting ? 'Calibrating...' : isLocked ? 'Evaluation Locked' : 'Submit Anonymous Review'}
              </button>

              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl text-[10px] font-mono leading-relaxed flex items-start gap-2.5">
                <span className="font-bold font-mono">!</span>
                <span>
                  Security Rule: Limited to 1 submission per teammate per tournament to prevent review manipulation.
                </span>
              </div>
            </div>

          </form>

        </div>

      </div>

    </div>
  );
};

export default PeerReviews;
