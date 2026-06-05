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
  const { data, error: dbError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (dbError) throw dbError;

  patchAuthState({ profile: data as Profile, loading: false, error: null });
}

async function initializeAuth() {
  if (isDemoMode || authInitialized || authInitializing) return;

  authInitializing = true;

  try {
    const response: any = await supabase.auth.getSession();
    const session = response?.data?.session;
    const authError = response?.error;

    if (authError) {
      patchAuthState({ error: authError.message, loading: false });
      authInitialized = true;
      return;
    }

    if (session?.user) {
      patchAuthState({ user: session.user as AuthUser, loading: true, error: null });
      await fetchProfile(session.user.id);
    } else {
      patchAuthState({ user: null, profile: null, loading: false, error: null });
    }

    if (!authSubscription) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event: string, sessionState: any) => {
          // These events don't need a profile re-fetch
          if (event === 'TOKEN_REFRESHED') return;
          // INITIAL_SESSION fires right after subscription setup — already handled above
          if (event === 'INITIAL_SESSION') return;

          if (sessionState?.user) {
            const isNewUser = authState.user?.id !== sessionState.user.id;
            if (isNewUser) {
              patchAuthState({ user: sessionState.user as AuthUser, loading: true, error: null });
              await fetchProfile(sessionState.user.id);
            }
            // Same user signed in again (e.g. SIGNED_IN after page focus): no-op
          } else {
            // SIGNED_OUT or session expired
            patchAuthState({ user: null, profile: null, loading: false, error: null });
          }
        },
      );

      authSubscription = subscription;
    }

    authInitialized = true;
  } catch (err) {
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
    if (isDemoMode) return;
    const unsubscribe = subscribeAuthState(setState);
    void initializeAuth();
    return unsubscribe;
  }, []);

  const logout = async () => {
    // Clear local state immediately so the UI reacts right away
    emitAuthState({ user: null, profile: null, loading: false, error: null });

    if (isDemoMode) return;

    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // signOut failure doesn't matter — local state is already cleared
    }

    // Reset the singleton so a fresh login re-initializes cleanly
    authInitialized = false;
    authInitializing = false;
    if (authSubscription) {
      authSubscription.unsubscribe();
      authSubscription = null;
    }
  };

  if (isDemoMode) {
    return { user: DEMO_USER, profile: DEMO_PROFILE, loading: false, error: null, logout };
  }

  return { ...state, logout };
}
