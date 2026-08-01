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


