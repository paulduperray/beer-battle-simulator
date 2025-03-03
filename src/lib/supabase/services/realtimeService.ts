
import { supabase } from '../client';

// Subscribe to real-time updates for a game
export const subscribeToGameUpdates = (
  gameId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`game-updates-${gameId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_rounds',
        filter: `game_id=eq.${gameId}`
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pending_orders',
        filter: `game_id=eq.${gameId}`
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${gameId}`
      },
      callback
    )
    .subscribe();
};
