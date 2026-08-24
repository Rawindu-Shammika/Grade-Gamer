import React, { useMemo } from 'react';

export const SoftSkillCalibrationCard = ({ evaluations = [] }) => {
  // Aggregate averages across all game evaluations
  const aggregatedSkills = useMemo(() => {
    if (!evaluations || evaluations.length === 0) {
      return {
        communication: 4.0,
        teamplay: 3.0,
        mechanical: 5.0,
        leadership: null, // Default null if not rated
        composite: 4.0,
        totalSquads: 1,
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
      totalSquads: count,
    };
  }, [evaluations]);

  const hasLeadership = aggregatedSkills.leadership !== null;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800/90 bg-slate-50 dark:bg-slate-950/60 p-6 shadow-md dark:shadow-lg print-bg-white print-border-slate">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-6 print-border-slate">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="text-xs font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-mono print-text-dark">
            LATEST PEER EVALUATION & SOFT-SKILL CALIBRATION
          </h3>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono print-text-slate">
          VERIFIED VIA {aggregatedSkills.totalSquads} SQUAD EVALUATION{aggregatedSkills.totalSquads > 1 ? 'S' : ''}
        </span>
      </div>

      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Composite Score Card */}
        <div className="lg:col-span-3 flex flex-col items-start justify-center border-r-0 lg:border-r border-slate-200 dark:border-slate-800 pr-4 print-border-slate">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-cyan-600 dark:text-cyan-400 font-mono print-text-dark">{aggregatedSkills.composite.toFixed(1)}</span>
            <span className="text-xs text-slate-500 font-bold font-mono">/ 5.0</span>
          </div>
          <div className="flex gap-1 text-cyan-500 dark:text-cyan-400 my-1 text-xs">
            {'★'.repeat(Math.round(aggregatedSkills.composite))}
            {'☆'.repeat(5 - Math.round(aggregatedSkills.composite))}
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mt-1 font-mono print-text-slate">
            COMPOSITE TEAM INDEX
          </span>
        </div>

        {/* Skill Progress Bars (Dynamically adapts to 3 or 4 columns) */}
        <div className={`lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 ${hasLeadership ? 'xl:grid-cols-4' : 'xl:grid-cols-3'} gap-5`}>
          
          {/* Communication */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-bold font-mono">
              <span className="text-amber-500 dark:text-amber-400 uppercase tracking-wider print-text-dark">COMMUNICATION</span>
              <span className="text-slate-900 dark:text-white print-text-dark">{aggregatedSkills.communication.toFixed(1)} / 5.0</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden border border-amber-500/20 print-bg-white print-border-slate">
              <div
                className="h-full bg-amber-500 dark:bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${(aggregatedSkills.communication / 5.0) * 100}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-500 block uppercase font-mono print-text-slate">CLARITY & IN-MATCH CALLOUTS</span>
          </div>

          {/* Tactical Teamplay */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-bold font-mono">
              <span className="text-emerald-500 dark:text-emerald-400 uppercase tracking-wider print-text-dark">TACTICAL TEAMPLAY</span>
              <span className="text-slate-900 dark:text-white print-text-dark">{aggregatedSkills.teamplay.toFixed(1)} / 5.0</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden border border-emerald-500/20 print-bg-white print-border-slate">
              <div
                className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${(aggregatedSkills.teamplay / 5.0) * 100}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-500 block uppercase font-mono print-text-slate">SYNERGY & STRATEGY EXECUTION</span>
          </div>

          {/* Mechanical Execution */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-bold font-mono">
              <span className="text-cyan-600 dark:text-cyan-400 uppercase tracking-wider print-text-dark">MECHANICAL EXECUTION</span>
              <span className="text-slate-900 dark:text-white print-text-dark">{aggregatedSkills.mechanical.toFixed(1)} / 5.0</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden border border-cyan-500/20 print-bg-white print-border-slate">
              <div
                className="h-full bg-cyan-500 dark:bg-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${(aggregatedSkills.mechanical / 5.0) * 100}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-500 block uppercase font-mono print-text-slate">MICRO-PRECISION & CONSISTENCY</span>
          </div>

          {/* Dynamic 4th Bar: Strategic Leadership & Shotcalling */}
          {hasLeadership && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold font-mono">
                <span className="text-purple-500 dark:text-purple-400 uppercase tracking-wider print-text-dark">STRATEGIC LEADERSHIP</span>
                <span className="text-slate-900 dark:text-white print-text-dark">{aggregatedSkills.leadership.toFixed(1)} / 5.0</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden border border-purple-500/20 print-bg-white print-border-slate">
                <div
                  className="h-full bg-purple-500 dark:bg-purple-400 rounded-full transition-all duration-500"
                  style={{ width: `${(aggregatedSkills.leadership / 5.0) * 100}%` }}
                />
              </div>
              <span className="text-[9px] text-slate-500 block uppercase font-mono print-text-slate">IGL DECISION & SHOTCALLING</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SoftSkillCalibrationCard;
