import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isValidSupabaseUrl = (() => {
  if (!supabaseUrl || !supabaseAnonKey) return false;

  try {
    const url = new URL(supabaseUrl);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
})();

export const supabase = isValidSupabaseUrl
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
