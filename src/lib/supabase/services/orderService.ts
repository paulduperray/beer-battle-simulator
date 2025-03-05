
import { supabase, isSupabaseConfigured } from '../client';

export async function placeOrder(
  gameId: string,
  round: number,
  quantity: number,
  source: string,
  destination: string,
  delivery_round: number
) {
  console.log(`Placing order: Game ${gameId}, Round ${round}, Quantity ${quantity}, From ${source} to ${destination}, Delivery in round ${delivery_round}`);
  
  // Return mock data if Supabase is not configured
  if (!isSupabaseConfigured) {
    console.warn('Creating mock order because Supabase is not configured');
    return {
      id: 'mock-order-id',
      game_id: gameId,
      round: round,
      quantity: quantity,
      source: source,
      destination: destination,
      delivery_round: delivery_round,
      created_at: new Date().toISOString(),
    };
  }

  // Real Supabase implementation
  try {
    const { data, error } = await supabase
      .from('pending_orders')
      .insert({
        game_id: gameId,
        round: round,
        quantity: quantity,
        source: source,
        destination: destination,
        delivery_round: delivery_round,
        status: 'pending'
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error placing order:', error);
      throw error;
    }
    
    console.log('Order placed successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in placeOrder function:', error);
    return null;
  }
}

export async function processOrders(gameId: string, round: number) {
  console.log(`Processing orders for game ${gameId}, round ${round}`);
  
  // Return mock data if Supabase is not configured
  if (!isSupabaseConfigured) {
    console.warn('Processing mock orders because Supabase is not configured');
    return true;
  }

  // Real Supabase implementation
  try {
    // Get all pending orders that should be delivered in this round
    const { data: orders, error: fetchError } = await supabase
      .from('pending_orders')
      .select('*')
      .eq('game_id', gameId)
      .eq('delivery_round', round)
      .eq('status', 'pending');

    if (fetchError) throw fetchError;
    
    console.log(`Found ${orders?.length || 0} orders to process for round ${round}`);

    // If no orders to process, return success
    if (!orders || orders.length === 0) {
      return true;
    }

    // Process each order
    for (const order of orders) {
      // Update the order status
      await supabase
        .from('pending_orders')
        .update({ status: 'next_round' })
        .eq('id', order.id);
    }

    return true;
  } catch (error) {
    console.error('Error processing orders:', error);
    return false;
  }
}
