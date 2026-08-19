/**
 * Global filter applying the official Act reset boundary across any user's telemetry array.
 */
export function applyGlobalActReset(records = [], gameTitle = '', activeActInfo = null) {
  if (!Array.isArray(records)) return [];

  const isValorant = String(gameTitle || '').toLowerCase().includes('val');
  if (!isValorant || !activeActInfo?.startTime) {
    return records;
  }

  return records.filter((r) => {
    const itemTime = new Date(r.match_date || r.created_at || r.timestamp || r.date || 0).getTime();
    return itemTime >= activeActInfo.startTime;
  });
}
