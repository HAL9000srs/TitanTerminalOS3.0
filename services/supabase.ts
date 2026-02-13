import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[SUPABASE CONFIG] Debugging Connection:');
console.log('URL:', supabaseUrl ? 'Found' : 'Missing');
console.log('Key:', supabaseAnonKey ? 'Found' : 'Missing');

// Professional Pattern: Singleton instance with safety check
let client: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey);
    console.log('[SUPABASE CONFIG] Client initialized successfully.');
  } catch (err) {
    console.error('[SUPABASE CONFIG] Initialization Error:', err);
  }
} else {
  console.error('[CRITICAL] Supabase config missing from .env.local');
  console.error('Expected VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

// SAFE FALLBACK: If client failed to initialize, return a Proxy that logs errors instead of crashing
// This prevents the "White Screen of Death" when env vars are missing
const safeClient = client || new Proxy({} as SupabaseClient, {
    get: (target, prop) => {
        if (prop === 'auth') {
            return {
                signUp: async () => ({ error: { message: 'Supabase Not Configured' } }),
                signInWithPassword: async () => ({ error: { message: 'Supabase Not Configured' } }),
                signOut: async () => ({ error: { message: 'Supabase Not Configured' } }),
                getSession: async () => ({ data: { session: null }, error: null }),
                getUser: async () => ({ data: { user: null }, error: null }),
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            };
        }
        if (prop === 'from') {
             return () => ({
                 select: () => ({
                     eq: () => ({
                         single: async () => ({ data: null, error: { message: 'Supabase Not Configured' } }),
                         data: null, error: null,
                     }),
                     data: null, error: null,
                 }),
                 upsert: async () => ({ error: { message: 'Supabase Not Configured' } }),
                 delete: () => ({ in: async () => ({ error: { message: 'Supabase Not Configured' } }) }),
             })
        }
        console.error(`[SUPABASE ERROR] Attempted to access '${String(prop)}' on uninitialized client.`);
        return () => ({ error: { message: 'Supabase Not Configured' } });
    }
});

export const supabase = safeClient;
