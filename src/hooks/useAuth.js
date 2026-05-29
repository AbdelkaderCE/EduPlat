// ============================================================================
// src/hooks/useAuth.ts
// ============================================================================
import { useEffect, useState } from 'react';
import { isDemoMode, supabase } from '../config/supabaseClient';
const DEMO_USER = {
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
const DEMO_PROFILE = {
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
    const demoRoleParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('demoRole') : null;
    const effectiveDemoRole = isDemoMode && demoRoleParam === 'admin' ? 'admin' : 'student';
    const demoUserActive = effectiveDemoRole === 'admin'
        ? Object.assign(Object.assign({}, DEMO_USER), { id: '00000000-0000-4000-a000-000000000099', email: 'admin@example.com' })
        : DEMO_USER;
    const demoProfileActive = effectiveDemoRole === 'admin'
        ? Object.assign(Object.assign({}, DEMO_PROFILE), { user_id: demoUserActive.id, full_name: 'Demo Admin', email: 'admin@example.com', role: 'admin' })
        : DEMO_PROFILE;
    const [user, setUser] = useState(isDemoMode ? demoUserActive : null);
    const [profile, setProfile] = useState(isDemoMode ? demoProfileActive : null);
    const [loading, setLoading] = useState(isDemoMode ? false : true);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (isDemoMode) {
            return;
        }
        // Check initial session
        supabase.auth.getSession().then(({ data: { session }, error: authError }) => {
            if (authError) {
                setError(authError.message);
                setLoading(false);
                return;
            }
            if (session?.user) {
                setUser(session.user);
                fetchProfile(session.user.id);
            }
            else {
                setLoading(false);
            }
        });
        // Listen for auth changes
        const { data: { subscription }, } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                setUser(session.user);
                await fetchProfile(session.user.id);
            }
            else {
                setUser(null);
                setProfile(null);
            }
        });
        return () => subscription?.unsubscribe();
    }, []);
    const fetchProfile = async (userId) => {
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
            setProfile(data);
        }
        catch (err) {
            console.error('[useAuth] Failed to fetch profile:', err);
            setError(err instanceof Error ? err.message : 'Failed to load profile');
            setProfile(null);
        }
        finally {
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
