import { supabase, isSupabaseConfigured } from '../client';

export async function getGameData(gameId: string) {
  // Return mock data if Supabase is not configured
  if (!isSupabaseConfigured) {
    console.warn('Returning mock game data because Supabase is not configured');
    return {
      id: gameId,
      game_code: 'MOCK',
      current_round: 1,
      rounds: [
        {
          round: 1,
          factory_stock: 10,
          distributor_stock: 10,
          wholesaler_stock: 10,
          retailer_stock: 10,
          factory_cost: 0,
          distributor_cost: 0,
          wholesaler_cost: 0,
          retailer_cost: 0,
        }
      ]
    };
  }

  // Real Supabase implementation
  try {
    console.log(`Fetching game data for game ID: ${gameId}`);
    
    // Get the game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (gameError) {
      console.error('Error fetching game:', gameError);
      throw gameError;
    }

    console.log('Game data fetched:', game);

    // Get the rounds for this game
    const { data: rounds, error: roundsError } = await supabase
      .from('game_rounds')
      .select('*')
      .eq('game_id', gameId)
      .order('round', { ascending: true });

    if (roundsError) {
      console.error('Error fetching rounds:', roundsError);
      throw roundsError;
    }

    console.log(`Fetched ${rounds?.length || 0} rounds for game ${gameId}`);

    return { ...game, rounds: rounds || [] };
  } catch (error) {
    console.error('Error getting game data:', error);
    return null;
  }
}

export async function getAdminViewData(gameId: string) {
  // Return mock data if Supabase is not configured
  if (!isSupabaseConfigured) {
    console.warn('Returning mock admin data because Supabase is not configured');
    return {
      stocks: {
        factory: 10,
        distributor: 10,
        wholesaler: 10,
        retailer: 10,
      },
      pendingOrders: {
        factory: 0,
        distributor: 0,
        wholesaler: 0,
        retailer: 0,
      },
      incomingDeliveries: {
        factory: 0,
        distributor: 0,
        wholesaler: 0,
        retailer: 0,
      }
    };
  }

  // Real Supabase implementation
  try {
    console.log(`Fetching admin view data for game ID: ${gameId}`);
    
    // Get the latest round
    const { data: latestRound, error: roundError } = await supabase
      .from('game_rounds')
      .select('*')
      .eq('game_id', gameId)
      .order('round', { ascending: false })
      .limit(1)
      .single();

    if (roundError) {
      console.error('Error fetching latest round:', roundError);
      throw roundError;
    }

    console.log('Latest round fetched:', latestRound);

    // Get pending orders
    const { data: pendingOrders, error: ordersError } = await supabase
      .from('pending_orders')
      .select('*')
      .eq('game_id', gameId)
      .eq('fulfilled', false);

    if (ordersError) {
      console.error('Error fetching pending orders:', ordersError);
      throw ordersError;
    }

    console.log(`Fetched ${pendingOrders?.length || 0} pending orders for game ${gameId}`);

    // Process the data into the required format
    const stocks = {
      factory: latestRound?.factory_stock || 0,
      distributor: latestRound?.distributor_stock || 0,
      wholesaler: latestRound?.wholesaler_stock || 0,
      retailer: latestRound?.retailer_stock || 0,
    };

    // Aggregate orders by destination
    const ordersByRole = {
      factory: 0,
      distributor: 0,
      wholesaler: 0,
      retailer: 0,
    };

    // Aggregate incoming deliveries by destination
    const deliveriesByRole = {
      factory: 0,
      distributor: 0,
      wholesaler: 0,
      retailer: 0,
    };

    // Process pending orders
    pendingOrders?.forEach(order => {
      if (order.destination in ordersByRole) {
        ordersByRole[order.destination] += order.quantity;
      }
      
      if (order.source in deliveriesByRole) {
        deliveriesByRole[order.source] += order.quantity;
      }
    });

    return {
      stocks,
      pendingOrders: ordersByRole,
      incomingDeliveries: deliveriesByRole,
    };
  } catch (error) {
    console.error('Error getting admin view data:', error);
    return null;
  }
}

export async function updateCosts(gameId: string, round: number, role: string, costIncrease: number) {
  // Return mock data if Supabase is not configured
  if (!isSupabaseConfigured) {
    console.warn('Mock cost update because Supabase is not configured');
    return true;
  }

  // Real Supabase implementation
  try {
    console.log(`Updating costs for game ${gameId}, round ${round}, role ${role}, increase by ${costIncrease}`);
    
    // Get the current round data
    const { data: roundData, error: roundError } = await supabase
      .from('game_rounds')
      .select(`${role}_cost`)
      .eq('game_id', gameId)
      .eq('round', round)
      .single();

    if (roundError) {
      console.error('Error fetching round data:', roundError);
      throw roundError;
    }

    const currentCost = roundData[`${role}_cost`] || 0;
    const newCost = currentCost + costIncrease;

    console.log(`Updating ${role}_cost from ${currentCost} to ${newCost}`);

    // Update the cost in the database
    const updateData = {};
    updateData[`${role}_cost`] = newCost;

    const { error: updateError } = await supabase
      .from('game_rounds')
      .update(updateData)
      .eq('game_id', gameId)
      .eq('round', round);

    if (updateError) {
      console.error('Error updating costs:', updateError);
      throw updateError;
    }

    return true;
  } catch (error) {
    console.error('Error updating costs:', error);
    return false;
  }
}
