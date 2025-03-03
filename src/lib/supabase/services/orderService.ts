
import { supabase, PendingOrder, GameRound } from '../client';

// Place an order
export const placeOrder = async (
  gameId: string,
  round: number,
  amount: number,
  source: string,
  destination: string
): Promise<PendingOrder | null> => {
  // Orders are delivered after 2 rounds
  const deliveryRound = round + 2;
  
  const { data, error } = await supabase
    .from('pending_orders')
    .insert({
      game_id: gameId,
      round,
      delivery_round: deliveryRound,
      amount,
      source,
      destination,
      status: 'pending'
    })
    .select('*')
    .single();
  
  if (error) {
    console.error('Error placing order:', error);
    return null;
  }
  
  return data;
};

// Update costs based on order
export const updateCosts = async (
  gameId: string,
  round: number,
  role: string,
  costIncrease: number
): Promise<GameRound | null> => {
  // Get the current round data
  const { data: currentRound, error: fetchError } = await supabase
    .from('game_rounds')
    .select('*')
    .eq('game_id', gameId)
    .eq('round', round)
    .single();
  
  if (fetchError || !currentRound) {
    console.error('Error fetching current round:', fetchError);
    return null;
  }
  
  // Update the cost for the specific role
  const costField = `${role}_cost`;
  const updatedCost = currentRound[costField] + costIncrease;
  
  const updateData = {};
  updateData[costField] = updatedCost;
  
  const { data: updatedRound, error: updateError } = await supabase
    .from('game_rounds')
    .update(updateData)
    .eq('id', currentRound.id)
    .select('*')
    .single();
  
  if (updateError) {
    console.error('Error updating costs:', updateError);
    return null;
  }
  
  return updatedRound;
};
