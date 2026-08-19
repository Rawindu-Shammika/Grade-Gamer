/**
 * Filters matches strictly by the official Act's startTime for Valorant.
 * @param {Array} matches - All user match logs
 * @param {string} gameTitle - Selected title ('VALORANT', etc.)
 * @param {Object} actData - Result from fetchCurrentValorantAct()
 * @returns {Array} Active matches for this official Act
 */
export function filterMatchesByOfficialAct(matches = [], gameTitle = '', actData = null) {
  if (!Array.isArray(matches)) return [];

  const isValorant = String(gameTitle || '').toLowerCase().includes('val');

  // If not Valorant, return full history
  if (!isValorant) return matches;

  // If Valorant Act startTime is loaded, filter strictly by it
  if (actData?.startTime) {
    return matches.filter((m) => {
      const matchTime = new Date(m.date || m.created_at || m.timestamp || 0).getTime();
      return matchTime >= actData.startTime;
    });
  }

  return matches;
}
