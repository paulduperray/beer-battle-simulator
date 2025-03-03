
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
    if (!gameId) return;
    
    // Subscribe to game updates
    const subscription = subscribeToGameUpdates(gameId, (payload) => {
      // Reload game data when something changes
      loadGameData();
    });
    
    // Initial data load
    loadGameData();
    
    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [gameId, role, loadGameData]);
};

export default useGameSubscription;
