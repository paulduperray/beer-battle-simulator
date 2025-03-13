
import { supabase } from '../client';

export async function createGame(gameCode: string) {
  try {
    console.log(`Creating new game with code: ${gameCode}`);
    
    // Check if the game already exists
    const { data: existingGames, error: checkError } = await supabase
      .from('games')
      .select('id')
      .eq('game_code', gameCode);
      
    if (checkError) {
      console.error('Error checking for existing game:', checkError);
      throw checkError;
    }
    
    // If game already exists, return it
    if (existingGames && existingGames.length > 0) {
      console.log(`Game with code ${gameCode} already exists, returning existing game`);
      
      // Get the full game data
      const { data: gameData, error: getError } = await supabase
        .from('games')
        .select('*')
        .eq('id', existingGames[0].id)
        .single();
        
      if (getError) {
        console.error('Error fetching existing game:', getError);
        throw getError;
      }
      
      return gameData;
    }
    
    // Create new game with active status
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .insert({ 
        game_code: gameCode,
        shortage_cost: 10,
        holding_cost: 5,
        current_round: 1,
        status: 'active'
      })
      .select()
      .single();

    if (gameError) {
      console.error('Error creating game:', gameError);
      throw gameError;
    }
    
    console.log(`Successfully created game with ID: ${gameData.id}, code: ${gameCode}`);
    return gameData;
  } catch (error) {
    console.error('Error in createGame function:', error);
    throw error;
  }
}

export async function joinGame(gameCode: string, role: string) {
  try {
    console.log(`Attempting to join game with code: ${gameCode}, role: ${role}`);
    
    // For admin role, create the game if it doesn't exist
    if (role === 'admin') {
      console.log(`Admin role detected, creating/joining game with code ${gameCode}`);
      try {
        const newGame = await createGame(gameCode);
        if (newGame) {
          console.log(`Admin created/joined game with ID ${newGame.id}`);
          
          // Create admin player record
          const { data: playerData, error: playerError } = await supabase
            .from('players')
            .insert({
              game_id: newGame.id,
              role: 'admin'
            })
            .select()
            .single();
            
          if (playerError) {
            console.error('Error creating admin player:', playerError);
          }
          
          return { game: newGame, player: playerData || { role: 'admin' } };
        }
      } catch (error) {
        console.error('Failed to create game for admin:', error);
        throw error;
      }
    }
    
    // For non-admin roles, find the game
    const { data: games, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('game_code', gameCode);

    if (gameError) {
      console.error('Error finding game:', gameError);
      throw gameError;
    }
    
    // Check if we found any games
    if (!games || games.length === 0) {
      console.error(`No game found with code ${gameCode}`);
      throw new Error(`No game found with code ${gameCode}`);
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
      .select()
      .single();

    if (playerError) {
      console.error('Error creating player:', playerError);
      throw playerError;
    }

    console.log(`Created player with role ${role} for game ${gameData.id}`);
    return { game: gameData, player: playerData };
  } catch (error) {
    console.error('Error in joinGame function:', error);
    throw error;
  }
}
