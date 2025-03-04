
import { supabase, isSupabaseConfigured } from '../client';

export async function placeOrder(
  gameId: string,
  round: number,
  quantity: number,
  source: string,
  destination: string
) {
  console.log(`Placing order: ${quantity} units from ${source} to ${destination} in game ${gameId}, round ${round}`);
  
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
      fulfilled: false,
    };
  }

  // Real Supabase implementation
  try {
    // Calculate delivery round (current round + 2)
    const deliveryRound = round + 2;
    
    console.log(`Inserting order into pending_orders table with delivery round ${deliveryRound}`);
    
    const { data, error } = await supabase
      .from('pending_orders')
      .insert({
        game_id: gameId,
        round: round,
        delivery_round: deliveryRound,
        quantity: quantity,
        source: source,
        destination: destination,
        status: 'pending',
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error placing order:', error);
      throw error;
    }
    
    console.log('Order successfully placed:', data);
    return data;
  } catch (error) {
    console.error('Error placing order:', error);
    return null;
  }
}

export async function updateCosts(
  gameId: string,
  round: number,
  role: string,
  costIncrease: number
) {
  console.log(`Updating costs for ${role} in game ${gameId}, round ${round}, increase by ${costIncrease}`);
  
  // Mock implementation if Supabase is not configured
  if (!isSupabaseConfigured) {
    console.warn('Mock cost update because Supabase is not configured');
    return true;
  }

  // Real Supabase implementation
  try {
    // First, get the current round data
    const { data: currentRound, error: fetchError } = await supabase
      .from('game_rounds')
      .select(`*`)
      .eq('game_id', gameId)
      .eq('round', round)
      .single();

    if (fetchError) {
      console.error('Error fetching current round data:', fetchError);
      throw fetchError;
    }

    const costKey = `${role}_cost`;
    const newCost = (currentRound[costKey] || 0) + costIncrease;
    
    console.log(`Updating ${costKey} from ${currentRound[costKey]} to ${newCost}`);

    // Update the cost
    const { error: updateError } = await supabase
      .from('game_rounds')
      .update({ [costKey]: newCost })
      .eq('id', currentRound.id);

    if (updateError) {
      console.error('Error updating costs:', updateError);
      throw updateError;
    }
    
    console.log('Costs successfully updated');
    return true;
  } catch (error) {
    console.error('Error updating costs:', error);
    return false;
  }
}
