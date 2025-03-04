import { supabase } from '../client';

export async function createGame(gameCode: string) {
  try {
    const { data, error } = await supabase
      .from('games')
      .insert({ game_code: gameCode })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating game:', error);
      return null;
    }

    console.log(`Created game with ID ${data.id} and code ${gameCode}`);
    return data;
  } catch (error) {
    console.error('Error in createGame function:', error);
    return null;
  }
}

export async function joinGame(gameCode: string, role: string) {
  try {
    // Find the game by code
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('game_code', gameCode)
      .single();

    if (gameError) {
      console.error('Error finding game:', gameError);
      return { game: null, player: null };
    }

    console.log(`Found game with ID ${gameData.id} for code ${gameCode}`);

    // Create player entry - no longer checking if role exists
    // This allows multiple players with the same role
    const { data: playerData, error: playerError } = await supabase
      .from('players')
      .insert({
        game_id: gameData.id,
        role: role
      })
      .select('*')
      .single();

    if (playerError) {
      console.error('Error creating player:', playerError);
      return { game: gameData, player: null };
    }

    console.log(`Created player with role ${role} for game ${gameData.id}`);

    return { game: gameData, player: playerData };
  } catch (error) {
    console.error('Error in joinGame function:', error);
    return { game: null, player: null };
  }
}
