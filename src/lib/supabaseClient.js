// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[Supabase Connection Check] supabaseUrl:', supabaseUrl);
console.log('[Supabase Connection Check] supabaseAnon is defined:', !!supabaseAnon);

if (!supabaseUrl || !supabaseAnon) {
    throw new Error(
        '[Orbit] Missing Supabase env vars. ' +
        'Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env'
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnon);

// Simple test query run once on app load
(async () => {
  try {
    console.log('[Supabase Connection Check] Initiating test query on "settings" table...');
    const { data, error } = await supabase.from('settings').select('*');
    if (error) {
      console.error('[Supabase Connection Check] Test query failed:', error);
    } else {
      console.log('[Supabase Connection Check] Test query succeeded! Data:', data);
    }
  } catch (err) {
    console.error('[Supabase Connection Check] Test query caught error:', err);
  }
})();
