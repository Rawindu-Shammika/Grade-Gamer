/**
 * League of Legends Riot API Sync Service
 */
export const syncLolAccount = async (userId, riotId, region = 'sea') => {
  const res = await fetch('http://localhost:5000/api/sync-lol', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      riotId: riotId.trim(),
      region
    })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to sync League of Legends match');
  return data;
};
