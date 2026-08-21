import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

/**
 * Isolated Data & Processing Layer custom hook.
 * 
 * - Tracks matches filtered by UID and activeSelectedGame, sorted chronologically.
 * - Computes LCC delta, early average, and late average performance ratings.
 * - Tracks user's player profile with automatic database sync and local auth metadata fallback.
 */
const getTelemetryTable = (gameKey) => {
  const g = (gameKey || '').toLowerCase();
  if (g.includes('dota')) return 'dota2_match_telemetry';
  if (g.includes('lol') || g.includes('league')) return 'lol_match_telemetry';
  if (g.includes('cs') || g.includes('counter-strike')) return 'cs2_match_telemetry';
  if (g === 'valorant') return 'valorant_match_telemetry';
  return 'matches';
};

export const useDashboardData = (session, activeSelectedGame) => {
  const [matchesList, setMatchesList] = useState([]);
  const [playerProfile, setPlayerProfile] = useState({
    gamerTag: 'PlayerOne#SLIIT',
    teamTag: 'SLIIT Esports',
    totalHours: 142,
    rankTiers: {
      'FC26': 'Division 2',
      'F1 25': 'Platinum',
      'Valorant': 'Immortal',
      'CS2': 'Platinum',
      'Dota 2': 'Gold',
      'Overwatch 2': 'Gold',
      'League of Legends': 'Platinum'
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  const userId = session?.user?.id || session?.id;

  // 1. Fetch matches collection chronologically
  const fetchMatches = async () => {
    if (!userId || !activeSelectedGame) return;
    try {
      const tableName = getTelemetryTable(activeSelectedGame);
      const isCustomTable = tableName === 'valorant_match_telemetry' || tableName === 'dota2_match_telemetry' || tableName === 'lol_match_telemetry' || tableName === 'cs2_match_telemetry';
      const orderByCol = isCustomTable ? 'created_at' : 'match_timestamp';

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', userId)
        .order(orderByCol, { ascending: true });

      if (error) throw error;
      setMatchesList(data || []);
    } catch (err) {
      console.error('Error querying matches:', err);
    }
  };

  // 2. Fetch player profiles from database with metadata fallbacks
  const fetchProfile = async () => {
    try {
      const metadata = session?.user_metadata || session?.user?.user_metadata;
      const fallbackTag = metadata?.gamerTag ? `${metadata.gamerTag}#SLIIT` : 'PlayerOne#SLIIT';
      const fallbackTeam = metadata?.institution ? `${metadata.institution} Esports` : 'SLIIT Esports';
      const fallbackRanks = metadata?.rank_tiers || {
        'FC26': 'Division 2',
        'F1 25': 'Platinum',
        'Valorant': 'Immortal',
        'CS2': 'Platinum',
        'Dota 2': 'Gold',
        'Overwatch 2': 'Gold',
        'League of Legends': 'Platinum'
      };

      setPlayerProfile({
        gamerTag: fallbackTag,
        teamTag: fallbackTeam,
        totalHours: 142,
        rankTiers: fallbackRanks
      });
    } catch (err) {
      console.error('Profile fetch failed, using defaults:', err);
    }
  };

  // Synchronize both data nodes
  const syncTelemetry = async () => {
    setIsLoading(true);
    await Promise.all([fetchMatches(), fetchProfile()]);
    setIsLoading(false);
  };

  useEffect(() => {
    syncTelemetry();

    if (!userId || !activeSelectedGame) return;

    const tableName = getTelemetryTable(activeSelectedGame);

    // Real-time Postgres changes subscription target matches changes
    const channel = supabase
      .channel(`realtime_analytics_${userId}_${activeSelectedGame.replace(/\s+/g, '_')}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newRow = payload.new;
          const oldRow = payload.old;
          if (
            (newRow && newRow.game_title === activeSelectedGame) ||
            (oldRow && oldRow.game_title === activeSelectedGame) ||
            payload.eventType === 'DELETE'
          ) {
            fetchMatches();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, activeSelectedGame]);

  // Upsert updated rank to Supabase storage with metadata fallback
  const updateRankTier = async (newTier) => {
    if (!activeSelectedGame) return;

    const updatedRanks = {
      ...playerProfile.rankTiers,
      [activeSelectedGame]: newTier
    };

    setPlayerProfile(prev => ({ ...prev, rankTiers: updatedRanks }));

    // Persist to user metadata for session synchronization
    try {
      await supabase.auth.updateUser({
        data: { rank_tiers: updatedRanks }
      });
      console.log('Synchronized rank tier map in Auth metadata.');
    } catch (err) {
      console.error('Failed to update auth metadata rank map:', err);
    }
  };

  // Explicit mock match insertion utility
  const addMockMatch = async (score) => {
    if (!userId || !activeSelectedGame) return;
    try {
      const tableName = getTelemetryTable(activeSelectedGame);
      const isCustomTable = tableName === 'valorant_match_telemetry' || tableName === 'dota2_match_telemetry' || tableName === 'lol_match_telemetry' || tableName === 'cs2_match_telemetry';
      const timeColumn = isCustomTable ? 'created_at' : 'match_timestamp';

      const payload = {
        user_id: userId,
        game_title: activeSelectedGame,
        performance_score: Number(score),
        [timeColumn]: new Date().toISOString()
      };

      if (isCustomTable) {
        payload.ingestion_type = 'MOCK_DATA';
      }

      const { error } = await supabase
        .from(tableName)
        .insert([payload]);
      if (error) throw error;
    } catch (err) {
      console.error('Error inserting mock match:', err);
      throw err;
    }
  };

  // Calculate LCC delta parameters
  let earlyAverage = 0;
  let lateAverage = 0;
  let lccDelta = 0;

  if (matchesList.length > 0) {
    const first5 = matchesList.slice(0, 5);
    const last5 = matchesList.slice(-5);

    const firstSum = first5.reduce((sum, m) => sum + Number(m.performance_score || 0), 0);
    const lastSum = last5.reduce((sum, m) => sum + Number(m.performance_score || 0), 0);

    earlyAverage = firstSum / first5.length;
    lateAverage = lastSum / last5.length;
    lccDelta = (lateAverage - earlyAverage) / matchesList.length;
  }

  return {
    matchesList,
    playerProfile,
    lccDelta: Number(lccDelta.toFixed(3)),
    earlyAverage: Number(earlyAverage.toFixed(1)),
    lateAverage: Number(lateAverage.toFixed(1)),
    isLoading,
    syncTelemetry,
    updateRankTier,
    addMockMatch
  };
};

export default useDashboardData;
