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

type AuthState = {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
};

type AuthListener = (state: AuthState) => void;

let authState: AuthState = isDemoMode
  ? { user: DEMO_USER, profile: DEMO_PROFILE, loading: false, error: null }
  : { user: null, profile: null, loading: true, error: null };

const authListeners = new Set<AuthListener>();
let authInitialized = isDemoMode;
let authInitializing = false;
let authSubscription: { unsubscribe: () => void } | null = null;

function emitAuthState(nextState: AuthState) {
  authState = nextState;
  authListeners.forEach((listener) => listener(authState));
}

function patchAuthState(patch: Partial<AuthState>) {
  emitAuthState({ ...authState, ...patch });
}

function subscribeAuthState(listener: AuthListener) {
  authListeners.add(listener);
  listener(authState);
  return () => {
    authListeners.delete(listener);
  };
}

async function fetchProfile(userId: string) {
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
  patchAuthState({ profile: data as Profile, loading: false, error: null });
}

async function initializeAuth() {
  if (isDemoMode || authInitialized || authInitializing) {
    return;
  }

  authInitializing = true;

  try {
    console.log('[useAuth] Checking session...');
    const response: any = await supabase.auth.getSession();
    const session = response?.data?.session;
    const authError = response?.error;

    console.log('[useAuth] Session check result:', { hasSession: !!session, hasError: !!authError });

    if (authError) {
      console.error('[useAuth] Auth error:', authError);
      patchAuthState({ error: authError.message, loading: false });
      authInitialized = true;
      return;
    }

    if (session?.user) {
      console.log('[useAuth] Session found for user:', session.user.id);
      patchAuthState({ user: session.user as AuthUser, loading: true, error: null });
      await fetchProfile(session.user.id);
    } else {
      console.log('[useAuth] No session found');
      patchAuthState({ user: null, profile: null, loading: false, error: null });
    }

    if (!authSubscription) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event: string, sessionState: any) => {
        if (sessionState?.user) {
          patchAuthState({ user: sessionState.user as AuthUser, loading: true, error: null });
          await fetchProfile(sessionState.user.id);
        } else {
          patchAuthState({ user: null, profile: null, loading: false, error: null });
        }
      });

      authSubscription = subscription;
    }

    authInitialized = true;
  } catch (err) {
    console.error('[useAuth] Initialization failed:', err);
    patchAuthState({
      error: err instanceof Error ? err.message : 'Failed to initialize auth',
      loading: false,
      user: null,
      profile: null,
    });
    authInitialized = true;
  } finally {
    authInitializing = false;
  }
}

export function useAuth() {
  const [state, setState] = useState<AuthState>(authState);

  useEffect(() => {
    if (isDemoMode) {
      console.log('[useAuth] In demo mode, skipping Supabase calls');
      return;
    }

    const unsubscribe = subscribeAuthState(setState);
    void initializeAuth();

    return unsubscribe;
  }, []);

  const logout = async () => {
    if (isDemoMode) {
      emitAuthState({ user: null, profile: null, loading: false, error: null });
      return;
    }
    await supabase.auth.signOut();
    emitAuthState({ user: null, profile: null, loading: false, error: null });
  };

  if (isDemoMode) {
    return { user: demoUser, profile: demoProfile, loading: false, error: null, logout };
  }

  return { ...state, logout };
}
