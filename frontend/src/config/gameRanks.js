export const GAME_RANK_CONFIGS = {
  'Valorant': {
    unit: 'RR',
    metricLabel: 'RANK RATING',
    defaultElo: '248',
    ranks: [
      { name: 'Radiant', color: 'text-amber-300', borderColor: 'border-amber-400', bgColor: 'bg-amber-950/40', glowColor: 'rgba(251,191,36,0.3)', percentile: 'Top 0.03%' },
      { name: 'Immortal', color: 'text-rose-500', borderColor: 'border-rose-500', bgColor: 'bg-rose-950/40', glowColor: 'rgba(244,63,94,0.3)', percentile: 'Top 1.2%' },
      { name: 'Ascendant', color: 'text-emerald-400', borderColor: 'border-emerald-500', bgColor: 'bg-emerald-950/40', glowColor: 'rgba(52,211,153,0.3)', percentile: 'Top 4.8%' },
      { name: 'Diamond', color: 'text-purple-400', borderColor: 'border-purple-500', bgColor: 'bg-purple-950/40', glowColor: 'rgba(192,132,252,0.3)', percentile: 'Top 12%' },
      { name: 'Platinum', color: 'text-cyan-400', borderColor: 'border-cyan-500', bgColor: 'bg-cyan-950/40', glowColor: 'rgba(6,182,212,0.3)', percentile: 'Top 25%' },
      { name: 'Gold', color: 'text-yellow-400', borderColor: 'border-yellow-500', bgColor: 'bg-yellow-950/40', glowColor: 'rgba(250,204,21,0.3)', percentile: 'Top 45%' },
      { name: 'Silver', color: 'text-slate-300', borderColor: 'border-slate-400', bgColor: 'bg-slate-900', glowColor: 'rgba(148,163,184,0.2)', percentile: 'Top 65%' },
      { name: 'Bronze', color: 'text-amber-700', borderColor: 'border-amber-700', bgColor: 'bg-amber-950/30', glowColor: 'rgba(180,83,9,0.2)', percentile: 'Top 85%' },
      { name: 'Iron', color: 'text-zinc-500', borderColor: 'border-zinc-700', bgColor: 'bg-zinc-950', glowColor: 'rgba(113,113,122,0.2)', percentile: 'Bottom 15%' },
    ]
  },
  'Counter-Strike 2': {
    unit: 'Rating',
    metricLabel: 'PREMIER CS RATING',
    defaultElo: '19,450',
    ranks: [
      { name: '30,000+ (Gold)', color: 'text-amber-300', borderColor: 'border-amber-400', bgColor: 'bg-amber-950/50', glowColor: 'rgba(252,211,77,0.4)', percentile: 'World Elite' },
      { name: '25,000 - 29,999 (Red)', color: 'text-red-500', borderColor: 'border-red-500', bgColor: 'bg-red-950/50', glowColor: 'rgba(239,68,68,0.35)', percentile: 'Top 1%' },
      { name: '20,000 - 24,999 (Pink)', color: 'text-pink-400', borderColor: 'border-pink-500', bgColor: 'bg-pink-950/40', glowColor: 'rgba(244,114,182,0.3)', percentile: 'Top 5%' },
      { name: '15,000 - 19,999 (Purple)', color: 'text-purple-400', borderColor: 'border-purple-500', bgColor: 'bg-purple-950/40', glowColor: 'rgba(168,85,247,0.3)', percentile: 'Top 15%' },
      { name: '10,000 - 14,999 (Blue)', color: 'text-blue-400', borderColor: 'border-blue-500', bgColor: 'bg-blue-950/40', glowColor: 'rgba(96,165,250,0.3)', percentile: 'Top 35%' },
      { name: '5,000 - 9,999 (Cyan)', color: 'text-cyan-300', borderColor: 'border-cyan-400', bgColor: 'bg-cyan-950/30', glowColor: 'rgba(34,211,238,0.2)', percentile: 'Top 60%' },
      { name: '1,000 - 4,999 (Grey)', color: 'text-slate-400', borderColor: 'border-slate-600', bgColor: 'bg-slate-900', glowColor: 'rgba(148,163,184,0.2)', percentile: 'Novice' },
    ]
  },
  'Assetto Corsa': {
    unit: 'SR / Skill',
    metricLabel: 'TELEMETRY PRECISION RATING',
    defaultElo: '98.4%',
    ranks: [
      { name: 'Alien (Tier 1)', color: 'text-cyan-300', borderColor: 'border-cyan-400', bgColor: 'bg-cyan-950/50', glowColor: 'rgba(6,182,212,0.4)', percentile: 'Top 0.1% Esports' },
      { name: 'Pro Driver', color: 'text-emerald-400', borderColor: 'border-emerald-500', bgColor: 'bg-emerald-950/40', glowColor: 'rgba(52,211,153,0.3)', percentile: 'Top 2%' },
      { name: 'Pro-Am Semi-Pro', color: 'text-amber-400', borderColor: 'border-amber-500', bgColor: 'bg-amber-950/40', glowColor: 'rgba(251,191,36,0.3)', percentile: 'Top 10%' },
      { name: 'Clubman Licensed', color: 'text-blue-400', borderColor: 'border-blue-500', bgColor: 'bg-blue-950/30', glowColor: 'rgba(96,165,250,0.25)', percentile: 'Top 30%' },
      { name: 'Rookie Driver', color: 'text-slate-400', borderColor: 'border-slate-600', bgColor: 'bg-slate-900', glowColor: 'rgba(148,163,184,0.2)', percentile: 'Paddock Entry' },
    ]
  },
  'F1 25': {
    unit: 'DR / Safety',
    metricLabel: 'SUPER LICENSE STANDING',
    defaultElo: 'A / 2,850',
    ranks: [
      { name: 'Esports Elite Tier', color: 'text-red-400', borderColor: 'border-red-500', bgColor: 'bg-red-950/50', glowColor: 'rgba(248,113,113,0.4)', percentile: 'Division I' },
      { name: 'Platinum License', color: 'text-cyan-300', borderColor: 'border-cyan-400', bgColor: 'bg-cyan-950/40', glowColor: 'rgba(6,182,212,0.3)', percentile: 'Division II' },
      { name: 'Gold Tier', color: 'text-yellow-400', borderColor: 'border-yellow-500', bgColor: 'bg-yellow-950/40', glowColor: 'rgba(250,204,21,0.3)', percentile: 'Division III' },
      { name: 'Silver Tier', color: 'text-slate-300', borderColor: 'border-slate-400', bgColor: 'bg-slate-900', glowColor: 'rgba(148,163,184,0.2)', percentile: 'Division IV' },
      { name: 'Bronze Tier', color: 'text-amber-700', borderColor: 'border-amber-700', bgColor: 'bg-amber-950/30', glowColor: 'rgba(180,83,9,0.2)', percentile: 'Division V' },
    ]
  },
  'Dota 2': {
    unit: 'MMR',
    metricLabel: 'COMPETITIVE MMR',
    defaultElo: '6,420',
    ranks: [
      { name: 'Immortal (Numbered)', color: 'text-amber-300', borderColor: 'border-amber-400', bgColor: 'bg-amber-950/50', glowColor: 'rgba(251,191,36,0.4)', percentile: 'Top 1%' },
      { name: 'Divine', color: 'text-purple-400', borderColor: 'border-purple-500', bgColor: 'bg-purple-950/40', glowColor: 'rgba(192,132,252,0.3)', percentile: 'Top 5%' },
      { name: 'Ancient', color: 'text-blue-400', borderColor: 'border-blue-500', bgColor: 'bg-blue-950/40', glowColor: 'rgba(96,165,250,0.3)', percentile: 'Top 15%' },
      { name: 'Legend', color: 'text-emerald-400', borderColor: 'border-emerald-500', bgColor: 'bg-emerald-950/40', glowColor: 'rgba(52,211,153,0.3)', percentile: 'Top 30%' },
      { name: 'Archon', color: 'text-cyan-400', borderColor: 'border-cyan-500', bgColor: 'bg-cyan-950/30', glowColor: 'rgba(6,182,212,0.25)', percentile: 'Top 50%' },
      { name: 'Crusader', color: 'text-yellow-500', borderColor: 'border-yellow-600', bgColor: 'bg-yellow-950/30', glowColor: 'rgba(234,179,8,0.2)', percentile: 'Top 70%' },
      { name: 'Guardian / Herald', color: 'text-slate-400', borderColor: 'border-slate-700', bgColor: 'bg-slate-900', glowColor: 'rgba(148,163,184,0.2)', percentile: 'Lower Bracket' },
    ]
  },
  'League of Legends': {
    unit: 'LP',
    metricLabel: 'LEAGUE POINTS (LP)',
    defaultElo: '350',
    ranks: [
      { name: 'Challenger', color: 'text-amber-300', borderColor: 'border-amber-400', bgColor: 'bg-amber-950/50', glowColor: 'rgba(251,191,36,0.4)', percentile: 'Top 300' },
      { name: 'Grandmaster', color: 'text-red-500', borderColor: 'border-red-500', bgColor: 'bg-red-950/40', glowColor: 'rgba(239,68,68,0.35)', percentile: 'Top 0.1%' },
      { name: 'Master', color: 'text-purple-400', borderColor: 'border-purple-500', bgColor: 'bg-purple-950/40', glowColor: 'rgba(192,132,252,0.3)', percentile: 'Top 1%' },
      { name: 'Diamond', color: 'text-cyan-400', borderColor: 'border-cyan-500', bgColor: 'bg-cyan-950/40', glowColor: 'rgba(6,182,212,0.3)', percentile: 'Top 4%' },
      { name: 'Emerald', color: 'text-emerald-400', borderColor: 'border-emerald-500', bgColor: 'bg-emerald-950/40', glowColor: 'rgba(52,211,153,0.3)', percentile: 'Top 12%' },
      { name: 'Platinum / Gold', color: 'text-yellow-400', borderColor: 'border-yellow-500', bgColor: 'bg-yellow-950/30', glowColor: 'rgba(250,204,21,0.25)', percentile: 'Top 35%' },
      { name: 'Silver / Bronze', color: 'text-slate-400', borderColor: 'border-slate-600', bgColor: 'bg-slate-900', glowColor: 'rgba(148,163,184,0.2)', percentile: 'Mid Bracket' },
    ]
  },
  'Apex Legends': {
    unit: 'RP',
    metricLabel: 'RANKED POINTS',
    defaultElo: '15,200',
    ranks: [
      { name: 'Apex Predator', color: 'text-red-500', borderColor: 'border-red-500', bgColor: 'bg-red-950/50', glowColor: 'rgba(239,68,68,0.4)', percentile: 'Top 750' },
      { name: 'Master', color: 'text-purple-400', borderColor: 'border-purple-500', bgColor: 'bg-purple-950/40', glowColor: 'rgba(192,132,252,0.3)', percentile: 'Top 1%' },
      { name: 'Diamond', color: 'text-cyan-400', borderColor: 'border-cyan-500', bgColor: 'bg-cyan-950/40', glowColor: 'rgba(6,182,212,0.3)', percentile: 'Top 6%' },
      { name: 'Platinum', color: 'text-blue-400', borderColor: 'border-blue-500', bgColor: 'bg-blue-950/30', glowColor: 'rgba(96,165,250,0.25)', percentile: 'Top 20%' },
      { name: 'Gold / Silver', color: 'text-yellow-400', borderColor: 'border-yellow-500', bgColor: 'bg-yellow-950/30', glowColor: 'rgba(250,204,21,0.2)', percentile: 'Top 50%' },
    ]
  },
  'Rainbow Six Siege': {
    unit: 'RP',
    metricLabel: 'RANKED POINTS',
    defaultElo: '4,650',
    ranks: [
      { name: 'Champions', color: 'text-pink-400', borderColor: 'border-pink-500', bgColor: 'bg-pink-950/50', glowColor: 'rgba(244,114,182,0.4)', percentile: 'Top 0.5%' },
      { name: 'Diamond', color: 'text-purple-400', borderColor: 'border-purple-500', bgColor: 'bg-purple-950/40', glowColor: 'rgba(192,132,252,0.3)', percentile: 'Top 3%' },
      { name: 'Emerald', color: 'text-emerald-400', borderColor: 'border-emerald-500', bgColor: 'bg-emerald-950/40', glowColor: 'rgba(52,211,153,0.3)', percentile: 'Top 10%' },
      { name: 'Platinum', color: 'text-cyan-400', borderColor: 'border-cyan-500', bgColor: 'bg-cyan-950/30', glowColor: 'rgba(6,182,212,0.25)', percentile: 'Top 25%' },
      { name: 'Gold / Silver', color: 'text-yellow-400', borderColor: 'border-yellow-500', bgColor: 'bg-yellow-950/30', glowColor: 'rgba(250,204,21,0.2)', percentile: 'Mid Bracket' },
    ]
  },
  'PUBG': {
    unit: 'RP',
    metricLabel: 'SURVIVAL RATING',
    defaultElo: '3,840',
    ranks: [
      { name: 'Grandmaster / Master', color: 'text-amber-400', borderColor: 'border-amber-500', bgColor: 'bg-amber-950/50', glowColor: 'rgba(251,191,36,0.4)', percentile: 'Top 1%' },
      { name: 'Diamond', color: 'text-cyan-400', borderColor: 'border-cyan-500', bgColor: 'bg-cyan-950/40', glowColor: 'rgba(6,182,212,0.3)', percentile: 'Top 8%' },
      { name: 'Platinum', color: 'text-blue-400', borderColor: 'border-blue-500', bgColor: 'bg-blue-950/30', glowColor: 'rgba(96,165,250,0.25)', percentile: 'Top 25%' },
      { name: 'Gold / Silver', color: 'text-yellow-400', borderColor: 'border-yellow-500', bgColor: 'bg-yellow-950/30', glowColor: 'rgba(250,204,21,0.2)', percentile: 'Top 55%' },
    ]
  },
  'EA FC 27': {
    unit: 'Division / SR',
    metricLabel: 'DIVISION RIVALS TIER',
    defaultElo: 'Elite / 2,150',
    ranks: [
      { name: 'Elite Division', color: 'text-purple-400', borderColor: 'border-purple-500', bgColor: 'bg-purple-950/50', glowColor: 'rgba(192,132,252,0.4)', percentile: 'Esports Tier' },
      { name: 'Division 1 - 2', color: 'text-cyan-400', borderColor: 'border-cyan-500', bgColor: 'bg-cyan-950/40', glowColor: 'rgba(6,182,212,0.3)', percentile: 'Top 5%' },
      { name: 'Division 3 - 4', color: 'text-emerald-400', borderColor: 'border-emerald-500', bgColor: 'bg-emerald-950/30', glowColor: 'rgba(52,211,153,0.25)', percentile: 'Top 20%' },
      { name: 'Division 5 - 6', color: 'text-yellow-400', borderColor: 'border-yellow-500', bgColor: 'bg-yellow-950/30', glowColor: 'rgba(250,204,21,0.2)', percentile: 'Mid Tier' },
    ]
  }
};
