
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
        quantity: quantity, // Changed from amount to quantity to match the database schema
        source: source,
        destination: destination,
        delivery_round: delivery_round
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
      .eq('delivery_round', round);

    if (fetchError) throw fetchError;
    
    console.log(`Found ${orders?.length || 0} orders to process for round ${round}`);

    // If no orders to process, return success
    if (!orders || orders.length === 0) {
      return true;
    }

    // Process each order
    for (const order of orders) {
      // Update the stock levels based on the order
      await updateStockLevels(gameId, round, order.source, order.destination, order.quantity);
    }

    return true;
  } catch (error) {
    console.error('Error processing orders:', error);
    return false;
  }
}

async function updateStockLevels(
  gameId: string,
  round: number,
  source: string,
  destination: string,
  quantity: number
) {
  console.log(`Updating stock levels: Game ${gameId}, Round ${round}, From ${source} to ${destination}, Quantity ${quantity}`);
  
  try {
    // Get the current game round
    const { data: gameRound, error: fetchError } = await supabase
      .from('game_rounds')
      .select('*')
      .eq('game_id', gameId)
      .eq('round', round)
      .single();

    if (fetchError) throw fetchError;

    // Skip "production" source as it's not a real entity
    if (source !== 'production') {
      // Decrement source stock
      const sourceColumn = `${source}_stock`;
      const newSourceStock = Math.max(0, (gameRound[sourceColumn] || 0) - quantity);
      
      const { error: updateSourceError } = await supabase
        .from('game_rounds')
        .update({ [sourceColumn]: newSourceStock })
        .eq('id', gameRound.id);

      if (updateSourceError) throw updateSourceError;
    }

    // Increment destination stock
    const destinationColumn = `${destination}_stock`;
    const newDestinationStock = (gameRound[destinationColumn] || 0) + quantity;
    
    const { error: updateDestError } = await supabase
      .from('game_rounds')
      .update({ [destinationColumn]: newDestinationStock })
      .eq('id', gameRound.id);

    if (updateDestError) throw updateDestError;

    console.log(`Stock levels updated successfully: ${source} -> ${destination}, Quantity ${quantity}`);
    return true;
  } catch (error) {
    console.error('Error updating stock levels:', error);
    return false;
  }
}
