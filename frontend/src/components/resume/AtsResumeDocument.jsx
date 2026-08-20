import React, { useMemo } from 'react';

export const AtsResumeDocument = ({
  profile = {},
  gameStats = {},
  peerEvaluations = {},
  tournaments = [],
  education = [],
  techStack = [],
  softSkills = [],
  verificationHash = '0x77FA...3184',
  sha256Id = '31f9d50105120593efbb5ea7e31c890...',
}) => {
  const GAME_METADATA = {
    valorant: { label: 'VALORANT', statKey: 'valorant' },
    cs2: { label: 'COUNTER-STRIKE 2', statKey: 'cs2' },
    'counter-strike 2': { label: 'COUNTER-STRIKE 2', statKey: 'cs2' },
    counter_strike_2: { label: 'COUNTER-STRIKE 2', statKey: 'cs2' },
    assetto_corsa: { label: 'ASSETTO CORSA', statKey: 'assettoCorsa' },
    assettocorsa: { label: 'ASSETTO CORSA', statKey: 'assettoCorsa' },
    f1_25: { label: 'F1 25', statKey: 'f1_25' },
    f125: { label: 'F1 25', statKey: 'f1_25' },
  };

  // 1. Resolve registered games dynamically
  const registeredGameKeys = useMemo(() => {
    if (Array.isArray(profile?.esports_titles) && profile.esports_titles.length > 0) {
      return profile.esports_titles.map((g) => g.toLowerCase().trim().replace(/[\s-]/g, '_'));
    }
    if (Array.isArray(profile?.registered_games) && profile.registered_games.length > 0) {
      return profile.registered_games.map((g) => g.toLowerCase().trim().replace(/[\s-]/g, '_'));
    }
    if (profile?.primary_game) {
      return [profile.primary_game.toLowerCase().trim().replace(/[\s-]/g, '_')];
    }
    return Object.keys(gameStats).filter((key) => {
      const g = gameStats[key];
      return Number(g?.hours || 0) > 0 || Number(g?.matches || 0) > 0;
    });
  }, [profile, gameStats]);

  // 2. Playtime Cards for registered games only
  const registeredGameCards = useMemo(() => {
    return registeredGameKeys.map((key) => {
      const meta = GAME_METADATA[key] || { label: key.toUpperCase().replace(/_/g, ' '), statKey: key };
      const stat = gameStats[meta.statKey] || gameStats[key] || gameStats[meta.label] || {};
      const hours = Number(stat?.hours || 0);

      return {
        key,
        label: meta.label,
        hoursText: hours > 0 ? `${hours.toFixed(1)} Hours` : '0.0+ Hours',
      };
    });
  }, [registeredGameKeys, gameStats]);

  // 3. Slope Cards for active registered games (ignoring 0 slopes)
  const activeSlopeCards = useMemo(() => {
    const valid = [];
    registeredGameKeys.forEach((key) => {
      const meta = GAME_METADATA[key] || { label: key.toUpperCase().replace(/_/g, ' '), statKey: key };
      const stat = gameStats[meta.statKey] || gameStats[key] || gameStats[meta.label] || {};
      const slope = typeof stat?.slope === 'number' ? stat.slope : parseFloat(stat?.slope || 0);
      const matches = Number(stat?.matches || 0);

      if (!isNaN(slope) && slope !== 0) {
        const isPositive = slope > 0;
        valid.push({
          key,
          label: meta.label,
          matches,
          formattedText: isPositive ? `+${slope.toFixed(2)} Growth` : `${slope.toFixed(2)} Growth`,
          colorClass: isPositive ? 'text-emerald-700' : 'text-rose-700',
        });
      }
    });
    return valid;
  }, [registeredGameKeys, gameStats]);

  // 4. Soft Skills & Peer Ratings
  const compositeScore = (peerEvaluations?.composite || 4.0).toFixed(1);
  const commScore = (peerEvaluations?.communication || 4.0).toFixed(1);
  const teamScore = (peerEvaluations?.teamplay || 3.0).toFixed(1);
  const mechScore = (peerEvaluations?.mechanical || 5.0).toFixed(1);
  const leadScore = peerEvaluations?.leadership ? Number(peerEvaluations.leadership).toFixed(1) : null;

  return (
    <div id="printable-ats-resume" className="w-[800px] min-h-[1050px] bg-white text-slate-900 p-10 font-sans text-xs leading-relaxed shadow-lg mx-auto border border-slate-200 rounded-xl my-6">
      
      {/* 1. HEADER SECTION */}
      <div className="flex justify-between items-start border-b border-slate-200 pb-5 mb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
            {profile.full_name || profile.username || profile.name || 'BUDHDHIKA JAYATHILAKA'}
          </h1>
          <p className="text-xs font-bold text-cyan-700 tracking-wide mt-0.5 font-mono">
            ESPORTS COMPETITOR ({profile.primary_game || 'Valorant'}) | IGN: {profile.valorant_ign || profile.ign || 'Stiffer'} | ID: {profile.gradegamer_id || 'GG-366948'}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600 mt-2 font-mono">
            <span>{profile.email || 'player@gradegamer.edu'}</span>
            <span>•</span>
            <span>{profile.phone || '+94 7X XXX XXXX'}</span>
            <span>•</span>
            <span>{profile.location || 'Negombo, Sri Lanka'}</span>
            <span>•</span>
            <span className="text-cyan-700 font-semibold">{`gradegamer.edu/${profile.gradegamer_id || 'GG-366948'}`}</span>
          </div>
        </div>

        {/* Dynamic Verification Hash Badge */}
        <div className="border border-emerald-500/40 bg-emerald-50 rounded-lg p-2.5 text-right font-mono">
          <span className="text-[9px] font-bold text-emerald-800 uppercase block tracking-wider">VERIFICATION HASH</span>
          <span className="text-xs font-black text-slate-800 block mt-0.5">{profile.verification_hash || verificationHash}</span>
          <span className="text-[9px] text-emerald-700 font-semibold block mt-0.5">
            Calibrated: Live Delta {activeSlopeCards[0]?.formattedText.split(' ')[0] || '+0%'}
          </span>
        </div>
      </div>

      {/* 2. PROFESSIONAL SUMMARY */}
      <div className="mb-5">
        <h2 className="text-xs font-black uppercase tracking-wider text-cyan-800 border-b border-slate-200 pb-1 mb-2 font-mono">
          PROFESSIONAL SUMMARY & CALIBRATION
        </h2>
        <p className="text-slate-700 leading-normal text-[11px]">
          {profile.bio || profile.professional_summary ||
            'Applying raw competitive telemetry from eSports practice and leadership to verify corporate soft skills. Proven capabilities in data analysis, cross-functional leadership under stress, and workload management validated through platform mathematics.'}
        </p>
      </div>

      {/* 3. DYNAMIC REGISTERED ESPORTS TELEMETRY METRICS */}
      <div className="mb-5">
        <h2 className="text-xs font-black uppercase tracking-wider text-cyan-800 border-b border-slate-200 pb-1 mb-3 font-mono">
          ESPORTS COMPETITIVE TELEMETRY & PERFORMANCE METRICS
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {/* Dynamic Playtime Cards (Registered Games Only) */}
          {registeredGameCards.map((game) => (
            <div key={`resume-hours-${game.key}`} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
              <span className="text-[9px] font-bold text-slate-500 uppercase block font-mono">{game.label}</span>
              <span className="text-lg font-black text-slate-900 block mt-1 font-mono">{game.hoursText}</span>
              <span className="text-[9px] text-slate-500 block mt-1">Act Calibrated Telemetry</span>
            </div>
          ))}

          {/* Dynamic Active Linear Growth Slope Cards */}
          {activeSlopeCards.length > 0 ? (
            activeSlopeCards.map((slopeCard) => (
              <div key={`resume-slope-${slopeCard.key}`} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <span className="text-[9px] font-bold text-slate-500 uppercase block font-mono">
                  LCC SLOPE COEFFICIENT ({slopeCard.label})
                </span>
                <span className={`text-lg font-black block mt-1 font-mono ${slopeCard.colorClass}`}>
                  {slopeCard.formattedText}
                </span>
                <span className="text-[9px] text-slate-500 block mt-1">
                  Calibrated via {slopeCard.matches} matches
                </span>
              </div>
            ))
          ) : (
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
              <span className="text-[9px] font-bold text-slate-500 uppercase block font-mono">LCC SLOPE COEFFICIENT</span>
              <span className="text-lg font-black text-slate-400 block mt-1 font-mono">Pending</span>
              <span className="text-[9px] text-slate-500 block mt-1">Awaiting calibrated matches</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. PEER EVALUATION & SOFT-SKILL CALIBRATION */}
      <div className="mb-5 font-mono">
        <h2 className="text-xs font-black uppercase tracking-wider text-cyan-800 border-b border-slate-200 pb-1 mb-3">
          LATEST PEER EVALUATION & SOFT-SKILL CALIBRATION
        </h2>
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex items-center gap-6">
          <div className="text-center pr-6 border-r border-slate-200">
            <span className="text-2xl font-black text-slate-900 block">{compositeScore} / 5.0</span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mt-0.5">COMPOSITE INDEX</span>
          </div>
          <div className={`flex-1 grid gap-4 ${leadScore ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <div>
              <div className="flex justify-between text-[10px] font-bold text-slate-700 mb-1">
                <span>COMMUNICATION</span>
                <span>{commScore}/5.0</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(parseFloat(commScore) / 5) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-bold text-slate-700 mb-1">
                <span>TEAMPLAY</span>
                <span>{teamScore}/5.0</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(parseFloat(teamScore) / 5) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-bold text-slate-700 mb-1">
                <span>MECHANICAL</span>
                <span>{mechScore}/5.0</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-600 rounded-full" style={{ width: `${(parseFloat(mechScore) / 5) * 100}%` }} />
              </div>
            </div>
            {leadScore && (
              <div>
                <div className="flex justify-between text-[10px] font-bold text-slate-700 mb-1">
                  <span>LEADERSHIP</span>
                  <span>{leadScore}/5.0</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(parseFloat(leadScore) / 5) * 100}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. TOURNAMENTS & EDUCATION */}
      <div className="grid grid-cols-2 gap-6 mb-5">
        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-cyan-800 border-b border-slate-200 pb-1 mb-2 font-mono">
            TOURNAMENT RECORDS & PLACEMENTS
          </h2>
          <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-1">
            {tournaments && tournaments.length > 0 ? (
              tournaments.map((t, idx) => (
                <li key={idx}>{typeof t === 'string' ? t : `${t.placement || 'Participant'} - ${t.tournament_name || t.name} (${t.year || '2025'})`}</li>
              ))
            ) : (
              <li className="text-slate-400">No tournament records logged</li>
            )}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-cyan-800 border-b border-slate-200 pb-1 mb-2 font-mono">
            EDUCATION & CREDENTIALS
          </h2>
          <div className="text-[11px] text-slate-700 space-y-2 font-mono">
            {education && education.length > 0 ? (
              education.map((edu, idx) => (
                <div key={idx}>
                  <p className="font-bold text-slate-900 uppercase">{edu.degree || edu.title || 'Degree'}</p>
                  <p className="text-slate-500">{edu.institution || 'Institution'} ({edu.year || 'Present'})</p>
                </div>
              ))
            ) : (
              <>
                <div>
                  <p className="font-bold text-slate-900 uppercase">BSc (Hons) in Computer Science</p>
                  <p className="text-slate-500">SLIIT City University (2023 - Present)</p>
                </div>
                <div>
                  <p className="font-bold text-slate-900 uppercase">Esports Analytics & Telemetry Certification</p>
                  <p className="text-slate-500">GradeGamer Verified Platform Accreditation (2025)</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 6. TECH STACK & VERIFIABLE SOFT SKILLS */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-cyan-800 border-b border-slate-200 pb-1 mb-2 font-mono">
            TECHNICAL & GAMING STACK
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {(techStack && techStack.length > 0
              ? techStack
              : ['MoTeC i2 Pro', 'F1 Telemetry Tool', 'Fanatec DD2', 'Gamer Dashboard SDK', 'TailwindCSS', 'Supabase API']
            ).map((tool, idx) => (
              <span key={idx} className="border border-slate-300 rounded px-2 py-0.5 text-[10px] text-slate-700 bg-slate-50 font-medium font-mono">
                {typeof tool === 'string' ? tool : tool.name}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-cyan-800 border-b border-slate-200 pb-1 mb-2 font-mono">
            VERIFIABLE SOFT SKILLS MAPPED
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {(softSkills && softSkills.length > 0
              ? softSkills
              : ['Cross-Functional Leadership (IGL)', 'Data-Driven Decision Making', 'Crisis Management under Stress', 'Strategic Resource Allocation']
            ).map((skill, idx) => (
              <span key={idx} className="border border-emerald-300 bg-emerald-50 text-emerald-800 rounded px-2 py-0.5 text-[10px] font-medium font-mono">
                {typeof skill === 'string' ? skill : skill.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 7. FOOTER */}
      <div className="flex justify-between items-center border-t border-slate-200 pt-3 text-[10px] text-slate-400 font-mono">
        <span>SHA-256 ID: {profile.sha256_id || sha256Id}</span>
        <span>Verified at GradeGamer Telemetry Network</span>
      </div>

    </div>
  );
};

export default AtsResumeDocument;
