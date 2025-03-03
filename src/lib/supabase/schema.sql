
-- Enable Row Level Security
ALTER TABLE IF EXISTS public.games DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.players DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.game_rounds DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pending_orders DISABLE ROW LEVEL SECURITY;

-- Games table
CREATE TABLE IF NOT EXISTS public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  current_round INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed'))
);

-- Players table
CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('factory', 'distributor', 'wholesaler', 'retailer', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(game_id, role)
);

-- Game rounds table to store stock and cost data for each round
CREATE TABLE IF NOT EXISTS public.game_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  factory_stock INTEGER NOT NULL DEFAULT 15,
  distributor_stock INTEGER NOT NULL DEFAULT 12,
  wholesaler_stock INTEGER NOT NULL DEFAULT 10,
  retailer_stock INTEGER NOT NULL DEFAULT 8,
  factory_cost INTEGER NOT NULL DEFAULT 100,
  distributor_cost INTEGER NOT NULL DEFAULT 120,
  wholesaler_cost INTEGER NOT NULL DEFAULT 150,
  retailer_cost INTEGER NOT NULL DEFAULT 180,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(game_id, round)
);

-- Pending orders table
CREATE TABLE IF NOT EXISTS public.pending_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  delivery_round INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('production', 'factory', 'distributor', 'wholesaler', 'retailer')),
  destination TEXT NOT NULL CHECK (destination IN ('factory', 'distributor', 'wholesaler', 'retailer')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_games_game_code ON public.games(game_code);
CREATE INDEX IF NOT EXISTS idx_players_game_id ON public.players(game_id);
CREATE INDEX IF NOT EXISTS idx_game_rounds_game_id_round ON public.game_rounds(game_id, round);
CREATE INDEX IF NOT EXISTS idx_pending_orders_game_id ON public.pending_orders(game_id);
CREATE INDEX IF NOT EXISTS idx_pending_orders_delivery_round ON public.pending_orders(delivery_round);

-- Create functions and triggers
CREATE OR REPLACE FUNCTION public.create_initial_round()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.game_rounds (game_id, round)
  VALUES (NEW.id, 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create initial round when a game is created
DROP TRIGGER IF EXISTS create_initial_round_trigger ON public.games;
CREATE TRIGGER create_initial_round_trigger
AFTER INSERT ON public.games
FOR EACH ROW
EXECUTE FUNCTION public.create_initial_round();
