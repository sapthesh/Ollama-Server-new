import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Handle missing credentials gracefully during build/static generation
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as unknown as SupabaseClient; 

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are missing. Supabase client initialized as null.');
}
