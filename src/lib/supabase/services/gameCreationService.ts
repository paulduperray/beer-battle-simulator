
import { supabase, isSupabaseConfigured } from '../client';

export async function createGame(gameCode: string) {
  // Return mock data if Supabase is not configured
  if (!isSupabaseConfigured) {
    console.warn('Creating mock game because Supabase is not configured');
    return {
      id: 'mock-game-id',
      game_code: gameCode,
      current_round: 1,
      created_at: new Date().toISOString(),
    };
  }

  // Real Supabase implementation
  try {
    const { data, error } = await supabase
      .from('games')
      .insert({
        game_code: gameCode,
        current_round: 1,
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating game:', error);
    return null;
  }
}

export async function joinGame(gameCode: string, role: string) {
  // Return mock data if Supabase is not configured
  if (!isSupabaseConfigured) {
    console.warn('Joining mock game because Supabase is not configured');
    return {
      game: {
        id: 'mock-game-id',
        game_code: gameCode,
        current_round: 1,
      },
      player: {
        id: 'mock-player-id',
        game_id: 'mock-game-id',
        role: role,
      }
    };
  }

  // Real Supabase implementation
  try {
    // First, get the game by code
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('game_code', gameCode)
      .single();

    if (gameError) throw gameError;

    // Then, create a player
    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert({
        game_id: game.id,
        role: role,
      })
      .select('*')
      .single();

    if (playerError) throw playerError;

    return { game, player };
  } catch (error) {
    console.error('Error joining game:', error);
    return { game: null, player: null };
  }
}
