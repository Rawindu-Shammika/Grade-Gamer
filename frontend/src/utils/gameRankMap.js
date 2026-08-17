/**
 * GAME_RANK_SCHEMAS
 * 
 * Centralized styling configuration controller mapping rank ladders
 * and visual CSS properties (text, borders, badge backgrounds, and glow effects)
 * for the 7 designated esports games.
 */
export const GAME_RANK_SCHEMAS = {
  'Valorant': [
    { name: 'Iron', text: 'text-stone-400', border: 'border-stone-700', bg: 'bg-stone-950/40' },
    { name: 'Bronze', text: 'text-amber-600', border: 'border-amber-800', bg: 'bg-amber-950/40' },
    { name: 'Silver', text: 'text-slate-300', border: 'border-slate-600', bg: 'bg-slate-850/40' },
    { name: 'Gold', text: 'text-yellow-400', border: 'border-yellow-600', bg: 'bg-yellow-950/40' },
    { name: 'Platinum', text: 'text-teal-400', border: 'border-teal-700', bg: 'bg-teal-950/40' },
    { name: 'Diamond', text: 'text-purple-400', border: 'border-purple-700', bg: 'bg-purple-950/40' },
    { name: 'Ascendant', text: 'text-emerald-400', border: 'border-emerald-700', bg: 'bg-emerald-950/40' },
    { name: 'Immortal', text: 'text-red-500', border: 'border-red-800', bg: 'bg-red-950/40' },
    { name: 'Radiant', text: 'text-amber-300', border: 'border-amber-500', bg: 'bg-amber-950/30', extra: 'shadow-[0_0_12px_rgba(251,191,36,0.15)] animate-pulse' }
  ],
  'FC26': [
    { name: 'Division 10', text: 'text-blue-500', border: 'border-blue-800', bg: 'bg-blue-950/40' },
    { name: 'Division 9', text: 'text-blue-400', border: 'border-blue-700', bg: 'bg-blue-950/40' },
    { name: 'Division 8', text: 'text-cyan-500', border: 'border-cyan-800', bg: 'bg-cyan-950/40' },
    { name: 'Division 7', text: 'text-cyan-400', border: 'border-cyan-700', bg: 'bg-cyan-950/40' },
    { name: 'Division 6', text: 'text-teal-500', border: 'border-teal-800', bg: 'bg-teal-950/40' },
    { name: 'Division 5', text: 'text-teal-400', border: 'border-teal-700', bg: 'bg-teal-950/40' },
    { name: 'Division 4', text: 'text-indigo-400', border: 'border-indigo-700', bg: 'bg-indigo-950/40' },
    { name: 'Division 3', text: 'text-indigo-300', border: 'border-indigo-600', bg: 'bg-indigo-950/40' },
    { name: 'Division 2', text: 'text-sky-400', border: 'border-sky-700', bg: 'bg-sky-950/40' },
    { name: 'Division 1', text: 'text-sky-300', border: 'border-sky-600', bg: 'bg-sky-950/40' },
    { name: 'The Elite Tier', text: 'text-orange-400', border: 'border-orange-500', bg: 'bg-orange-950/40', extra: 'shadow-[0_0_8px_rgba(251,146,60,0.15)] font-black' }
  ],
  'F1 25': [
    { name: 'Bronze', text: 'text-amber-600', border: 'border-amber-800', bg: 'bg-amber-950/40' },
    { name: 'Silver', text: 'text-slate-300', border: 'border-slate-600', bg: 'bg-slate-850/40' },
    { name: 'Gold', text: 'text-yellow-400', border: 'border-yellow-600', bg: 'bg-yellow-950/40' },
    { name: 'Platinum', text: 'text-teal-400', border: 'border-teal-700', bg: 'bg-teal-950/40' },
    { name: 'Diamond', text: 'text-purple-400', border: 'border-purple-700', bg: 'bg-purple-950/40' },
    { name: 'Master', text: 'text-rose-400', border: 'border-rose-700', bg: 'bg-rose-950/40' },
    { name: 'Elite', text: 'text-indigo-400', border: 'border-indigo-600', bg: 'bg-indigo-950/40', extra: 'shadow-[0_0_8px_rgba(129,140,248,0.25)] animate-pulse' }
  ],
  'CS2': [
    { name: 'Silver', text: 'text-stone-400', border: 'border-stone-700', bg: 'bg-stone-950/40' },
    { name: 'Gold Nova', text: 'text-yellow-400', border: 'border-yellow-600', bg: 'bg-yellow-950/40' },
    { name: 'Master Guardian', text: 'text-teal-400', border: 'border-teal-700', bg: 'bg-teal-950/40' },
    { name: 'Legendary Eagle', text: 'text-blue-400', border: 'border-blue-700', bg: 'bg-blue-950/40' },
    { name: 'Supreme', text: 'text-red-500', border: 'border-red-800', bg: 'bg-red-950/40', extra: 'font-bold' },
    { name: 'The Elite Tier', text: 'text-amber-400', border: 'border-amber-600', bg: 'bg-amber-950/40', extra: 'shadow-[0_0_8px_rgba(251,191,36,0.2)] animate-pulse font-black' }
  ],
  'Dota 2': [
    { name: 'Herald', text: 'text-amber-800', border: 'border-amber-950', bg: 'bg-amber-950/20' },
    { name: 'Guardian', text: 'text-emerald-600', border: 'border-emerald-800', bg: 'bg-emerald-950/20' },
    { name: 'Crusader', text: 'text-teal-400', border: 'border-teal-700', bg: 'bg-teal-950/20' },
    { name: 'Archon', text: 'text-cyan-400', border: 'border-cyan-700', bg: 'bg-cyan-950/20' },
    { name: 'Legend', text: 'text-sky-400', border: 'border-sky-700', bg: 'bg-sky-950/20' },
    { name: 'Ancient', text: 'text-violet-400', border: 'border-violet-700', bg: 'bg-violet-950/20' },
    { name: 'Divine', text: 'text-fuchsia-400', border: 'border-fuchsia-700', bg: 'bg-fuchsia-950/20', extra: 'font-semibold' },
    { name: 'Immortal', text: 'text-indigo-400', border: 'border-indigo-600', bg: 'bg-indigo-950/30', extra: 'shadow-[0_0_10px_rgba(129,140,248,0.2)] animate-pulse font-black' }
  ],
  'Overwatch 2': [
    { name: 'Bronze', text: 'text-amber-600', border: 'border-amber-800', bg: 'bg-amber-950/40' },
    { name: 'Silver', text: 'text-slate-300', border: 'border-slate-600', bg: 'bg-slate-850/40' },
    { name: 'Gold', text: 'text-yellow-400', border: 'border-yellow-600', bg: 'bg-yellow-950/40' },
    { name: 'Platinum', text: 'text-teal-400', border: 'border-teal-700', bg: 'bg-teal-950/40' },
    { name: 'Diamond', text: 'text-purple-400', border: 'border-purple-700', bg: 'bg-purple-950/40' },
    { name: 'Master', text: 'text-rose-400', border: 'border-rose-700', bg: 'bg-rose-950/40' },
    { name: 'Grandmaster', text: 'text-red-500', border: 'border-red-800', bg: 'bg-red-950/40', extra: 'font-bold animate-pulse' },
    { name: 'Champion', text: 'text-sky-400', border: 'border-sky-500', bg: 'bg-sky-950/40', extra: 'shadow-[0_0_10px_rgba(56,189,248,0.25)] animate-pulse font-black' }
  ],
  'League of Legends': [
    { name: 'Iron', text: 'text-stone-400', border: 'border-stone-700', bg: 'bg-stone-950/40' },
    { name: 'Bronze', text: 'text-amber-600', border: 'border-amber-800', bg: 'bg-amber-950/40' },
    { name: 'Silver', text: 'text-slate-300', border: 'border-slate-600', bg: 'bg-slate-850/40' },
    { name: 'Gold', text: 'text-yellow-400', border: 'border-yellow-600', bg: 'bg-yellow-950/40' },
    { name: 'Platinum', text: 'text-teal-400', border: 'border-teal-700', bg: 'bg-teal-950/40' },
    { name: 'Diamond', text: 'text-purple-400', border: 'border-purple-700', bg: 'bg-purple-950/40' },
    { name: 'Master', text: 'text-fuchsia-400', border: 'border-fuchsia-800', bg: 'bg-fuchsia-950/40', extra: 'font-bold' },
    { name: 'Grandmaster', text: 'text-red-500', border: 'border-red-800', bg: 'bg-red-950/40', extra: 'font-bold animate-pulse' },
    { name: 'Challenger', text: 'text-amber-400', border: 'border-amber-500', bg: 'bg-red-950/30', extra: 'shadow-[0_0_12px_rgba(251,191,36,0.3)] animate-pulse font-black' }
  ]
};

/**
 * Helper to retrieve rank style schema for a given game and rank name.
 */
export const getRankStyle = (gameId, rankName) => {
  const schema = GAME_RANK_SCHEMAS[gameId];
  const defaultStyle = { text: 'text-slate-400', border: 'border-slate-800', bg: 'bg-slate-900/50', extra: '' };
  
  if (!schema || !rankName) return defaultStyle;

  const matched = schema.find(r => r.name.toLowerCase() === rankName.toLowerCase());
  return matched || defaultStyle;
};
