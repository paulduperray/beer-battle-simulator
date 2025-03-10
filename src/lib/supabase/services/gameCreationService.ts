
import { supabase } from '../client';

export async function createGame(gameCode: string) {
  try {
    // Create new game
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .insert({ 
        game_code: gameCode,
        shortage_cost: 10,
        holding_cost: 5,
        current_round: 1,
        status: 'active'
      })
      .select('*')
      .single();

    if (gameError) {
      console.error('Error creating game:', gameError);
      return null;
    }

    // Create initial round data
    const { error: roundError } = await supabase
      .from('game_rounds')
      .insert({
        game_id: gameData.id,
        round: 1,
        factory_stock: 10,
        distributor_stock: 10,
        wholesaler_stock: 10,
        retailer_stock: 10
      });

    if (roundError) {
      console.error('Error creating initial round:', roundError);
      return null;
    }

    console.log(`Created game with ID ${gameData.id} and code ${gameCode}`);
    return gameData;
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

    // For the admin role, we need to check if the game exists but don't need to create a new player
    if (role === 'admin') {
      // Return the game data directly without creating a new player
      console.log(`Admin joining game ${gameData.id} without creating player entry`);
      return { game: gameData, player: { role: 'admin' } };
    }

    // Check if a player with this role already exists for this game
    const { data: existingPlayer, error: findError } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', gameData.id)
      .eq('role', role)
      .maybeSingle();
    
    if (existingPlayer) {
      console.log(`Found existing player with role ${role} for game ${gameData.id}`);
      return { game: gameData, player: existingPlayer };
    }
    
    // If no player with this role exists, create a new one
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
