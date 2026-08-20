/**
 * Dota 2 OpenDota API Sync Service.
 */
export const syncDota2Account = async (userId, accountId) => {
  const res = await fetch('http://localhost:5000/api/sync-dota2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      gameTitle: 'Dota 2',
      accountId: accountId.trim()
    })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to sync Dota 2 match');
  return data;
};
