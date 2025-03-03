
import { supabase, GameRound, PendingOrder } from '../client';

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
