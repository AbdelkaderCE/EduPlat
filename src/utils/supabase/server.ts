import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import type { Database } from '../../types/supabase';

import { getSupabaseEnvironment } from './config';

export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnvironment();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server components cannot always write cookies; this keeps auth reads working.
        }
      }
    }
  });
}
