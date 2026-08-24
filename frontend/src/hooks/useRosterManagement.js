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
  const [selectedTitle, setSelectedTitle] = useState('Valorant');
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
      // 1. Fetch team IDs where current user is a member
      const { data: memberRows, error: memberErr } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id);

      if (memberErr) throw memberErr;
      const joinedTeamIds = (memberRows || []).map((m) => m.team_id).filter(Boolean);

      // 2. Fetch all teams created by user OR where user is a team member
      let query = supabase
        .from('teams')
        .select(`
          id,
          team_name,
          game_title,
          game_category,
          user_id,
          created_at,
          team_members (
            id,
            role,
            user_id,
            profiles (
              id,
              unique_account_id,
              in_game_name,
              full_name
            )
          ),
          roster_invitations (
            id,
            status,
            receiver_id,
            receiver:profiles!roster_invitations_receiver_id_fkey (
              id,
              unique_account_id,
              in_game_name
            )
          )
        `);

      if (joinedTeamIds.length > 0) {
        query = query.or(`user_id.eq.${user.id},id.in.(${joinedTeamIds.join(',')})`);
      } else {
        query = query.eq('user_id', user.id);
      }

      const { data: teamsData, error: teamsErr } = await query.order('created_at', { ascending: false });

      if (teamsErr) {
        console.error('Error loading rosters:', teamsErr);
        // Fallback simple query if relational join fails
        const { data: fallbackData } = await supabase
          .from('teams')
          .select('*')
          .order('created_at', { ascending: false });
        setExistingRosters((fallbackData || []).map(t => ({ ...t, team_members: [], roster_invitations: [] })));
      } else {
        setExistingRosters(teamsData || []);
      }
    } catch (err) {
      console.error('Failed to fetch rosters:', err);
      setError(err.message || 'Failed to retrieve active rosters.');
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

    // Check 1-roster limit per game title for the user
    try {
      const { data: userTeamsForGame, error: checkErr } = await supabase
        .from('teams')
        .select('id')
        .eq('user_id', user.id)
        .eq('game_title', selectedTitle);

      if (checkErr) throw checkErr;

      if (userTeamsForGame && userTeamsForGame.length > 0) {
        return { 
          success: false, 
          error: `Roster Limit Exceeded: You can only create one team roster per game title ("${selectedTitle}"). Delete your existing roster for this title to establish a new one.` 
        };
      }
    } catch (err) {
      console.error('Failed to verify roster limits check:', err);
      return { success: false, error: 'Authorization validation check failed. Please try again.' };
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

      // 2. Post roster members sequentially to 'team_members'
      const rosterRows = playersList.map(player => ({
        team_id: teamId,
        user_id: player.userId || user.id,
        role: player.role || limits.defaultRoleLabel
      }));

      const { error: rosterErr } = await supabase
        .from('team_members')
        .insert(rosterRows);

      if (rosterErr) {
        console.warn('Could not insert team_members rows:', rosterErr);
      }

      // 3. Post roster invitations to 'roster_invitations'
      const invitationRows = playersList
        .filter(player => player.platformId && player.platformId.trim() !== '')
        .map(player => ({
          team_id: teamId,
          sender_id: user.id,
          receiver_platform_id: player.platformId.trim(),
          status: 'pending'
        }));

      if (invitationRows.length > 0) {
        const { error: inviteErr } = await supabase
          .from('roster_invitations')
          .insert(invitationRows);
        if (inviteErr) {
          console.error('Failed to send roster invitations:', inviteErr);
        }
      }

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

  // Creator-Only Delete Roster Action
  const deleteRoster = async (teamId) => {
    if (!user?.id) {
      return { success: false, error: 'User session offline.' };
    }
    try {
      // 0. Get team details to retrieve team_name
      const { data: teamDetails } = await supabase
        .from('teams')
        .select('team_name')
        .eq('id', teamId)
        .maybeSingle();

      const teamName = teamDetails?.team_name || 'Roster';

      // 1. Get all active teammates (except the IGL/creator)
      const { data: members, error: fetchMembersErr } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId)
        .neq('user_id', user.id);

      if (!fetchMembersErr && members && members.length > 0) {
        // 2. Prepare notifications for every teammate
        const alerts = members.map((m) => ({
          user_id: m.user_id,
          type: 'ROSTER_DISBANDED',
          title: 'Roster Disbanded',
          message: `The roster "${teamName}" was disbanded by the IGL. You are no longer assigned to this squad.`
        }));

        // 3. Insert notifications
        const { error: notifyErr } = await supabase.from('notifications').insert(alerts);
        if (notifyErr) console.warn('Could not insert disband alerts:', notifyErr);
      }

      // Delete child associations first
      await supabase.from('team_members').delete().eq('team_id', teamId);
      
      const { error: teamErr } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId)
        .eq('user_id', user.id); // Guard constraint: only creator can delete

      if (teamErr) throw teamErr;

      await fetchRosters();
      return { success: true };
    } catch (err) {
      console.error('Roster deletion query failed:', err);
      return { success: false, error: err.message || 'Failed to remove roster records.' };
    }
  };

  return {
    selectedTitle,
    setSelectedTitle,
    existingRosters,
    setExistingRosters,
    isLoading,
    error,
    createRoster,
    deleteRoster,
    refreshRosters: fetchRosters
  };
};

export default useRosterManagement;
