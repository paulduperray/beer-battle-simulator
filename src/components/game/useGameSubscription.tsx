
import { useEffect } from "react";
import { subscribeToGameUpdates } from "@/lib/supabase/gameService";

interface UseGameSubscriptionProps {
  gameId: string;
  role: string;
  loadGameData: () => Promise<void>;
}

export const useGameSubscription = ({ 
  gameId, 
  role, 
  loadGameData 
}: UseGameSubscriptionProps) => {
  // Set up real-time subscriptions
  useEffect(() => {
    if (!gameId) {
      console.log("No gameId provided for subscription");
      return;
    }
    
    console.log(`Setting up subscription for game ${gameId} as ${role}`);
    
    // Subscribe to game updates
    const subscription = subscribeToGameUpdates(gameId, (payload) => {
      console.log(`Received update for game ${gameId}:`, payload);
      // Reload game data when something changes
      loadGameData();
    });
    
    // Initial data load
    loadGameData();
    
    // Cleanup subscription
    return () => {
      console.log(`Unsubscribing from game ${gameId}`);
      subscription.unsubscribe();
    };
  }, [gameId, role, loadGameData]);
};

export default useGameSubscription;
