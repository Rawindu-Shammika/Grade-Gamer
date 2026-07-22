import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

/**
 * The LCC Calculation Engine Hook
 * 
 * - Subscribes to real-time updates on the 'matches' table for the current user and active game.
 * - Extracts early average (first 5) and late average (last 5) scores.
 * - Computes the LCC delta = (Last 5 Average - First 5 Average) / Total Matches Array Length.
 * - Exposes mock insertion controls for E2E testing.
 */
export const useLccEngine = (session, activeGame) => {
  const [matchesList, setMatchesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Extract user ID safely from either session.user or direct user object structure
  const userId = session?.user?.id || session?.id;

  const fetchMatches = async () => {
    if (!userId || !activeGame) {
      setMatchesList([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('user_id', userId)
        .eq('game_title', activeGame)
        .order('match_timestamp', { ascending: true });

      if (error) throw error;
      setMatchesList(data || []);
    } catch (err) {
      console.error('Error fetching matches:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();

    if (!userId || !activeGame) return;

    // Real-time postgres changes listener filtered by user_id
    const channel = supabase
      .channel(`realtime_matches_${userId}_${activeGame.replace(/\s+/g, '_')}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newRow = payload.new;
          const oldRow = payload.old;
          if (
            (newRow && newRow.game_title === activeGame) ||
            (oldRow && oldRow.game_title === activeGame) ||
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
  }, [userId, activeGame]);

  const addMockMatch = async (score) => {
    if (!userId || !activeGame) return;
    try {
      const { error } = await supabase
        .from('matches')
        .insert([
          {
            user_id: userId,
            game_title: activeGame,
            performance_score: Number(score),
            match_timestamp: new Date().toISOString()
          }
        ]);
      if (error) throw error;
    } catch (err) {
      console.error('Error inserting mock match:', err);
      throw err;
    }
  };

  // LCC mathematical algorithm execution
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
    lccDelta: Number(lccDelta.toFixed(3)),
    earlyAverage: Number(earlyAverage.toFixed(1)),
    lateAverage: Number(lateAverage.toFixed(1)),
    isLoading,
    addMockMatch
  };
};

export default useLccEngine;
