
import { supabase, Game, GameRound } from '../client';

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
