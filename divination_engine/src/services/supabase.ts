import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Environment variables required for Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!SUPABASE_URL) {
  console.error(
    'VITE_SUPABASE_URL is missing!\n' +
    'Please add it to your .env file. See divination_engine/.env.example for details.\n' +
    'Get your URL from: https://app.supabase.com/project/_/settings/api'
  )
}

if (!SUPABASE_ANON_KEY) {
  console.error(
    'VITE_SUPABASE_ANON_KEY is missing!\n' +
    'Please add it to your .env file. See divination_engine/.env.example for details.\n' +
    'Get your anon key from: https://app.supabase.com/project/_/settings/api'
  )
}

// Create Supabase client only if required variables are present
let supabase: SupabaseClient | null = null

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  })
} else {
  // In development, provide a no-op stub to prevent crashes
  if (import.meta.env.DEV) {
    console.warn(
      'Running in development mode without Supabase configuration.\n' +
      'Authentication features will be disabled until you configure Supabase.'
    )
    
    // Create a mock client that throws helpful errors when auth methods are called
    supabase = {
      auth: {
        signUp: () => Promise.reject(new Error('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')),
        signInWithPassword: () => Promise.reject(new Error('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')),
        signOut: () => Promise.reject(new Error('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')),
        getUser: () => Promise.reject(new Error('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')),
        onAuthStateChange: () => ({ data: { subscription: null } })
      }
    } as unknown as SupabaseClient
  } else {
    // In production, fail fast to avoid silent failures
    throw new Error(
      'Supabase configuration is required in production. ' +
      'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'
    )
  }
}

// Export the typed Supabase client
export { supabase }
export default supabase

// Export types for convenience
export type { SupabaseClient, User, Session, AuthError } from '@supabase/supabase-js'
