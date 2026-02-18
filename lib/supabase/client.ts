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

  // Create and cache the client instance with auth persistence
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return supabaseClient;
}

// Server-side client moved to lib/supabase/server.ts to avoid importing 'next/headers' in client components
export function createSupabaseServerClient() {
  // This is a fallback for non-server contexts
  // Use lib/supabase/server.ts for actual server-side usage
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

