
import { supabase, isSupabaseConfigured } from '../client';

export async function startGame(gameId: string) {
  // Return mock data if Supabase is not configured
  if (!isSupabaseConfigured) {
    console.warn('Mock start game because Supabase is not configured');
    return { success: true };
  }

  // Real Supabase implementation
  try {
    const { data, error } = await supabase
      .from('games')
      .update({ status: 'active' })
      .eq('id', gameId)
      .select('*')
      .single();

    if (error) {
      console.error('Error starting game:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in startGame function:', error);
    return null;
  }
}

export async function pauseGame(gameId: string) {
  // Return mock data if Supabase is not configured
  if (!isSupabaseConfigured) {
    console.warn('Mock pause game because Supabase is not configured');
    return { success: true };
  }

  // Real Supabase implementation
  try {
    const { data, error } = await supabase
      .from('games')
      .update({ status: 'paused' })
      .eq('id', gameId)
      .select('*')
      .single();

    if (error) {
      console.error('Error pausing game:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in pauseGame function:', error);
    return null;
  }
}

export async function resumeGame(gameId: string) {
  // Return mock data if Supabase is not configured
  if (!isSupabaseConfigured) {
    console.warn('Mock resume game because Supabase is not configured');
    return { success: true };
  }

  // Real Supabase implementation
  try {
    const { data, error } = await supabase
      .from('games')
      .update({ status: 'active' })
      .eq('id', gameId)
      .select('*')
      .single();

    if (error) {
      console.error('Error resuming game:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in resumeGame function:', error);
    return null;
  }
}
