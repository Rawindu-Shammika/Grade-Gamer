/**
 * Counter-Strike 2 (CS2) Steam API Sync Service
 */
export const syncCs2Account = async (userId, steamId) => {
  const res = await fetch('http://localhost:5000/api/sync-cs2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      steamId: steamId.toString().trim()
    })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to sync CS2 match telemetry');
  return data;
};
