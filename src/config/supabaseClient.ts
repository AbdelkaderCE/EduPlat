// ============================================================================
// src/config/supabaseClient.ts
// ============================================================================

import { createClient } from '@supabase/supabase-js';

const DEMO_MODE = (process.env.REACT_APP_DEMO_MODE || 'false') === 'true';
let SUPABASE_URL = (process.env.REACT_APP_SUPABASE_URL || '').trim();
let SUPABASE_ANON_KEY = (process.env.REACT_APP_SUPABASE_ANON_KEY || '').trim();

type DemoSupabaseClient = {
  auth: {
    getSession: () => Promise<{ data: { session: null }; error: null }>;
    onAuthStateChange: () => { data: { subscription: { unsubscribe: () => void } } };
    signOut: () => Promise<{ error: null }>;
    signInWithPassword: () => Promise<{ data: { user: { id: string; email: string }; session: null }; error: null }>;
  };
  from: (table: string) => any;
  storage: {
    from: (bucket: string) => {
      createSignedUrl: (path: string, expiresIn: number) => Promise<{ data: { signedUrl: string } | null; error: Error | null }>;
    };
  };
  rpc: (...args: any[]) => Promise<{ data: null; error: Error }>;
};

function createDemoSupabaseClient(): DemoSupabaseClient {
  return {
    auth: {
      async getSession() {
        return { data: { session: null }, error: null };
      },
      onAuthStateChange() {
        return {
          data: {
            subscription: {
              unsubscribe() {},
            },
          },
        };
      },
      async signOut() {
        return { error: null };
      },
      async signInWithPassword() {
        return {
          data: {
            user: {
              id: '00000000-0000-4000-a000-000000000001',
              email: 'demo@example.com',
            },
            session: null,
          },
          error: null,
        } as any;
      },
    } as any,
    from() {
      return {
        select() {
          // simple query builder mock supporting .eq(), .is(), .in(), .single()
          const builder: any = {
            _data: null,
            eq(_field: string, _val: any) {
              return builder;
            },
            is(_field: string, _val: any) {
              return builder;
            },
            in(_field: string, _vals: any[]) {
              return builder;
            },
            single: async () => ({ data: null, error: null }),
          };

          // Make builder thenable so `await supabase.from(...).select()` works
          builder.then = (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve);
          builder.catch = (/*err*/) => Promise.resolve({ data: [], error: null });

          return builder;
        },
        async list() {
          return { data: null, error: null };
        },
        async createSignedUrl() {
          return { data: null, error: new Error('demo mode: storage unavailable') };
        },
      } as any;
    },
    storage: {
      from() {
        return {
          async createSignedUrl() {
            return { data: { signedUrl: '/demo-download' }, error: null };
          },
        };
      },
    },
    async rpc() {
      return { data: null, error: new Error('demo mode') };
    },
  };
}

const isDemoMode = DEMO_MODE || !SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes('placeholder') || SUPABASE_ANON_KEY.includes('placeholder');

export { isDemoMode };

console.log('[supabaseClient] DEMO_MODE:', DEMO_MODE);
console.log('[supabaseClient] isDemoMode:', isDemoMode);
console.log('[supabaseClient] SUPABASE_URL (full):', SUPABASE_URL);
console.log('[supabaseClient] SUPABASE_URL (length):', SUPABASE_URL?.length);
console.log('[supabaseClient] SUPABASE_URL (chars):', SUPABASE_URL?.split('').map((c, i) => `${i}:${c.charCodeAt(0)}`).join(', '));
console.log('[supabaseClient] SUPABASE_ANON_KEY (length):', SUPABASE_ANON_KEY?.length);

// Use demo client stub if needed, otherwise create real Supabase client
let supabase: any;

if (isDemoMode) {
  console.log('[supabaseClient] Using DEMO client stub');
  supabase = createDemoSupabaseClient();
} else {
  console.log('[supabaseClient] Using REAL Supabase client');
  console.log('[supabaseClient] About to call createClient with:', {
    url: SUPABASE_URL,
    key: SUPABASE_ANON_KEY?.substring(0, 20) + '...',
  });
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[supabaseClient] Successfully created real client');
  } catch (err) {
    console.error('[supabaseClient] Failed to create real client, falling back to demo:', err);
    supabase = createDemoSupabaseClient();
  }
}

export { supabase };

export type { Session } from '@supabase/supabase-js';
