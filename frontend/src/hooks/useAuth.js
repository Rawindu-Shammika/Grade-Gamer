import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

/**
 * Custom Hook that encapsulates Supabase authentication state and methods.
 * Ensures low coupling by hiding connection details from views.
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // 1. Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        setUser(session?.user || null);
      } catch (err) {
        console.error('Session retrieval error:', err);
        setError(err.message || 'Failed to sync authentication session.');
      } finally {
        setLoading(false);
      }
    };
    getInitialSession();

    // 2. Listen to authentication state updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    setError('');
    setLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (err) throw err;
      return data.user;
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, metadata = {}) => {
    setError('');
    setLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
      if (err) throw err;
      return data.user;
    } catch (err) {
      setError(err.message || 'Registration failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setError('');
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signOut();
      if (err) throw err;
      setUser(null);
    } catch (err) {
      setError(err.message || 'Logout failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = logout;

  const [profile, setProfile] = useState(null);

  const fetchProfile = async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile in useAuth:', err);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id);
    } else {
      setProfile(null);
    }
  }, [user?.id]);

  const refreshProfile = async () => {
    try {
      const { data: { user: updatedUser }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      setUser(updatedUser);
      if (updatedUser?.id) {
        await fetchProfile(updatedUser.id);
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
    }
  };

  const deleteAccount = async () => {
    if (!user) return;
    const { error } = await supabase.rpc('delete_user_account');
    if (error) throw error;
    await supabase.auth.signOut();
    setUser(null);
  };

  return {
    user,
    profile,
    loading,
    error,
    login,
    register,
    logout,
    logoutUser,
    setError,
    refreshProfile,
    deleteAccount,
  };
};

export default useAuth;
