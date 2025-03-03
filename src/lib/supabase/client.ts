
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase credentials are available
const hasCredentials = supabaseUrl && supabaseAnonKey;

// Create a client with error handling
export const supabase = hasCredentials 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient(
      'https://placeholder-url.supabase.co', 
      'placeholder-key'
    );

// Export a flag to check if Supabase is properly configured
export const isSupabaseConfigured = hasCredentials;

// Log message if credentials are missing
if (!hasCredentials) {
  console.warn(
    'Supabase credentials are missing. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables. The application will run in offline mode with limited functionality.'
  );
}
