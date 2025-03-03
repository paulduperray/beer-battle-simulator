
import { supabase, isSupabaseConfigured } from '../client';

export async function advanceToNextRound(gameId: string) {
  // Return mock data if Supabase is not configured
  if (!isSupabaseConfigured) {
    console.warn('Mock round advancement because Supabase is not configured');
    return {
      game: {
        id: gameId,
        current_round: 2, 
        game_code: 'MOCK',
      },
      newRound: {
        id: 'mock-round-id',
        game_id: gameId,
        round: 2,
        factory_stock: 10,
        distributor_stock: 10,
        wholesaler_stock: 10,
        retailer_stock: 10,
        factory_cost: 0,
        distributor_cost: 0,
        wholesaler_cost: 0,
        retailer_cost: 0,
      }
    };
  }

  // Real Supabase implementation
  try {
    // Start a transaction
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('current_round')
      .eq('id', gameId)
      .single();

    if (gameError) throw gameError;

    const currentRound = game.current_round;
    const nextRound = currentRound + 1;

    // Get the current round data
    const { data: roundData, error: roundError } = await supabase
      .from('game_rounds')
      .select('*')
      .eq('game_id', gameId)
      .eq('round', currentRound)
      .single();

    if (roundError) throw roundError;

    // Process pending orders
    const { data: pendingOrders, error: ordersError } = await supabase
      .from('pending_orders')
      .select('*')
      .eq('game_id', gameId)
      .eq('fulfilled', false);

    if (ordersError) throw ordersError;

    // Calculate new stock values based on orders
    const newStocks = {
      factory_stock: roundData.factory_stock,
      distributor_stock: roundData.distributor_stock,
      wholesaler_stock: roundData.wholesaler_stock,
      retailer_stock: roundData.retailer_stock,
    };

    // Process orders that are ready to be fulfilled
    for (const order of pendingOrders || []) {
      // Only process orders that have been waiting for 2 rounds
      if (order.round <= currentRound - 2) {
        // Decrease source stock
        if (order.source !== 'production') {
          const sourceStock = `${order.source}_stock`;
          newStocks[sourceStock] = Math.max(0, newStocks[sourceStock] - order.quantity);
        }

        // Increase destination stock
        if (order.destination !== 'customer') {
          const destStock = `${order.destination}_stock`;
          newStocks[destStock] = newStocks[destStock] + order.quantity;
        }

        // Mark order as fulfilled
        await supabase
          .from('pending_orders')
          .update({ fulfilled: true })
          .eq('id', order.id);
      }
    }

    // Create the next round record
    const { data: newRound, error: createError } = await supabase
      .from('game_rounds')
      .insert({
        game_id: gameId,
        round: nextRound,
        ...newStocks,
        factory_cost: roundData.factory_cost,
        distributor_cost: roundData.distributor_cost,
        wholesaler_cost: roundData.wholesaler_cost,
        retailer_cost: roundData.retailer_cost,
      })
      .select('*')
      .single();

    if (createError) throw createError;

    // Update the game's current round
    const { data: updatedGame, error: updateError } = await supabase
      .from('games')
      .update({ current_round: nextRound })
      .eq('id', gameId)
      .select('*')
      .single();

    if (updateError) throw updateError;

    return { game: updatedGame, newRound };
  } catch (error) {
    console.error('Error advancing to next round:', error);
    return { game: null, newRound: null };
  }
}
