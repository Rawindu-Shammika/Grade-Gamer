export const parseDotaRank = (rankTier, leaderboardRank) => {
  if (!rankTier && !leaderboardRank) return 'UNRATED';

  // Any tier 80 or above is IMMORTAL
  const tierNum = Number(rankTier) || 0;
  if (tierNum >= 80 || leaderboardRank) {
    return leaderboardRank ? `IMMORTAL #${leaderboardRank}` : 'IMMORTAL';
  }

  const medalTier = Math.floor(tierNum / 10);
  const stars = tierNum % 10;

  const MEDALS = {
    1: 'HERALD',
    2: 'GUARDIAN',
    3: 'CRUSADER',
    4: 'ARCHON',
    5: 'LEGEND',
    6: 'ANCIENT',
    7: 'DIVINE',
    8: 'IMMORTAL'
  };

  const medalName = MEDALS[medalTier] || 'UNRATED';
  if (medalName === 'UNRATED') return 'UNRATED';
  if (stars === 0) return medalName;

  return `${medalName} ${stars}`;
};
