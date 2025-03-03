
import { supabase, isSupabaseConfigured } from '../client';

export function subscribeToGameUpdates(gameId: string, callback: (payload: any) => void) {
  // Return mock subscription if Supabase is not configured
  if (!isSupabaseConfigured) {
    console.warn('Using mock subscription because Supabase is not configured');
    return {
      unsubscribe: () => {
        console.log('Mock unsubscribe called');
      }
    };
  }

  // Real Supabase implementation
  const channel = supabase
    .channel(`game_updates:${gameId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'game_rounds',
      filter: `game_id=eq.${gameId}`
    }, (payload) => {
      callback(payload);
    })
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'pending_orders',
      filter: `game_id=eq.${gameId}`
    }, (payload) => {
      callback(payload);
    })
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'games',
      filter: `id=eq.${gameId}`
    }, (payload) => {
      callback(payload);
    })
    .subscribe();

  return channel;
}
