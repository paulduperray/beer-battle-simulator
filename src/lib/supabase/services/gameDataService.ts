
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
          customer_order: 5,
          factory_round_cost: 0,
          distributor_round_cost: 0,
          wholesaler_round_cost: 0,
          retailer_round_cost: 0,
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
      },
      customerOrder: 5
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

    // Get pending orders - now getting all pending orders to show in real-time
    const { data: pendingOrders, error: ordersError } = await supabase
      .from('pending_orders')
      .select('*')
      .eq('game_id', gameId)
      .neq('status', 'completed');

    if (ordersError) {
      console.error('Error fetching pending orders:', ordersError);
      throw ordersError;
    }

    console.log(`Fetched ${pendingOrders?.length || 0} pending orders for game ${gameId}`);

    // Get the game details for cost parameters
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('shortage_cost, holding_cost')
      .eq('id', gameId)
      .single();

    if (gameError) {
      console.error('Error fetching game details:', gameError);
      throw gameError;
    }

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
      
      if (order.source in deliveriesByRole && order.source !== 'production') {
        deliveriesByRole[order.source] += order.quantity;
      }
    });

    // Group upcoming deliveries by role and delivery round
    const upcomingDeliveries = {
      nextRound: {
        factory: 0,
        distributor: 0,
        wholesaler: 0,
        retailer: 0,
      },
      futureRound: {
        factory: 0,
        distributor: 0,
        wholesaler: 0,
        retailer: 0,
      }
    };

    // Get current round
    const currentRound = latestRound.round;

    // Process pending orders for upcoming deliveries
    pendingOrders?.forEach(order => {
      if (order.destination in upcomingDeliveries.nextRound) {
        if (order.delivery_round === currentRound + 1) {
          upcomingDeliveries.nextRound[order.destination] += order.quantity;
        } else if (order.delivery_round === currentRound + 2) {
          upcomingDeliveries.futureRound[order.destination] += order.quantity;
        }
      }
    });

    return {
      stocks,
      pendingOrders: ordersByRole,
      incomingDeliveries: deliveriesByRole,
      upcomingDeliveries,
      customerOrder: latestRound.customer_order || 5,
      costs: {
        shortageCost: game.shortage_cost || 10,
        holdingCost: game.holding_cost || 5
      }
    };
  } catch (error) {
    console.error('Error getting admin view data:', error);
    return null;
  }
}

export async function getRoleViewData(gameId: string, role: string) {
  try {
    console.log(`Fetching ${role} view data for game ID: ${gameId}`);
    
    // Get the game info including current round
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('current_round, shortage_cost, holding_cost')
      .eq('id', gameId)
      .single();

    if (gameError) {
      console.error('Error fetching game info:', gameError);
      throw gameError;
    }

    const currentRound = game.current_round;

    // Get the latest round data
    const { data: latestRound, error: roundError } = await supabase
      .from('game_rounds')
      .select('*')
      .eq('game_id', gameId)
      .eq('round', currentRound)
      .single();

    if (roundError) {
      console.error('Error fetching latest round:', roundError);
      throw roundError;
    }

    // Get pending orders for this role
    const { data: pendingOrders, error: ordersError } = await supabase
      .from('pending_orders')
      .select('*')
      .eq('game_id', gameId)
      .eq('destination', role)
      .neq('status', 'completed');

    if (ordersError) {
      console.error('Error fetching pending orders:', ordersError);
      throw ordersError;
    }

    // Get downstream orders (orders from the next role in the chain)
    const downstreamRole = getDownstreamRole(role);
    const { data: downstreamOrders, error: downstreamError } = await supabase
      .from('pending_orders')
      .select('*')
      .eq('game_id', gameId)
      .eq('source', role)
      .neq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1);

    if (downstreamError) {
      console.error('Error fetching downstream orders:', downstreamError);
    }

    // Process upcoming deliveries by delivery round
    const upcomingDeliveries = {
      nextRound: 0,
      futureRound: 0
    };

    pendingOrders?.forEach(order => {
      if (order.delivery_round === currentRound + 1) {
        upcomingDeliveries.nextRound += order.quantity;
      } else if (order.delivery_round === currentRound + 2) {
        upcomingDeliveries.futureRound += order.quantity;
      }
    });

    // Get customer order if the role is retailer
    let customerOrder = null;
    if (role === 'retailer') {
      customerOrder = latestRound.customer_order;
    }

    // Get last downstream order
    const lastDownstreamOrder = downstreamOrders && downstreamOrders.length > 0 
      ? downstreamOrders[0].quantity 
      : null;

    return {
      stock: latestRound[`${role}_stock`],
      cost: latestRound[`${role}_cost`],
      roundCost: latestRound[`${role}_round_cost`],
      upcomingDeliveries,
      customerOrder,
      shortageCost: game.shortage_cost || 10,
      holdingCost: game.holding_cost || 5,
      lastDownstreamOrder
    };
  } catch (error) {
    console.error(`Error getting ${role} view data:`, error);
    return null;
  }
}

// Helper function to get downstream role
function getDownstreamRole(role: string) {
  switch (role) {
    case 'factory': return 'distributor';
    case 'distributor': return 'wholesaler';
    case 'wholesaler': return 'retailer';
    case 'retailer': return 'customer';
    default: return null;
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
