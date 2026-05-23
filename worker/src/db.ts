import { createClient } from '@supabase/supabase-js';
import type { Env } from './types';

export function getDb(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_KEY, {
    auth: { persistSession: false },
  });
}
