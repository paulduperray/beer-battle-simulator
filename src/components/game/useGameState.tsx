
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { 
  createGame, 
  joinGame, 
  getGameData, 
  getRoleViewData,
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
  const [roundCost, setRoundCost] = useState<number>(0);
  const [currentGameData, setCurrentGameData] = useState<any[]>([]);
  const [allRolesData, setAllRolesData] = useState<any[]>([]);
  const [playerStocks, setPlayerStocks] = useState<Record<string, number>>({});
  const [pendingOrders, setPendingOrders] = useState<Record<string, number>>({});
  const [incomingDeliveries, setIncomingDeliveries] = useState<Record<string, number>>({});
  const [upcomingDeliveries, setUpcomingDeliveries] = useState<any>({
    nextRound: 0,
    futureRound: 0
  });
  const [customerOrder, setCustomerOrder] = useState<number | null>(null);
  const [lastDownstreamOrder, setLastDownstreamOrder] = useState<number | null>(null);
  const [costParameters, setCostParameters] = useState({
    shortageCost: 10,
    holdingCost: 5
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingCount, setLoadingCount] = useState<number>(0);
  
  // Function to load game data based on role
  const loadGameData = useCallback(async () => {
    if (!gameId) return;
    
    try {
      // Protection against constant loading
      setLoadingCount(prev => {
        if (prev > 5) {
          console.log("Too many consecutive loading attempts, interrupting");
          return 0; // Reset counter
        }
        return prev + 1;
      });
      
      setLoading(true);
      console.log(`Loading game data for game ID: ${gameId}, role: ${role}`);
      
      if (role === "admin") {
        // Load admin view data
        const data = await getGameData(gameId);
        console.log("Admin data loaded:", data);
        
        if (data) {
          setAllRolesData(data.rounds || []);
          
          // Also load current stocks and orders
          const adminData = await getAdminViewData(gameId);
          console.log("Admin view data:", adminData);
          
          if (adminData) {
            setPlayerStocks(adminData.stocks || {});
            setPendingOrders(adminData.pendingOrders || {});
            setIncomingDeliveries(adminData.incomingDeliveries || {});
            setCustomerOrder(adminData.customerOrder);
            setCostParameters(adminData.costs || { shortageCost: 10, holdingCost: 5 });
          }
          // Reset loading counter on success
          setLoadingCount(0);
        }
      } else {
        // Load player view data using the new unified function
        const playerData = await getRoleViewData(gameId, role);
        console.log(`${role} view data loaded:`, playerData);
        
        if (playerData) {
          setStock(playerData.stock);
          setCost(playerData.cost);
          setRoundCost(playerData.roundCost || 0);
          setUpcomingDeliveries(playerData.upcomingDeliveries || { nextRound: 0, futureRound: 0 });
          setCostParameters({
            shortageCost: playerData.shortageCost || 10,
            holdingCost: playerData.holdingCost || 5
          });
          
          if (role === 'retailer') {
            setCustomerOrder(playerData.customerOrder);
          }
          
          setLastDownstreamOrder(playerData.lastDownstreamOrder);
          
          // Also load historical data for charts
          const historyData = await getGameData(gameId);
          if (historyData && historyData.rounds) {
            setCurrentGameData(historyData.rounds.map(round => ({
              round: round.round,
              stock: round[`${role}_stock`],
              cost: round[`${role}_cost`],
              roundCost: round[`${role}_round_cost`] || 0
            })));
          }
          
          // Reset loading counter on success
          setLoadingCount(0);
        }
      }
    } catch (error) {
      console.error("Error loading game data:", error);
      toast.error("Error loading game data");
    } finally {
      setLoading(false);
    }
  }, [gameId, role]);

  const handleJoinGame = async (newGameCode: string, newRole: string) => {
    if (!newGameCode || !newRole) {
      toast("Please enter a game code and select a role");
      return;
    }
    
    try {
      setLoading(true);
      
      // Try to join an existing game
      console.log(`Joining game with code: ${newGameCode}, role: ${newRole}`);
      const { game, player } = await joinGame(newGameCode, newRole);
      
      if (game) {
        // Game found, proceed with joining
        setGameId(game.id);
        setGameCode(game.game_code);
        setRole(newRole);
        
        // Set view based on role
        if (newRole === "admin") {
          setView("admin");
          toast(`Joined game as admin`);
        } else {
          setView("player");
          toast(`Joined game as ${newRole}`);
        }
        
        // Reset loading counter after a successful connection
        setLoadingCount(0);
      } else {
        // Game not found, create new game if admin
        if (newRole === "admin") {
          console.log(`Creating new game with code: ${newGameCode}`);
          const newGame = await createGame(newGameCode);
          if (newGame) {
            setGameId(newGame.id);
            setGameCode(newGame.game_code);
            setRole(newRole);
            setView("admin");
            
            toast("Game created successfully!");
            // Reset loading counter
            setLoadingCount(0);
          } else {
            throw new Error("Failed to create game");
          }
        } else {
          throw new Error(`Game with code ${newGameCode} not found`);
        }
      }
    } catch (error) {
      console.error("Error joining game:", error);
      toast.error("Failed to join game. Please check the game code.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async (orderAmount: number) => {
    if (!gameId || !role || orderAmount < 0) return;
    
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
        console.error("Failed to get current round");
        throw new Error("Failed to get current round");
      }
      
      console.log(`Placing order in game ${gameId}, current round: ${game.current_round}`);
      
      // Place the order with delivery_round parameter
      const order = await placeOrder(
        gameId,
        game.current_round,
        orderAmount,
        source,
        destination,
        game.current_round + 2 // Set delivery_round to 2 rounds ahead
      );
      
      if (order) {
        // Update costs to reflect the order placement
        const costIncrease = orderAmount * getCostMultiplier(role);
        const costsUpdated = await updateCosts(gameId, game.current_round, role, costIncrease);
        
        if (costsUpdated) {
          toast.success("Order Placed: You ordered " + orderAmount + " units");
          
          // Reload game data to reflect changes
          await loadGameData();
        } else {
          throw new Error("Failed to update costs");
        }
      } else {
        throw new Error("Failed to place order");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Error: Failed to place order. Please try again.");
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
        toast.success("Advanced to round " + game.current_round);
        
        // Reload game data to reflect changes
        await loadGameData();
      } else {
        throw new Error("Failed to advance to next round");
      }
    } catch (error) {
      console.error("Error advancing round:", error);
      toast.error("Error: Failed to advance to next round");
    } finally {
      setLoading(false);
    }
  };
  
  // Show stock chart keys based on role or admin view
  const getDataKeys = () => {
    if (role === "admin") {
      return {
        stocks: ["factory_stock", "distributor_stock", "wholesaler_stock", "retailer_stock"],
        costs: ["factory_cost", "distributor_cost", "wholesaler_cost", "retailer_cost"]
      };
    } else {
      return {
        stocks: ["stock"],
        costs: ["cost", "roundCost"]
      };
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
    roundCost,
    currentGameData,
    allRolesData,
    playerStocks, 
    pendingOrders,
    incomingDeliveries,
    upcomingDeliveries,
    customerOrder,
    lastDownstreamOrder,
    costParameters,
    loading,
    loadGameData,
    handleJoinGame,
    handlePlaceOrder,
    handleNextRound,
    getDataKeys,
  };
};
