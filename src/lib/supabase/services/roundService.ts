
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
      .select('current_round, shortage_cost, holding_cost')
      .eq('id', gameId)
      .single();

    if (gameError) throw gameError;

    const currentRound = game.current_round;
    const nextRound = currentRound + 1;
    const shortageCost = game.shortage_cost || 10;
    const holdingCost = game.holding_cost || 5;

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
      .eq('status', 'pending');

    if (ordersError) throw ordersError;

    // Calculate new stock values based on orders
    const newStocks = {
      factory_stock: roundData.factory_stock,
      distributor_stock: roundData.distributor_stock,
      wholesaler_stock: roundData.wholesaler_stock,
      retailer_stock: roundData.retailer_stock,
    };

    // Generate a new customer order (for retailer) between 3-7 units
    const customerOrder = Math.floor(Math.random() * 5) + 3;

    // Process orders that are due for delivery in the next round
    for (const order of pendingOrders || []) {
      if (order.delivery_round === nextRound) {
        // Decrease source stock if not production
        if (order.source !== 'production') {
          const sourceStock = `${order.source}_stock`;
          newStocks[sourceStock] = newStocks[sourceStock] - order.quantity;
        }

        // Increase destination stock if not customer
        if (order.destination !== 'customer') {
          const destStock = `${order.destination}_stock`;
          newStocks[destStock] = newStocks[destStock] + order.quantity;
        }

        // Mark order as being delivered next round
        await supabase
          .from('pending_orders')
          .update({ status: 'next_round' })
          .eq('id', order.id);
      }
    }

    // Process retailer selling to customers (if this is round 2+)
    if (currentRound > 1) {
      // Retailer loses stock based on customer order from previous round
      const prevCustomerOrder = roundData.customer_order || 5;
      newStocks.retailer_stock = newStocks.retailer_stock - prevCustomerOrder;
    }

    // Calculate costs for this round
    const roundCosts = {
      factory_round_cost: 0,
      distributor_round_cost: 0,
      wholesaler_round_cost: 0,
      retailer_round_cost: 0,
    };

    // Calculate holding and shortage costs for each player
    for (const role of ['factory', 'distributor', 'wholesaler', 'retailer']) {
      const stockKey = `${role}_stock`;
      const costKey = `${role}_round_cost`;
      
      if (newStocks[stockKey] < 0) {
        // Shortage cost
        roundCosts[costKey] = Math.abs(newStocks[stockKey]) * shortageCost;
      } else {
        // Holding cost
        roundCosts[costKey] = newStocks[stockKey] * holdingCost;
      }
    }

    // Create the next round record
    const { data: newRound, error: createError } = await supabase
      .from('game_rounds')
      .insert({
        game_id: gameId,
        round: nextRound,
        ...newStocks,
        customer_order: customerOrder,
        factory_cost: roundData.factory_cost + roundCosts.factory_round_cost,
        distributor_cost: roundData.distributor_cost + roundCosts.distributor_round_cost,
        wholesaler_cost: roundData.wholesaler_cost + roundCosts.wholesaler_round_cost,
        retailer_cost: roundData.retailer_cost + roundCosts.retailer_round_cost,
        factory_round_cost: roundCosts.factory_round_cost,
        distributor_round_cost: roundCosts.distributor_round_cost,
        wholesaler_round_cost: roundCosts.wholesaler_round_cost,
        retailer_round_cost: roundCosts.retailer_round_cost,
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

    // Mark delivered orders as completed
    await supabase
      .from('pending_orders')
      .update({ status: 'completed' })
      .eq('game_id', gameId)
      .eq('status', 'next_round');

    return { game: updatedGame, newRound };
  } catch (error) {
    console.error('Error advancing to next round:', error);
    return { game: null, newRound: null };
  }
}
