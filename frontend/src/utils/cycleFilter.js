const EIGHT_WEEKS_MS = 56 * 24 * 60 * 60 * 1000; // 8 weeks in milliseconds

/**
 * Filters matches based on the current 8-week Act cycle (Valorant only).
 * @param {Array} matchesList - All raw ingested matches
 * @param {string} gameTitle - Selected title ('VALORANT', 'CS2', etc.)
 * @returns {Object} { activeMatches, cycleNumber, daysRemaining }
 */
export function getActiveCycleMatches(matchesList = [], gameTitle = '') {
  if (!Array.isArray(matchesList) || matchesList.length === 0) {
    return { activeMatches: [], cycleNumber: 1, daysRemaining: 56 };
  }

  const isValorant = String(gameTitle).trim().toLowerCase().includes('val');

  // If not Valorant, return all historical matches without cycle cutoff
  if (!isValorant) {
    return {
      activeMatches: matchesList,
      cycleNumber: 1,
      daysRemaining: null,
    };
  }

  // Parse timestamps safely
  const parsedMatches = matchesList.map((m) => ({
    ...m,
    _timestamp: new Date(m.date || m.created_at || m.timestamp || m.match_date || 0).getTime(),
  }));

  // Sort chronologically to identify the first match ever played
  const sorted = [...parsedMatches].sort((a, b) => a._timestamp - b._timestamp);
  const firstMatchTime = sorted[0]._timestamp;

  if (!firstMatchTime || isNaN(firstMatchTime)) {
    return { activeMatches: matchesList, cycleNumber: 1, daysRemaining: 56 };
  }

  const now = Date.now();
  const timeElapsed = Math.max(0, now - firstMatchTime);

  // Compute current cycle index (0 = Act 1, 1 = Act 2, etc.)
  const cycleIndex = Math.floor(timeElapsed / EIGHT_WEEKS_MS);
  const currentCycleStartTime = firstMatchTime + cycleIndex * EIGHT_WEEKS_MS;
  const nextCycleStartTime = currentCycleStartTime + EIGHT_WEEKS_MS;
  const daysRemaining = Math.max(0, Math.ceil((nextCycleStartTime - now) / (1000 * 60 * 60 * 24)));

  // Filter only matches that fall inside the current active 8-week cycle
  const currentCycleMatches = parsedMatches.filter(
    (m) => m._timestamp >= currentCycleStartTime
  );

  return {
    activeMatches: currentCycleMatches,
    cycleNumber: cycleIndex + 1,
    daysRemaining,
  };
}
