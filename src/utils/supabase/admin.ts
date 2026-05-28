import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../../types/supabase';

import { getSupabaseEnvironment } from './config';

export function createAdminClient() {
  const { url } = getSupabaseEnvironment();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY. Set it in your environment to use admin operations.');
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
}
