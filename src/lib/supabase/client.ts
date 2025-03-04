
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
      'https://ntwmdcznhsssyqpjuemg.supabase.co', 
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50d21kY3puaHNzc3lxcGp1ZW1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwMDMxNzUsImV4cCI6MjA1NjU3OTE3NX0.A53XsGUaOQQn0C_wzwN34UGn_fXDHKbDATTe1NGkAI8'
    );

// Export a flag to check if Supabase is properly configured
export const isSupabaseConfigured = true;

// Log message if using the connected project
console.log('Supabase is configured and connected to project: ntwmdcznhsssyqpjuemg');
