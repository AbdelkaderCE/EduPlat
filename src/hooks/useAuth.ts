// ============================================================================
// src/hooks/useAuth.ts
// ============================================================================

import { useEffect, useState } from 'react';
import { supabase } from '../config/supabaseClient';
import { AuthUser, Profile } from '../types';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session }, error: authError }) => {
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (session?.user) {
        setUser(session.user as AuthUser);
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user as AuthUser);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (dbError) throw dbError;
      setProfile(data as Profile);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return { user, profile, loading, error, logout };
}
