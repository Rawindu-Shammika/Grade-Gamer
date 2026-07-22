import React, { useState } from 'react';
import usePeerReviews from '../hooks/usePeerReviews';
import { Star, ShieldAlert, CheckCircle, Users, Gamepad2, ArrowRight } from 'lucide-react';

const CATEGORY_MAP = {
  'Sim Racing': ['F1 Game Series', 'Assetto Corsa'],
  'FPS Shooters': ['Valorant', 'CS2'],
  'MOBA': ['Dota 2', 'League of Legends'],
  'Battle Royale': ['Apex Legends', 'PUBG'],
  'Sports Gaming': ['FC26']
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
      const currentTeammateName = selectedTeammate.name;

      setStatusMessage({
        type: 'success',
        text: `Review submitted for ${currentTeammateName}!`
      });

      // Clear form inputs
      setCommScore(8);
      setRelScore(8);
      setCompScore(8);
      setComments('');

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
  const headerAccent = 'border-l-4 border-cyan-500 pl-4 py-1';

  return (
    <div className="bg-[#0b0f19] min-h-screen text-slate-200 p-8 font-sans space-y-6 pt-28 pb-16 w-full max-w-7xl mx-auto">
      
      {/* Block 1: Header Block */}
      <div className={`space-y-1.5 ${headerAccent}`}>
        <span className="text-[10px] font-mono tracking-widest text-[#00b4d8] font-bold uppercase block">
          Evaluation Hub
        </span>
        <h1 className="text-3xl font-black uppercase text-white tracking-tight leading-none">
          360 Degree Teammate Reviews
        </h1>
        <p className="text-xs text-slate-400 font-medium">
          Zero Knowledge Encrypted Peer Validation Logs
        </p>
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
      <div className={cardClass}>
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
                    className={`p-5 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'border-2 border-cyan-500 bg-cyan-950/20 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                        : 'border border-slate-800 bg-[#161b26] hover:bg-slate-800/20'
                    }`}
                  >
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
