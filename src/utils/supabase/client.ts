import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '../../types/supabase';

import { getSupabaseEnvironment } from './config';

export function createClient() {
  const { url, anonKey } = getSupabaseEnvironment();

  return createBrowserClient<Database>(url, anonKey);
}
