
import { supabase, Game, Player } from '../client';

// Create a new game
export const createGame = async (gameCode: string): Promise<Game | null> => {
  const { data, error } = await supabase
    .from('games')
    .insert({ game_code: gameCode })
    .select('*')
    .single();
  
  if (error) {
    console.error('Error creating game:', error);
    return null;
  }
  
  return data;
};

// Join a game
export const joinGame = async (gameCode: string, role: string): Promise<{ game: Game | null; player: Player | null }> => {
  // First, find the game
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('*')
    .eq('game_code', gameCode)
    .eq('status', 'active')
    .single();
  
  if (gameError || !game) {
    console.error('Error finding game:', gameError);
    return { game: null, player: null };
  }
  
  // Then, create the player
  const { data: player, error: playerError } = await supabase
    .from('players')
    .insert({ game_id: game.id, role })
    .select('*')
    .single();
  
  if (playerError) {
    console.error('Error joining game:', playerError);
    return { game, player: null };
  }
  
  return { game, player };
};
