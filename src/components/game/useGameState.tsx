
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { 
  createGame, 
  joinGame, 
  getGameData, 
  placeOrder,
  updateCosts, 
  advanceToNextRound, 
  getAdminViewData
} from "@/lib/supabase/gameService";
import { supabase } from "@/lib/supabase/client";

// Helper function to get cost multiplier based on role
const getCostMultiplier = (role: string): number => {
  switch(role) {
    case "factory": return 2;
    case "distributor": return 3;
    case "wholesaler": return 4;
    case "retailer": return 5;
    default: return 1;
  }
};

export const useGameState = () => {
  const [view, setView] = useState<string>("join");
  const [gameId, setGameId] = useState<string>("");
  const [gameCode, setGameCode] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [stock, setStock] = useState<number>(10);
  const [cost, setCost] = useState<number>(0);
  const [currentGameData, setCurrentGameData] = useState<any[]>([]);
  const [allRolesData, setAllRolesData] = useState<any[]>([]);
  const [playerStocks, setPlayerStocks] = useState<Record<string, number>>({});
  const [pendingOrders, setPendingOrders] = useState<Record<string, number>>({});
  const [incomingDeliveries, setIncomingDeliveries] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(false);
  
  const { toast } = useToast();

  // Function to load game data based on role
  const loadGameData = async () => {
    if (!gameId) return;
    
    try {
      setLoading(true);
      console.log(`Loading game data for game ID: ${gameId}, role: ${role}`);
      
      if (role === "admin") {
        // Load admin view data
        const data = await getGameData(gameId);
        console.log("Admin data loaded:", data);
        
        if (data) {
          setAllRolesData(data.rounds);
          
          // Also load current stocks and orders
          const adminData = await getAdminViewData(gameId);
          console.log("Admin view data:", adminData);
          
          if (adminData) {
            setPlayerStocks(adminData.stocks);
            setPendingOrders(adminData.pendingOrders);
            setIncomingDeliveries(adminData.incomingDeliveries);
          }
        }
      } else {
        // Load player view data
        const data = await getGameData(gameId);
        console.log("Player data loaded:", data);
        
        if (data && data.rounds.length > 0) {
          const latestRound = data.rounds[data.rounds.length - 1];
          
          // Set current stock and cost based on role
          const currentStock = latestRound[`${role}_stock`];
          const currentCost = latestRound[`${role}_cost`];
          
          console.log(`Setting ${role} stock to ${currentStock} and cost to ${currentCost}`);
          
          setStock(currentStock);
          setCost(currentCost);
          
          // Update local game data for the player view
          setCurrentGameData(data.rounds.map(round => ({
            round: round.round,
            stock: round[`${role}_stock`],
            cost: round[`${role}_cost`]
          })));
        }
      }
    } catch (error) {
      console.error("Error loading game data:", error);
      toast({
        title: "Error",
        description: "Failed to load game data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async (newGameCode: string, newRole: string) => {
    if (!newGameCode || !newRole) return;
    
    try {
      setLoading(true);
      
      // Handle admin case - create a new game if it doesn't exist
      if (newRole === "admin") {
        const game = await createGame(newGameCode);
        if (game) {
          setGameId(game.id);
          setGameCode(game.game_code);
          setRole(newRole);
          setView("admin");
          
          toast({
            title: "Game Created",
            description: `You created game ${newGameCode} as ${newRole}`,
          });
        } else {
          throw new Error("Failed to create game");
        }
      } else {
        // For players, join an existing game
        const { game, player } = await joinGame(newGameCode, newRole);
        
        if (game && player) {
          setGameId(game.id);
          setGameCode(game.game_code);
          setRole(newRole);
          setView("player");
          
          toast({
            title: "Joined Game",
            description: `You joined game ${newGameCode} as ${newRole}`,
          });
        } else {
          throw new Error("Failed to join game");
        }
      }
    } catch (error) {
      console.error("Error joining game:", error);
      toast({
        title: "Error",
        description: "Failed to join game. Please check the game code and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async (orderAmount: number) => {
    if (!gameId || !role || orderAmount <= 0) return;
    
    try {
      setLoading(true);
      
      // Determine the source and destination for the order
      let source, destination;
      if (role === "retailer") {
        source = "wholesaler";
        destination = "retailer";
      } else if (role === "wholesaler") {
        source = "distributor";
        destination = "wholesaler";
      } else if (role === "distributor") {
        source = "factory";
        destination = "distributor";
      } else if (role === "factory") {
        source = "production";
        destination = "factory";
      } else {
        throw new Error("Invalid role");
      }
      
      // First, get current game round
      const { data: game } = await supabase
        .from('games')
        .select('current_round')
        .eq('id', gameId)
        .single();
      
      if (!game) {
        throw new Error("Failed to get current round");
      }
      
      // Place the order
      const order = await placeOrder(
        gameId,
        game.current_round,
        orderAmount,
        source,
        destination
      );
      
      if (order) {
        // Update costs to reflect the order placement
        const costIncrease = orderAmount * getCostMultiplier(role);
        await updateCosts(gameId, game.current_round, role, costIncrease);
        
        toast({
          title: "Order Placed",
          description: `You ordered ${orderAmount} units`,
        });
        
        // Reload game data to reflect changes
        await loadGameData();
      } else {
        throw new Error("Failed to place order");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        title: "Error",
        description: "Failed to place order",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNextRound = async () => {
    if (!gameId) return;
    
    try {
      setLoading(true);
      
      const { game, newRound } = await advanceToNextRound(gameId);
      
      if (game && newRound) {
        toast({
          title: "Next Round",
          description: `Advanced to round ${game.current_round}`,
        });
        
        // Reload game data to reflect changes
        await loadGameData();
      } else {
        throw new Error("Failed to advance to next round");
      }
    } catch (error) {
      console.error("Error advancing round:", error);
      toast({
        title: "Error",
        description: "Failed to advance to next round",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Show stock chart keys based on role or admin view
  const getDataKeys = () => {
    if (role === "admin") {
      return [
        "factory_stock", "distributor_stock", "wholesaler_stock", "retailer_stock",
        "factory_cost", "distributor_cost", "wholesaler_cost", "retailer_cost"
      ];
    } else {
      return ["stock", "cost"];
    }
  };

  return {
    view,
    setView,
    gameId,
    setGameId,
    gameCode,
    role,
    stock,
    cost,
    currentGameData,
    allRolesData,
    playerStocks, 
    pendingOrders,
    incomingDeliveries,
    loading,
    loadGameData,
    handleJoinGame,
    handlePlaceOrder,
    handleNextRound,
    getDataKeys,
  };
};
