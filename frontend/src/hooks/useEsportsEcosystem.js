import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import useAuth from './useAuth';

/**
 * useEsportsEcosystem - Unified System Linkage Hook
 * 
 * Interconnects Roster Management, Peer Reviews, and Dashboard.
 * Queries teams/rosters for the active user and selected game title with intelligent fallbacks.
 */
export const useEsportsEcosystem = (activeSelectedGame) => {
  const { user } = useAuth();
  const [currentActiveRoster, setCurrentActiveRoster] = useState(null);
  const [userRole, setUserRole] = useState('In Game Leader IGL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEcosystemData = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch user's full name from verified_resumes
      const { data: resumeData } = await supabase
        .from('verified_resumes')
        .select('full_name')
        .eq('user_id', user.id)
        .maybeSingle();

      const userFullName = resumeData?.full_name || 'Rawindu Shammika';
      const firstName = userFullName.split(' ')[0].toLowerCase();

      // 2. Fetch all teams created by user ordered by latest
      const { data: createdTeams, error: createdErr } = await supabase
        .from('teams')
        .select('*, team_members(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (createdErr) throw createdErr;

      let targetTeam = null;

      if (createdTeams && createdTeams.length > 0) {
        // Priority A: Team matching activeSelectedGame exactly or loosely
        targetTeam = createdTeams.find(
          (t) => t.game_title?.toLowerCase().includes(activeSelectedGame?.toLowerCase()) ||
                 activeSelectedGame?.toLowerCase().includes(t.game_title?.toLowerCase())
        );
        // Priority B: Latest team created by user
        if (!targetTeam) {
          targetTeam = createdTeams[0];
        }
      } else {
        // Priority C: Query team_members for user's membership
        const { data: memberRows, error: memberErr } = await supabase
          .from('team_members')
          .select('*, teams(*)')
          .eq('user_id', user.id);

        if (memberErr) throw memberErr;

        if (memberRows && memberRows.length > 0) {
          const matched = memberRows.find(
            (m) => m.teams && m.teams.game_title?.toLowerCase() === activeSelectedGame?.toLowerCase()
          ) || memberRows[0];

          if (matched && matched.teams) {
            const { data: fullTeam, error: fullTeamErr } = await supabase
              .from('teams')
              .select('*, team_members(*)')
              .eq('id', matched.team_id)
              .maybeSingle();

            if (!fullTeamErr && fullTeam) {
              targetTeam = fullTeam;
            }
          }
        }
      }

      if (targetTeam) {
        setCurrentActiveRoster(targetTeam);

        // Find logged in user's role inside the roster
        const selfMember = targetTeam.team_members?.find(
          (m) => m.user_id === user.id
        ) || targetTeam.team_members?.[0];
        
        if (selfMember && selfMember.role) {
          setUserRole(selfMember.role);
        } else {
          setUserRole(targetTeam.game_title === 'F1 25' ? 'Main Driver' : 'In Game Leader IGL');
        }
      } else {
        setCurrentActiveRoster(null);
        setUserRole('In Game Leader IGL');
      }

    } catch (err) {
      console.error('Error fetching ecosystem linkages:', err);
      setError(err.message || 'Ecosystem sync failed.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, activeSelectedGame]);

  useEffect(() => {
    fetchEcosystemData();
  }, [fetchEcosystemData]);

  return {
    currentActiveRoster,
    userRole,
    isLoading,
    error,
    refreshEcosystem: fetchEcosystemData
  };
};

export default useEsportsEcosystem;
