
import { supabase, Game, Player, GameRound, PendingOrder } from './client';

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

// Get game data
export const getGameData = async (gameId: string): Promise<{ rounds: GameRound[]; pendingOrders: PendingOrder[] } | null> => {
  const { data: rounds, error: roundsError } = await supabase
    .from('game_rounds')
    .select('*')
    .eq('game_id', gameId)
    .order('round', { ascending: true });
  
  if (roundsError) {
    console.error('Error fetching game rounds:', roundsError);
    return null;
  }
  
  const { data: pendingOrders, error: ordersError } = await supabase
    .from('pending_orders')
    .select('*')
    .eq('game_id', gameId)
    .order('created_at', { ascending: true });
  
  if (ordersError) {
    console.error('Error fetching pending orders:', ordersError);
    return null;
  }
  
  return { rounds, pendingOrders };
};

// Place an order
export const placeOrder = async (
  gameId: string,
  round: number,
  amount: number,
  source: string,
  destination: string
): Promise<PendingOrder | null> => {
  // Orders are delivered after 2 rounds
  const deliveryRound = round + 2;
  
  const { data, error } = await supabase
    .from('pending_orders')
    .insert({
      game_id: gameId,
      round,
      delivery_round: deliveryRound,
      amount,
      source,
      destination,
      status: 'pending'
    })
    .select('*')
    .single();
  
  if (error) {
    console.error('Error placing order:', error);
    return null;
  }
  
  return data;
};

// Update costs based on order
export const updateCosts = async (
  gameId: string,
  round: number,
  role: string,
  costIncrease: number
): Promise<GameRound | null> => {
  // Get the current round data
  const { data: currentRound, error: fetchError } = await supabase
    .from('game_rounds')
    .select('*')
    .eq('game_id', gameId)
    .eq('round', round)
    .single();
  
  if (fetchError || !currentRound) {
    console.error('Error fetching current round:', fetchError);
    return null;
  }
  
  // Update the cost for the specific role
  const costField = `${role}_cost`;
  const updatedCost = currentRound[costField] + costIncrease;
  
  const updateData = {};
  updateData[costField] = updatedCost;
  
  const { data: updatedRound, error: updateError } = await supabase
    .from('game_rounds')
    .update(updateData)
    .eq('id', currentRound.id)
    .select('*')
    .single();
  
  if (updateError) {
    console.error('Error updating costs:', updateError);
    return null;
  }
  
  return updatedRound;
};

