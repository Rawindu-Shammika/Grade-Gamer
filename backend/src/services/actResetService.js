let cachedActData = null;
let lastFetchTime = 0;

/**
 * Fetches and caches the official active Valorant Act boundary.
 */
export async function getActiveValorantAct() {
  const now = Date.now();
  // Cache for 1 hour to prevent rate limits
  if (cachedActData && now - lastFetchTime < 3600000) {
    return cachedActData;
  }

  try {
    const res = await fetch('https://valorant-api.com/v1/seasons');
    const json = await res.json();

    if (json.status === 200 && Array.isArray(json.data)) {
      const currentDate = new Date();
      const seasons = json.data;

      // Find the active Act
      const currentAct = seasons.find((s) => {
        if (!s.parentUuid || !s.startTime || !s.endTime) return false;
        return currentDate >= new Date(s.startTime) && currentDate <= new Date(s.endTime);
      });

      if (currentAct) {
        cachedActData = {
          uuid: currentAct.uuid,
          displayName: currentAct.displayName,
          startTime: new Date(currentAct.startTime).getTime(),
          endTime: new Date(currentAct.endTime).getTime(),
        };
        lastFetchTime = now;
        return cachedActData;
      }
    }
  } catch (err) {
    console.error('Error querying Valorant Season API:', err);
  }

  return cachedActData || { startTime: 0, endTime: Date.now() + 56 * 86400000 };
}

/**
 * Middleware/Helper to filter user datasets by active Act
 */
export function filterUserDataByAct(items = [], actStartTime = 0, isValorant = true) {
  if (!isValorant || !actStartTime) return items;

  return items.filter((item) => {
    const itemTimestamp = new Date(
      item.match_date || item.created_at || item.timestamp || item.date || 0
    ).getTime();
    return itemTimestamp >= actStartTime;
  });
}
