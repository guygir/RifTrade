import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Singleton instance for client-side Supabase client
let supabaseClient: SupabaseClient | null = null;

// Client-side Supabase client (singleton pattern)
export function createSupabaseClient() {
  // Return existing instance if it exists
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // Create and cache the client instance
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
}

// Server-side Supabase client (for API routes)
export function createSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

