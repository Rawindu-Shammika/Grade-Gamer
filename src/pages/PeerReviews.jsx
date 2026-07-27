import React, { useState, useEffect, useCallback } from 'react';
import usePeerReviews from '../hooks/usePeerReviews';
import { Star, ShieldAlert, CheckCircle, Users, Gamepad2, ArrowRight } from 'lucide-react';
import { getUiImageUrl } from '../utils/supabaseAssets';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const cleanUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
const SUPABASE_UI_BASE = `${cleanUrl}/storage/v1/object/public/UI`;
const PEER_REVIEW_BANNERS = ['TEAM i.jpg', 'TEAM ii.png'];

const CATEGORY_MAP = {
  'Sim Racing': ['F1 25', 'Assetto Corsa'],
  'FPS Shooters': ['Valorant', 'CS2'],
  'MOBA': ['Dota 2', 'League of Legends'],
  'Battle Royale': ['Apex Legends', 'PUBG'],
  'Sports Gaming': ['FC26']
};

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
    activeCategory,
    setActiveCategory,
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

  // Form input states
  const [commScore, setCommScore] = useState(8);
  const [relScore, setRelScore] = useState(8);
  const [compScore, setCompScore] = useState(8);
  const [comments, setComments] = useState('');

  // UI state feedback
  const [statusMessage, setStatusMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle chips category clicks
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setSelectedTitle(CATEGORY_MAP[category][0]);
    setStatusMessage(null);
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeammateId || !selectedTeammate) {
      setStatusMessage({ type: 'error', text: 'Select a teammate from the active roster first.' });
      return;
    }

    if (reviewedTeammateIds.has(String(selectedTeammate.user_id))) {
      setStatusMessage({ type: 'error', text: 'You have already submitted a review for this teammate in this game title.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const result = await submitTeammateReview({
      target_user_id: selectedTeammateId,
      communication_score: commScore,
      reliability_score: relScore,
      composure_score: compScore,
      constructive_comment: comments
    });

    setIsSubmitting(false);

    if (result.success) {
      setStatusMessage({
        type: 'success',
        text: `Peer evaluation for ${selectedTeammate.name} uploaded successfully.`
      });
      setComments('');
      setCommScore(8);
      setRelScore(8);
      setCompScore(8);

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

  const cardClass = 'bg-[#121620] border border-slate-800 p-6 md:p-8 rounded-2xl shadow-xl space-y-6 relative overflow-hidden';

  return (
    <div className="bg-[#0b0f19] min-h-screen text-slate-200 p-8 font-sans space-y-6 pt-28 pb-16 w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16">
      
      {/* High-tech Backdrop Hero Banner */}
      <div 
        onClick={handleNextBanner}
        className="relative w-full min-h-[320px] md:min-h-[400px] rounded-3xl overflow-hidden border border-cyan-500/30 bg-[#111622] shadow-2xl cursor-pointer group mb-8 select-none transition-all hover:border-cyan-400/60"
      >
        {/* Animated Background Banner with Top-Focused Framing */}
        {PEER_REVIEW_BANNERS.map((banner, index) => (
          <div 
            key={banner}
            className={`absolute inset-0 bg-cover bg-[center_top_15%] transition-all duration-1000 ease-in-out pointer-events-none transform group-hover:scale-102 ${
              index === bannerIndex ? 'opacity-50 scale-100' : 'opacity-0 scale-105'
            }`}
            style={{ backgroundImage: `url(${SUPABASE_UI_BASE}/${encodeURIComponent(banner)})` }}
          />
        ))}

        {/* High-Contrast Cyber Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#111622]/90 via-[#111622]/60 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111622] via-transparent to-transparent pointer-events-none" />

        {/* Overlay Content & Controls */}
        <div className="relative z-10 h-full p-6 md:p-10 flex flex-col justify-between pointer-events-none min-h-[320px] md:min-h-[400px]">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              EVALUATION HUB
            </span>

          </div>

          <div className="mt-auto pt-8">
            <h2 className="text-2xl md:text-4xl font-black text-white tracking-wide uppercase drop-shadow-lg">
              360 Degree Teammate Reviews
            </h2>
            <p className="text-xs md:text-sm text-slate-200 mt-1.5 max-w-xl drop-shadow-md">
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

      {/* Block 2: Genre Filter Chips */}
      <div className="flex flex-wrap items-center gap-3 bg-[#121620]/40 border border-slate-800/80 p-3 rounded-2xl">
        {Object.keys(CATEGORY_MAP).map((genre) => {
          const isActive = activeCategory === genre;
          return (
            <button
              key={genre}
              onClick={() => handleCategoryChange(genre)}
              className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer border-none ${
                isActive 
                  ? 'bg-[#00b4d8] text-slate-950 shadow-md shadow-cyan-500/10' 
                  : 'border border-slate-800 bg-[#121620]/30 text-slate-400 hover:text-white hover:bg-slate-800/20'
              }`}
            >
              {genre}
            </button>
          );
        })}
      </div>

      {/* Block 3: Category Selector Dropdown */}
      <div className="flex flex-col space-y-2">
        <label className="text-[9px] font-mono font-bold tracking-widest text-[#00b4d8] uppercase">
          SELECT ACTIVE ESPORTS TITLE
        </label>
        <select
          value={selectedTitle}
          onChange={(e) => setSelectedTitle(e.target.value)}
          className="w-full max-w-md bg-[#121620] border border-slate-800 text-slate-200 rounded-xl px-4 py-3.5 text-xs font-mono uppercase tracking-wide focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
        >
          {CATEGORY_MAP[activeCategory].map((title) => (
            <option key={title} value={title}>
              {title}
            </option>
          ))}
        </select>
      </div>

      {/* Block 4: Rating Metric Tracker Card */}
      {(() => {
        const art = GAME_ART_MAP[selectedTitle] || {
          banner: 'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?auto=format&fit=crop&w=800&q=80',
          icon: 'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?auto=format&fit=crop&w=150&h=150&q=80',
          genre: 'Competitive eSports'
        };
        return (
          <div className="relative overflow-hidden bg-[#121620]/60 border border-slate-800 p-6 md:p-8 rounded-2xl shadow-xl space-y-6 group hover:border-cyan-500/50 transition-all duration-300 backdrop-blur-md">
            {/* Background Game Art Layer */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-5 group-hover:opacity-15 transition-opacity duration-300 pointer-events-none" 
              style={{ backgroundImage: `url(${art.banner})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#121620] via-[#121620]/95 to-transparent pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-5">
                {/* Huge score indicator */}
                <div className="text-4xl font-black text-white font-mono tracking-tight flex items-baseline gap-0.5">
                  <span>{overallRating}</span>
                  <span className="text-xs text-slate-500 font-semibold uppercase">/5.0</span>
                </div>
                
                {/* Teal Stars */}
                <div className="flex items-center gap-1 text-[#00b4d8]">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 fill-current ${
                        i < Math.floor(overallRating) ? 'text-[#00b4d8]' : 'text-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Unlocked Skill Badge */}
              <div className="flex-shrink-0">
                <span className="bg-cyan-500/10 border border-cyan-500/20 text-[#00b4d8] px-3.5 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Verified Soft Skill Unlocked: Precision Composure under Race Conditions
                </span>
              </div>
            </div>
            
            {/* Decorative background grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#00b4d805_1px,transparent_1px),linear-gradient(to_bottom,#00b4d805_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
          </div>
        );
      })()}

      {/* Block 5: Workspace Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Active Team Roster */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#00b4d8]" />
            <h3 className="text-xs font-black uppercase tracking-widest text-[#00b4d8] font-mono">
              Active Team Roster
            </h3>
          </div>

          <div className="space-y-3">
            {activeTeammates && activeTeammates.length > 0 ? (
              activeTeammates.map((teammate) => {
                const isSelected = teammate.id === selectedTeammateId;
                const isReviewed = reviewedTeammateIds.has(String(teammate.user_id));
                return (
                  <div
                    key={teammate.id}
                    onClick={() => {
                      setSelectedTeammateId(teammate.id);
                      setStatusMessage(null);
                    }}
                    className={`p-5 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-4 backdrop-blur-md ${
                      isSelected
                        ? 'border-2 border-cyan-500 bg-cyan-950/20 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                        : 'border border-slate-800 bg-[#161b26]/60 hover:bg-slate-800/20'
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
                          <span className="text-xs font-black text-white uppercase tracking-wide">
                            {teammate.name}
                          </span>
                          {isReviewed && (
                            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider flex items-center gap-1">
                              <CheckCircle className="w-2.5 h-2.5" />
                              REVIEWED
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                          {teammate.role}
                        </span>
                      </div>
                    </div>
                    
                    {isSelected ? (
                      <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#00b4d8] bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                        Target Subject
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500 block">
                        Select
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-5 rounded-2xl border border-slate-800 border-dashed text-center bg-[#121620]/20 space-y-2">
                <span className="text-xs font-bold text-slate-400 block uppercase">No Active Teammates Found</span>
                <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Rosters for {selectedTitle} are currently empty. Register players under the Roster Management workspace first to perform peer evaluations.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Anti Abuse Evaluation Form */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121620]/40 border border-slate-800/80 p-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-[#00b4d8]" />
              <h3 className="text-xs font-black uppercase tracking-widest text-[#00b4d8] font-mono">
                Evaluation Panel
              </h3>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {selectedTeammate && (
                <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-1 rounded-lg">
                  EVALUATING TEAMMATE: <span className="text-white uppercase">{selectedTeammate.name}</span> ({selectedTeammate.role})
                </span>
              )}
              <span className="bg-red-500/10 border border-red-500/20 text-red-400 px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase tracking-widest">
                Double Blind Anonymous
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className={cardClass}>
            
            {/* Range Slider 1: Match Communication Quality */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-300 uppercase tracking-wide">Match Communication Quality</span>
                <span className="font-mono text-[#00b4d8] bg-cyan-950/20 px-2 py-0.5 rounded border border-cyan-500/20">
                  {commScore} Score
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={commScore}
                onChange={(e) => setCommScore(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-[#00b4d8]"
              />
            </div>

            {/* Range Slider 2: Team Reliability and Coordination */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-300 uppercase tracking-wide">Team Reliability and Coordination</span>
                <span className="font-mono text-[#00b4d8] bg-cyan-950/20 px-2 py-0.5 rounded border border-cyan-500/20">
                  {relScore} Score
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={relScore}
                onChange={(e) => setRelScore(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-[#00b4d8]"
              />
            </div>

            {/* Range Slider 3: Composure Under Pressure */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-300 uppercase tracking-wide">Composure Under Pressure</span>
                <span className="font-mono text-[#00b4d8] bg-cyan-950/20 px-2 py-0.5 rounded border border-cyan-500/20">
                  {compScore} Score
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={compScore}
                onChange={(e) => setCompScore(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-[#00b4d8]"
              />
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-sans min-h-[100px] resize-none"
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
                disabled={isSubmitting || !selectedTeammateId || (selectedTeammate && reviewedTeammateIds.has(String(selectedTeammate.user_id)))}
                className="w-full bg-[#00b4d8] hover:bg-[#0096c7] disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-black py-4 px-6 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md cursor-pointer border-none"
              >
                {isSubmitting
                  ? 'Uploading encrypted review...'
                  : selectedTeammate && reviewedTeammateIds.has(String(selectedTeammate.user_id))
                    ? 'ALREADY REVIEWED'
                    : 'SUBMIT ANONYMOUS REVIEW'}
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
