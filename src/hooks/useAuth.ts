// ============================================================================
// src/hooks/useAuth.ts
// ============================================================================

import { useEffect, useState } from 'react';
import { isDemoMode, supabase } from '../config/supabaseClient';
import { AuthUser, Profile } from '../types';

const DEMO_USER: AuthUser = {
  id: '00000000-0000-4000-a000-000000000001',
  email: 'demo@example.com',
  email_confirmed_at: new Date().toISOString(),
  phone: null,
  confirmation_sent_at: null,
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  identities: [],
  aud: 'authenticated',
  role: 'authenticated',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const DEMO_PROFILE: Profile = {
  user_id: DEMO_USER.id,
  full_name: 'Demo Student',
  email: DEMO_USER.email,
  role: 'student',
  status: 'active',
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export function useAuth() {
  // Allow selecting an admin demo via URL: ?demoRole=admin
  const demoRoleParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('demoRole') : null;
  const effectiveDemoRole = isDemoMode && demoRoleParam === 'admin' ? 'admin' : 'student';

  const demoUser = {
    ...DEMO_USER,
    id: effectiveDemoRole === 'admin' ? '00000000-0000-4000-a000-000000000099' : DEMO_USER.id,
  } as AuthUser;

  const demoProfile = {
    ...DEMO_PROFILE,
    role: effectiveDemoRole === 'admin' ? 'admin' : DEMO_PROFILE.role,
    full_name: effectiveDemoRole === 'admin' ? 'Demo Admin' : DEMO_PROFILE.full_name,
    email: effectiveDemoRole === 'admin' ? 'admin@example.com' : DEMO_PROFILE.email,
  } as Profile;

  const [user, setUser] = useState<AuthUser | null>(isDemoMode ? demoUser : null);
  const [profile, setProfile] = useState<Profile | null>(isDemoMode ? demoProfile : null);
  const [loading, setLoading] = useState<boolean>(isDemoMode ? false : true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDemoMode) {
      // In demo mode, skip Supabase calls and return mock user/profile
      console.log('[useAuth] In demo mode, skipping Supabase calls');
      return;
    }

    console.log('[useAuth] Checking session...');
    // Check initial session
    supabase.auth.getSession().then((response: any) => {
      const session = response?.data?.session;
      const authError = response?.error;

      console.log('[useAuth] Session check result:', { hasSession: !!session, hasError: !!authError });

      if (authError) {
        console.error('[useAuth] Auth error:', authError);
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (session?.user) {
        console.log('[useAuth] Session found for user:', session.user.id);
        setUser(session.user as AuthUser);
        fetchProfile(session.user.id);
      } else {
        console.log('[useAuth] No session found');
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: string, session: any) => {
      if (session?.user) {
        setUser(session.user as AuthUser);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('[useAuth] Fetching profile for user:', userId);
      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (dbError) {
        console.error('[useAuth] Database error:', dbError);
        throw dbError;
      }
      
      console.log('[useAuth] Profile fetched:', data);
      setProfile(data as Profile);
    } catch (err) {
      console.error('[useAuth] Failed to fetch profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (isDemoMode) {
      setUser(null);
      setProfile(null);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return { user, profile, loading, error, logout };
}
