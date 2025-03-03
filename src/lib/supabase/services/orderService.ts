
import { supabase, isSupabaseConfigured } from '../client';

export async function placeOrder(
  gameId: string,
  round: number,
  quantity: number,
  source: string,
  destination: string
) {
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
    const { data, error } = await supabase
      .from('pending_orders')
      .insert({
        game_id: gameId,
        round: round,
        quantity: quantity,
        source: source,
        destination: destination,
        fulfilled: false,
      })
      .select('*')
      .single();

    if (error) throw error;
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

    if (fetchError) throw fetchError;

    const costKey = `${role}_cost`;
    const newCost = (currentRound[costKey] || 0) + costIncrease;

    // Update the cost
    const { error: updateError } = await supabase
      .from('game_rounds')
      .update({ [costKey]: newCost })
      .eq('id', currentRound.id);

    if (updateError) throw updateError;
    return true;
  } catch (error) {
    console.error('Error updating costs:', error);
    return false;
  }
}
