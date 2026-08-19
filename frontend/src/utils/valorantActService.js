/**
 * Fetches active season metadata from the official Valorant API
 * @returns {Promise<Object>} Active Act details and timestamps
 */
export async function fetchCurrentValorantAct() {
  try {
    const res = await fetch('https://valorant-api.com/v1/seasons');
    const json = await res.json();

    if (json.status !== 200 || !Array.isArray(json.data)) {
      throw new Error('Invalid season API response');
    }

    const now = new Date();
    const seasons = json.data;

    // An Act has a parentUuid pointing to its Episode
    const currentAct = seasons.find((s) => {
      if (!s.parentUuid || !s.startTime || !s.endTime) return false;
      const start = new Date(s.startTime);
      const end = new Date(s.endTime);
      return now >= start && now <= end;
    });

    if (currentAct) {
      const parentEpisode = seasons.find((s) => s.uuid === currentAct.parentUuid);
      const epName = parentEpisode ? parentEpisode.displayName.toUpperCase() : '';
      const actName = currentAct.displayName.toUpperCase();
      const end = new Date(currentAct.endTime);
      const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      return {
        actUuid: currentAct.uuid,
        title: epName ? `${epName} // ${actName}` : actName,
        startTime: new Date(currentAct.startTime).getTime(),
        endTime: new Date(currentAct.endTime).getTime(),
        daysRemaining: daysLeft,
        isLoaded: true,
      };
    }

    // Fallback if between seasons: take latest act
    const latestAct = seasons.filter((s) => s.parentUuid).pop();
    return {
      actUuid: latestAct?.uuid || null,
      title: latestAct?.displayName?.toUpperCase() || 'CURRENT ACT',
      startTime: latestAct ? new Date(latestAct.startTime).getTime() : 0,
      endTime: latestAct ? new Date(latestAct.endTime).getTime() : Date.now() + 56 * 86400000,
      daysRemaining: 56,
      isLoaded: true,
    };
  } catch (err) {
    console.error('Failed to fetch Valorant official Act boundary:', err);
    return {
      actUuid: null,
      title: 'CURRENT ACT',
      startTime: 0,
      endTime: Date.now() + 56 * 86400000,
      daysRemaining: 56,
      isLoaded: false,
    };
  }
}
