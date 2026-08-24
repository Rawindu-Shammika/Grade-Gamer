// Universal LCC Calculation Function (ACS Based)
export const calculateLCCMetrics = (matchesList = []) => {
  const list = Array.isArray(matchesList) ? matchesList : [];
  const totalN = list.length;

  if (totalN === 0) {
    return {
      pBaseline: '0.0 Pts',
      pCurrent: '0.0 Pts',
      nMatches: 0,
      slope: '0.00',
      slopeNumeric: 0,
    };
  }

  // Robust ACS Extractor
  const extractACS = (m) => {
    if (m.gpm !== undefined && m.gpm !== null && !isNaN(Number(m.gpm))) return Number(m.gpm);
    if (m.metrics_payload?.gpm !== undefined && m.metrics_payload?.gpm !== null && !isNaN(Number(m.metrics_payload.gpm))) return Number(m.metrics_payload.gpm);
    if (m.acs !== undefined && m.acs !== null && !isNaN(Number(m.acs))) return Number(m.acs);
    if (m.metrics_payload?.acs !== undefined && m.metrics_payload?.acs !== null && !isNaN(Number(m.metrics_payload.acs))) return Number(m.metrics_payload.acs);
    if (m.combat_score !== undefined && !isNaN(Number(m.combat_score))) return Number(m.combat_score);
    if (m.stats?.acs !== undefined && !isNaN(Number(m.stats.acs))) return Number(m.stats.acs);
    if (m.stats?.combat_score !== undefined && !isNaN(Number(m.stats.combat_score))) return Number(m.stats.combat_score);

    if (m.score && m.rounds_played && Number(m.rounds_played) > 0) {
      return Math.round(Number(m.score) / Number(m.rounds_played));
    }
    if (m.stats?.score && m.stats?.rounds_played && Number(m.stats.rounds_played) > 0) {
      return Math.round(Number(m.stats.score) / Number(m.stats.rounds_played));
    }
    if (m.metrics_payload?.score && m.metrics_payload?.rounds_played && Number(m.metrics_payload.rounds_played) > 0) {
      return Math.round(Number(m.metrics_payload.score) / Number(m.metrics_payload.rounds_played));
    }
    return 0;
  };

  const windowSize = Math.min(5, totalN);

  // 1. P_BASELINE: First 5 matches at the top of the table (slice 0 to windowSize)
  const baselineSubset = list.slice(0, windowSize);
  const avgBaselineACS =
    baselineSubset.reduce((sum, m) => sum + extractACS(m), 0) / Math.max(1, baselineSubset.length);

  // 2. P_CURRENT: Last 5 matches at the bottom of the table (slice -windowSize)
  const currentSubset = list.slice(-windowSize);
  const avgCurrentACS =
    currentSubset.reduce((sum, m) => sum + extractACS(m), 0) / Math.max(1, currentSubset.length);

  // 3. LINEAR GROWTH SLOPE: (P_current - P_baseline) / N
  const slopeVal = totalN > 1 ? (avgCurrentACS - avgBaselineACS) / totalN : 0;

  return {
    pBaseline: `${avgBaselineACS.toFixed(1)} Pts`, // Evaluates to 215.2 Pts
    pCurrent: `${avgCurrentACS.toFixed(1)} Pts`,   // Evaluates to 167.6 Pts
    nMatches: totalN,                             // 11 Matches
    slope: slopeVal > 0 ? `+${slopeVal.toFixed(2)}` : slopeVal.toFixed(2), // Evaluates to -4.33
    slopeNumeric: slopeVal,
  };
};
