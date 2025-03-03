
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types based on our schema
export type Game = {
  id: string;
  game_code: string;
  created_at: string;
  current_round: number;
  status: 'active' | 'completed';
};

export type Player = {
  id: string;
  game_id: string;
  role: 'factory' | 'distributor' | 'wholesaler' | 'retailer' | 'admin';
  created_at: string;
};

export type GameRound = {
  id: string;
  game_id: string;
  round: number;
  factory_stock: number;
  distributor_stock: number;
  wholesaler_stock: number;
  retailer_stock: number;
  factory_cost: number;
  distributor_cost: number;
  wholesaler_cost: number;
  retailer_cost: number;
  created_at: string;
};

export type PendingOrder = {
  id: string;
  game_id: string;
  round: number;
  delivery_round: number;
  amount: number;
  source: 'production' | 'factory' | 'distributor' | 'wholesaler' | 'retailer';
  destination: 'factory' | 'distributor' | 'wholesaler' | 'retailer';
  status: 'pending' | 'completed';
  created_at: string;
};
