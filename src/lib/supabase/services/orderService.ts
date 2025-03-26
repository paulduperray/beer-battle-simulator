
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

export async function placeAdminOrder(
  gameId: string,
  round: number,
  quantity: number,
  destination: string = 'retailer',
  delivery_round: number
) {
  console.log(`Admin placing order: Game ${gameId}, Round ${round}, Quantity ${quantity}, To ${destination}, Delivery in round ${delivery_round}`);
  
  // For admin order to simulate customer demand, we'll directly update retailer stock
  // instead of using the normal order flow since "customer" is not a valid destination
  try {
    // First, get the current round data
    const { data: roundData, error: roundError } = await supabase
      .from('game_rounds')
      .select('*')
      .eq('game_id', gameId)
      .eq('round', round)
      .single();
      
    if (roundError) {
      console.error('Error fetching round data:', roundError);
      throw roundError;
    }
    
    // Calculate new retailer stock by subtracting the ordered quantity
    const newRetailerStock = roundData.retailer_stock - quantity;
    
    // Update the retailer's stock for the current round
    const { data: updateData, error: updateError } = await supabase
      .from('game_rounds')
      .update({ retailer_stock: newRetailerStock })
      .eq('id', roundData.id)
      .select()
      .single();
      
    if (updateError) {
      console.error('Error updating retailer stock:', updateError);
      throw updateError;
    }
    
    console.log('Admin order processed. Retailer stock updated:', updateData);
    
    // Create a record in pending_orders for tracking purposes, but set it as already processed
    // Note: We use 'admin' as source and 'retailer' as destination to avoid constraint violations
    const { data: orderData, error: orderError } = await supabase
      .from('pending_orders')
      .insert({
        game_id: gameId,
        round: round,
        quantity: quantity,
        source: 'admin',
        destination: 'retailer',
        delivery_round: round, // immediate delivery
        status: 'next_round' // mark as already processed
      })
      .select()
      .single();
      
    if (orderError) {
      console.error('Error recording admin order:', orderError);
      // Continue even if this fails, as the stock update was successful
    }
    
    return updateData;
  } catch (error) {
    console.error('Error in placeAdminOrder function:', error);
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
