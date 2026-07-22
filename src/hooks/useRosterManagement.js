import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import useAuth from './useAuth';
import { GAME_ROSTER_SCHEMAS } from '../utils/rosterLimits';

/**
 * useRosterManagement - Roster Controller Engine Sync Hook
 * 
 * Manages active category/title states and transactional syncs for teams & team_rosters.
 */
export const useRosterManagement = () => {
  const { user } = useAuth();
  
  // Interface states
  const [activeCategory, setActiveCategory] = useState('Sim Racing');
  const [selectedTitle, setSelectedTitle] = useState('F1 25');
  const [existingRosters, setExistingRosters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch active team listings for the current user, joining their rosters
  const fetchRosters = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('teams')
        .select('*, team_rosters(*)')
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;

      setExistingRosters(data || []);
    } catch (err) {
      console.error('Error fetching rosters data:', err);
      setError(err.message || 'Failed to retrieve active rosters listings.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchRosters();
  }, [fetchRosters]);

  // Create Roster Transaction
  const createRoster = async (teamName, playersList) => {
    if (!user?.id) {
      return { success: false, error: 'User session offline.' };
    }
    if (!teamName || teamName.trim() === '') {
      return { success: false, error: 'Roster team name is required.' };
    }
    if (!playersList || playersList.length === 0) {
      return { success: false, error: 'Please add at least one player to the roster.' };
    }

    // Resolve max slots capacity rule constraints
    const limits = GAME_ROSTER_SCHEMAS[selectedTitle] || { maxSlots: 5, defaultRoleLabel: 'Active Player' };
    
    if (playersList.length > limits.maxSlots) {
      return { 
        success: false, 
        error: `Roster Size Warning: Maximum slots capacity for ${selectedTitle} is limited strictly to ${limits.maxSlots} players.` 
      };
    }

    try {
      // 1. Post team row to 'teams'
      const { data: teamData, error: teamErr } = await supabase
        .from('teams')
        .insert({
          user_id: user.id,
          team_name: teamName.trim(),
          game_category: activeCategory,
          game_title: selectedTitle
        })
        .select();

      if (teamErr) throw teamErr;

      const teamId = teamData[0].id;

      // 2. Post roster members sequentially to 'team_rosters'
      const rosterRows = playersList.map(player => ({
        team_id: teamId,
        player_name: player.name.trim(),
        player_role: player.role || limits.defaultRoleLabel
      }));

      const { error: rosterErr } = await supabase
        .from('team_rosters')
        .insert(rosterRows);

      if (rosterErr) throw rosterErr;

      // Refetch active roster listings
      await fetchRosters();
      return { success: true, data: teamData[0] };

    } catch (err) {
      console.error('Roster creation transaction failed:', err);
      return { 
        success: false, 
        error: err.message || 'Transaction aborted: Failed to persist team configuration.' 
      };
    }
  };

  return {
    activeCategory,
    setActiveCategory,
    selectedTitle,
    setSelectedTitle,
    existingRosters,
    isLoading,
    error,
    createRoster,
    refreshRosters: fetchRosters
  };
};

export default useRosterManagement;
