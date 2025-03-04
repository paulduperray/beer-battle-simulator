
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

  console.log(`Subscribing to game updates for game ID: ${gameId}`);

  // Real Supabase implementation with enhanced debugging
  const channel = supabase
    .channel(`game_updates:${gameId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'game_rounds',
      filter: `game_id=eq.${gameId}`
    }, (payload) => {
      console.log('Received game_rounds update:', payload);
      callback(payload);
    })
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'pending_orders',
      filter: `game_id=eq.${gameId}`
    }, (payload) => {
      console.log('Received pending_orders update:', payload);
      callback(payload);
    })
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'games',
      filter: `id=eq.${gameId}`
    }, (payload) => {
      console.log('Received games update:', payload);
      callback(payload);
    })
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'players',
      filter: `game_id=eq.${gameId}`
    }, (payload) => {
      console.log('Received players update:', payload);
      callback(payload);
    })
    .subscribe((status) => {
      console.log(`Subscription status for game ${gameId}:`, status);
    });

  return channel;
}
