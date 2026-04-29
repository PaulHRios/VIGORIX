import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

// If Supabase isn't configured (e.g. on a fresh GH Pages deploy with no secrets),
// we export `null` and the app falls back entirely to localStorage. Auth UI is hidden.
export const supabase =
  url && anon && url.startsWith('http') && !url.includes('YOUR-PROJECT')
    ? createClient(url, anon, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

export const isSupabaseEnabled = !!supabase;