// Advance to next round
export const advanceToNextRound = async (gameId: string): Promise<{ game: Game | null; newRound: GameRound | null }> => {
  // Get current game information
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();
  
  if (gameError || !game) {
    console.error('Error fetching game:', gameError);
    return { game: null, newRound: null };
  }
  
  // Get the latest round data
  const { data: lastRound, error: roundError } = await supabase
    .from('game_rounds')
    .select('*')
    .eq('game_id', gameId)
    .eq('round', game.current_round)
    .single();
  
  if (roundError || !lastRound) {
    console.error('Error fetching last round:', roundError);
    return { game, newRound: null };
  }
  
  // Create new round data based on previous round
  const nextRound = game.current_round + 1;
  const newRoundData = {
    game_id: gameId,
    round: nextRound,
    factory_stock: lastRound.factory_stock,
    distributor_stock: lastRound.distributor_stock,
    wholesaler_stock: lastRound.wholesaler_stock,
    retailer_stock: lastRound.retailer_stock,
    factory_cost: lastRound.factory_cost,
    distributor_cost: lastRound.distributor_cost,
    wholesaler_cost: lastRound.wholesaler_cost,
    retailer_cost: lastRound.retailer_cost
  };
  
  // Process orders that are ready for delivery in this round
  const { data: ordersToProcess, error: ordersError } = await supabase
    .from('pending_orders')
    .select('*')
    .eq('game_id', gameId)
    .eq('delivery_round', nextRound)
    .eq('status', 'pending');
  
  if (ordersError) {
    console.error('Error fetching orders to process:', ordersError);
    return { game, newRound: null };
  }
  
  // Process each order
  for (const order of ordersToProcess) {
    // Update stocks based on the order
    if (order.destination === 'retailer') {
      newRoundData.retailer_stock += order.amount;
      newRoundData.wholesaler_stock = Math.max(0, newRoundData.wholesaler_stock - order.amount);
    } else if (order.destination === 'wholesaler') {
      newRoundData.wholesaler_stock += order.amount;
      newRoundData.distributor_stock = Math.max(0, newRoundData.distributor_stock - order.amount);
    } else if (order.destination === 'distributor') {
      newRoundData.distributor_stock += order.amount;
      newRoundData.factory_stock = Math.max(0, newRoundData.factory_stock - order.amount);
    } else if (order.destination === 'factory') {
      newRoundData.factory_stock += order.amount; // Production creates new stock
    }
    
    // Mark the order as completed
    await supabase
      .from('pending_orders')
      .update({ status: 'completed' })
      .eq('id', order.id);
  }
  
  // Add random variations to make the game more interesting
  newRoundData.factory_stock = Math.max(0, newRoundData.factory_stock + Math.floor(Math.random() * 6) - 2);
  newRoundData.distributor_stock = Math.max(0, newRoundData.distributor_stock + Math.floor(Math.random() * 4) - 2);
  newRoundData.wholesaler_stock = Math.max(0, newRoundData.wholesaler_stock + Math.floor(Math.random() * 4) - 2);
  newRoundData.retailer_stock = Math.max(0, newRoundData.retailer_stock + Math.floor(Math.random() * 4) - 2);
  
  // Insert the new round
  const { data: newRound, error: insertError } = await supabase
    .from('game_rounds')
    .insert(newRoundData)
    .select('*')
    .single();
  
  if (insertError) {
    console.error('Error creating new round:', insertError);
    return { game, newRound: null };
  }
  
  // Update the game's current round
  const { data: updatedGame, error: updateError } = await supabase
    .from('games')
    .update({ current_round: nextRound })
    .eq('id', gameId)
    .select('*')
    .single();
  
  if (updateError) {
    console.error('Error updating game round:', updateError);
    return { game, newRound };
  }
  
  return { game: updatedGame, newRound };
};

// Get player stocks and pending orders for admin view
export const getAdminViewData = async (gameId: string): Promise<{
  stocks: Record<string, number>;
  pendingOrders: Record<string, number>;
  incomingDeliveries: Record<string, number>;
} | null> => {
  const { data: latestRound, error: roundError } = await supabase
    .from('game_rounds')
    .select('*')
    .eq('game_id', gameId)
    .order('round', { ascending: false })
    .limit(1)
    .single();
    
  if (roundError || !latestRound) {
    console.error('Error fetching latest round:', roundError);
    return null;
  }
  
  const { data: pendingOrders, error: ordersError } = await supabase
    .from('pending_orders')
    .select('*')
    .eq('game_id', gameId)
    .eq('status', 'pending');
  
  if (ordersError) {
    console.error('Error fetching pending orders:', ordersError);
    return null;
  }
  
  const stocks = {
    factory: latestRound.factory_stock,
    distributor: latestRound.distributor_stock,
    wholesaler: latestRound.wholesaler_stock,
    retailer: latestRound.retailer_stock
  };
  
  // Count pending orders for each role (source)
  const pendingOrdersByRole = {
    factory: 0,
    distributor: 0,
    wholesaler: 0,
    retailer: 0
  };
  
  // Count incoming deliveries for each role (destination)
  const incomingDeliveriesByRole = {
    factory: 0,
    distributor: 0,
    wholesaler: 0,
    retailer: 0
  };
  
  pendingOrders.forEach(order => {
    // Increment pending orders for the source
    if (order.source !== 'production' && pendingOrdersByRole[order.source] !== undefined) {
      pendingOrdersByRole[order.source] += order.amount;
    }
    
    // Increment incoming deliveries for the destination
    if (incomingDeliveriesByRole[order.destination] !== undefined) {
      incomingDeliveriesByRole[order.destination] += order.amount;
    }
  });
  
  return {
    stocks,
    pendingOrders: pendingOrdersByRole,
    incomingDeliveries: incomingDeliveriesByRole
  };
};

// Subscribe to real-time updates for a game
export const subscribeToGameUpdates = (
  gameId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`game-updates-${gameId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_rounds',
        filter: `game_id=eq.${gameId}`
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pending_orders',
        filter: `game_id=eq.${gameId}`
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${gameId}`
      },
      callback
    )
    .subscribe();
};
