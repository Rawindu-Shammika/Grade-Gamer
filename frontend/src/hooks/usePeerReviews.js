import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import useAuth from './useAuth';

/**
 * usePeerReviews - Peer Review Controller Engine
 * 
 * Manages states and data transactions for the teammate reviews portal.
 */
export const usePeerReviews = () => {
  const { user } = useAuth();
  
  // Primary active states
  const [selectedTitle, setSelectedTitle] = useState('');
  const [selectedTeammateId, setSelectedTeammateId] = useState(null);
  
  // Data states
  const [reviewsList, setReviewsList] = useState([]);
  const [activeTeammates, setActiveTeammates] = useState([]);
  const [overallRating, setOverallRating] = useState(4.9);
  const [reviewedTeammateIds, setReviewedTeammateIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch reviews targeting the current logged-in user to compute dynamic rating averages
  const fetchMyReviews = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('peer_reviews')
        .select('*')
        .eq('target_user_id', user.id);

      if (fetchErr) throw fetchErr;

      setReviewsList(data || []);

      // Calculate dynamic average rating if records exist
      if (data && data.length > 0) {
        const totalScore = data.reduce((sum, r) => {
          const avgScore = (Number(r.communication_score || 0) + 
                            Number(r.reliability_score || 0) + 
                            Number(r.composure_score || 0)) / 3;
          return sum + avgScore;
        }, 0);
        
        const rawAvg = totalScore / data.length;
        const mappedRating = Number((rawAvg * 0.5).toFixed(1));
        setOverallRating(mappedRating || 4.9);
      } else {
        setOverallRating(4.9);
      }
    } catch (err) {
      console.error('Error fetching peer reviews:', err);
      setError(err.message || 'Failed to sync reviews telemetry.');
      setOverallRating(4.9);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Query existing reviews submitted by the active user for the current game title
  const fetchReviewedTeammates = useCallback(async () => {
    if (!user?.id || !selectedTitle) return;
    try {
      const { data: userReviews, error } = await supabase
        .from('peer_reviews')
        .select('target_user_id')
        .eq('reviewer_id', user.id)
        .eq('game_title', selectedTitle);

      if (error) throw error;

      const reviewedIds = new Set(userReviews?.map(r => String(r.target_user_id)));
      setReviewedTeammateIds(reviewedIds);
    } catch (err) {
      console.error('Error fetching reviewed teammates:', err);
    }
  }, [user?.id, selectedTitle]);

  // Fetch real team members from Roster matrices
  const fetchTeammates = useCallback(async () => {
    if (!user?.id || !selectedTitle) return;
    try {
      // 1. Fetch user's membership teams from team_members
      const { data: memberships, error: memErr } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id);

      if (memErr) throw memErr;
      const teamIds = memberships?.map(m => m.team_id) || [];

      if (teamIds.length === 0) {
        setActiveTeammates([]);
        return;
      }

      // 2. Fetch all members belonging to these teams, joining profile information
      const { data: teamMembers, error: membersErr } = await supabase
        .from('team_members')
        .select(`
          id,
          team_id,
          user_id,
          role,
          teams(game_title),
          profiles:user_id(in_game_name, platform_id)
        `)
        .in('team_id', teamIds)
        .neq('user_id', user.id);

      if (membersErr) throw membersErr;

      // Filter by the selected game title
      const filteredMembers = teamMembers?.filter(m => m.teams?.game_title === selectedTitle) || [];

      // Format them for the review UI
      const formattedTeammates = filteredMembers.map((m, idx) => ({
        id: m.id || `member-${idx}`,
        user_id: m.user_id,
        name: m.profiles?.in_game_name || m.profiles?.platform_id || 'Teammate',
        player_name: m.profiles?.in_game_name || m.profiles?.platform_id || 'Teammate',
        role: m.role || 'Player'
      }));

      setActiveTeammates(formattedTeammates);
    } catch (err) {
      console.error('Error fetching teammates for reviews:', err);
      setActiveTeammates([]);
    }
  }, [user?.id, selectedTitle]);

  useEffect(() => {
    fetchMyReviews();
  }, [fetchMyReviews]);

  useEffect(() => {
    fetchTeammates();
  }, [fetchTeammates]);

  useEffect(() => {
    fetchReviewedTeammates();
  }, [fetchReviewedTeammates]);

  // Auto-initialize selectedTeammateId when activeTeammates roster loads
  useEffect(() => {
    if (activeTeammates && activeTeammates.length > 0) {
      // Find the first player who has not been reviewed yet
      const firstUnreviewed = activeTeammates.find(t => !reviewedTeammateIds.has(String(t.user_id)));
      const defaultSelection = firstUnreviewed || activeTeammates[0];
      
      if (!selectedTeammateId || !activeTeammates.some(t => t.id === selectedTeammateId)) {
        setSelectedTeammateId(defaultSelection.id);
      }
    } else {
      setSelectedTeammateId(null);
    }
  }, [activeTeammates, reviewedTeammateIds, selectedTeammateId]);

  // Submit teammate review data
  const submitTeammateReview = async (reviewData) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        return { success: false, error: 'User session offline.' };
      }

      const selectedTeammate = activeTeammates?.find(t => t.id === selectedTeammateId);
      if (!selectedTeammate) {
        return { success: false, error: 'Target teammate selection is missing.' };
      }

      const targetId = selectedTeammate.user_id || selectedTeammate.id || selectedTeammate.player_name;
      const targetUserUuid = selectedTeammate.user_id ? String(targetId) : currentUser.id;

      const isTargetIGL = reviewData.isTargetIGL;
      const overall = isTargetIGL
        ? parseFloat(((Number(reviewData.communication_score) + Number(reviewData.reliability_score) + Number(reviewData.composure_score) + Number(reviewData.leadership_score)) / 4).toFixed(1))
        : parseFloat(((Number(reviewData.communication_score) + Number(reviewData.reliability_score) + Number(reviewData.composure_score)) / 3).toFixed(1));

      const payload = {
        reviewer_id: currentUser.id,
        target_user_id: targetUserUuid,
        game_title: selectedTitle,
        communication_rating: Number(reviewData.communication_score),
        teamplay_rating: Number(reviewData.reliability_score),
        mechanical_rating: Number(reviewData.composure_score),
        leadership_rating: isTargetIGL ? Number(reviewData.leadership_score) : null,
        overall_rating: overall,
        comment: reviewData.constructive_comment ? reviewData.constructive_comment.trim() : null
      };

      if (reviewData.match_id) {
        payload.match_id = reviewData.match_id;
      }

      const { data, error: insertErr } = await supabase
        .from('peer_reviews')
        .insert(payload)
        .select();

      if (insertErr) {
        if (insertErr.code === '23505' || insertErr.message?.includes('unique') || insertErr.message?.includes('already exists')) {
          throw new Error('Manipulative Activity Blocked: You have already submitted a review for this teammate in this tournament node.');
        }
        throw insertErr;
      }

      await fetchMyReviews();
      await fetchReviewedTeammates();
      return { success: true, data: data?.[0] };

    } catch (err) {
      console.error('Teammate review submission failed:', err);
      return { 
        success: false, 
        error: err.message || 'Failed to upload evaluation payload.' 
      };
    }
  };

  return {
    selectedTitle,
    setSelectedTitle,
    selectedTeammateId,
    setSelectedTeammateId,
    reviewsList,
    activeTeammates,
    overallRating,
    reviewedTeammateIds,
    isLoading,
    error,
    submitTeammateReview,
    refreshReviews: fetchMyReviews,
    refreshTeammates: fetchTeammates,
    refreshReviewedTeammates: fetchReviewedTeammates
  };
};

export default usePeerReviews;
