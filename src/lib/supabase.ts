import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Standard Supabase Client (Anon Key)
 * Used for client-side reads restricted by RLS.
 */
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as unknown as SupabaseClient;

/**
 * Administrative Supabase Client (Service Role Key)
 * Used for server-side management/discovery (Bypasses RLS).
 * Only accessible in Server Actions and API Routes.
 */
export const adminSupabase = (supabaseUrl && supabaseServiceRoleKey)
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null as unknown as SupabaseClient;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are missing. Anon client initialized as null.');
}

if (!supabaseServiceRoleKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is missing. Database writes will fail.');
}
