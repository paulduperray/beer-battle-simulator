
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ntwmdcznhsssyqpjuemg.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50d21kY3puaHNzc3lxcGp1ZW1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwMDMxNzUsImV4cCI6MjA1NjU3OTE3NX0.A53XsGUaOQQn0C_wzwN34UGn_fXDHKbDATTe1NGkAI8';

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export a flag to check if Supabase is properly configured
export const isSupabaseConfigured = true;

console.log('Supabase client initialized');
