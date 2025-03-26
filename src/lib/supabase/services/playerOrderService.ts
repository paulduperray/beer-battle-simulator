
import { supabase, isSupabaseConfigured } from '../client';

export async function hasPlayerOrderedInRound(
  gameId: string,
  round: number,
  source: string,
  destination: string
) {
  console.log(`Checking if player ordered in game ${gameId}, round ${round} from ${source} to ${destination}`);
  
  // Return false if Supabase is not configured - allows ordering in development
  if (!isSupabaseConfigured) {
    console.warn('Mock checking order because Supabase is not configured');
    return false;
  }

  try {
    const { data: existingOrders, error } = await supabase
      .from('pending_orders')
      .select('id')
      .eq('game_id', gameId)
      .eq('round', round)
      .eq('source', source)
      .eq('destination', destination);
      
    if (error) {
      console.error('Error checking player orders:', error);
      throw error;
    }
    
    return existingOrders && existingOrders.length > 0;
  } catch (error) {
    console.error('Error in hasPlayerOrderedInRound function:', error);
    return false;
  }
}
