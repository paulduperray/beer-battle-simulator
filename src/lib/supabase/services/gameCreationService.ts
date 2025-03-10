
import { supabase } from '../client';

export async function createGame(gameCode: string) {
  try {
    console.log(`Creating new game with code: ${gameCode}`);
    
    // Create new game with active status
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .insert({ 
        game_code: gameCode,
        shortage_cost: 10,
        holding_cost: 5,
        current_round: 1,
        status: 'active'  // Ensure game is created with active status
      })
      .select('*')
      .single();

    if (gameError) {
      console.error('Error creating game:', gameError);
      return null;
    }
    
    console.log(`Successfully created game with ID: ${gameData.id}, code: ${gameCode}`);

    // Create initial round data with proper values
    const { error: roundError } = await supabase
      .from('game_rounds')
      .insert({
        game_id: gameData.id,
        round: 1,
        factory_stock: 10,
        distributor_stock: 10,
        wholesaler_stock: 10,
        retailer_stock: 10,
        factory_cost: 100,
        distributor_cost: 120,
        wholesaler_cost: 150,
        retailer_cost: 180,
        factory_round_cost: 0,
        distributor_round_cost: 0,
        wholesaler_round_cost: 0,
        retailer_round_cost: 0,
        customer_order: 5
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
    console.log(`Attempting to join game with code: ${gameCode}, role: ${role}`);
    
    if (role === 'admin') {
      // For admin role, try to find the game first
      const { data: games, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('game_code', gameCode);
      
      if (gameError) {
        console.error('Error finding game for admin:', gameError);
        return { game: null, player: null };
      }
      
      // If game exists, return it
      if (games && games.length > 0) {
        const game = games[0];
        console.log(`Admin found existing game with ID ${game.id}`);
        return { game, player: { role: 'admin' } };
      }
      
      // If no game exists, create a new one
      console.log(`Admin creating new game with code ${gameCode}`);
      const newGame = await createGame(gameCode);
      if (newGame) {
        return { game: newGame, player: { role: 'admin' } };
      } else {
        console.error('Failed to create game for admin');
        return { game: null, player: null };
      }
    }
    
    // For non-admin roles, find the game first
    const { data: games, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('game_code', gameCode);

    if (gameError) {
      console.error('Error finding game:', gameError);
      return { game: null, player: null };
    }
    
    // Check if we found any games
    if (!games || games.length === 0) {
      console.error(`No game found with code ${gameCode}`);
      return { game: null, player: null };
    }
    
    const gameData = games[0];
    console.log(`Found game with ID ${gameData.id} for code ${gameCode}`);

    // Check if a player with this role already exists for this game
    const { data: existingPlayer, error: findError } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', gameData.id)
      .eq('role', role)
      .maybeSingle();
    
    if (findError) {
      console.error('Error finding existing player:', findError);
    }
    
    // Allow joining even if the role is already taken
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
