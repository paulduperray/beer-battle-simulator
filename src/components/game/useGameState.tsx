
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { 
  createGame, 
  joinGame, 
  getGameData, 
  getRoleViewData,
  placeOrder,
  placeAdminOrder,
  updateCosts, 
  advanceToNextRound, 
  getAdminViewData,
  pauseGame,
  resumeGame,
  startGame
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
  const [gameStatus, setGameStatus] = useState<string>("active");
  const [allRoles, setAllRoles] = useState<string[]>([]);

  const loadGameData = useCallback(async () => {
    if (!gameId) return;
    
    try {
      setLoadingCount(prev => {
        if (prev > 5) {
          console.log("Too many consecutive loading attempts, interrupting");
          return 0; // Reset counter
        }
        return prev + 1;
      });
      
      setLoading(true);
      console.log(`Loading game data for game ID: ${gameId}, role: ${role}`);
      
      const { data: gameData } = await supabase
        .from('games')
        .select('status')
        .eq('id', gameId)
        .single();

      if (gameData) {
        setGameStatus(gameData.status);
      }
      
      if (role === "admin") {
        const data = await getGameData(gameId);
        console.log("Admin data loaded:", data);
        
        if (data) {
          setAllRolesData(data.rounds || []);
          
          const adminData = await getAdminViewData(gameId);
          console.log("Admin view data:", adminData);
          
          if (adminData) {
            setPlayerStocks(adminData.stocks || {});
            setPendingOrders(adminData.pendingOrders || {});
            setIncomingDeliveries(adminData.incomingDeliveries || {});
            setCustomerOrder(adminData.customerOrder);
            setCostParameters(adminData.costs || { shortageCost: 10, holdingCost: 5 });

            const { data: players, error } = await supabase
              .from('players')
              .select('role')
              .eq('game_id', gameId);
              
            if (!error && players) {
              setAllRoles(players.map(p => p.role));
            }
          }
          setLoadingCount(0);
        }
      } else {
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
          
          const historyData = await getGameData(gameId);
          if (historyData && historyData.rounds) {
            setCurrentGameData(historyData.rounds.map(round => ({
              round: round.round,
              stock: round[`${role}_stock`],
              cost: round[`${role}_cost`],
              roundCost: round[`${role}_round_cost`] || 0
            })));
          }
          
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
      
      console.log(`Joining game with code: ${newGameCode}, role: ${newRole}`);
      const { game, player } = await joinGame(newGameCode, newRole);
      
      if (game) {
        setGameId(game.id);
        setGameCode(game.game_code);
        setRole(newRole);
        setGameStatus(game.status || 'active');
        
        if (newRole === "admin") {
          setView("admin");
          toast.success(`Joined game as admin`);
        } else {
          setView("player");
          toast.success(`Joined game as ${newRole}`);
        }
        
        setLoadingCount(0);
      } else {
        throw new Error(`Failed to join or create game with code ${newGameCode}`);
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
      
      if (gameStatus === 'paused') {
        toast.error("Cannot place orders while game is paused");
        return;
      }
      
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
      
      const order = await placeOrder(
        gameId,
        game.current_round,
        orderAmount,
        source,
        destination,
        game.current_round + 2
      );
      
      if (order) {
        const costIncrease = orderAmount * getCostMultiplier(role);
        const costsUpdated = await updateCosts(gameId, game.current_round, role, costIncrease);
        
        if (costsUpdated) {
          toast.success("Order Placed: You ordered " + orderAmount + " units");
          
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
      
      if (gameStatus === 'paused') {
        toast.error("Game is paused. Please resume the game first.");
        return;
      }
      
      const { game, newRound } = await advanceToNextRound(gameId);
      
      if (game && newRound) {
        toast.success("Advanced to round " + game.current_round);
        
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

  const handleStartGame = async () => {
    if (!gameId) return;
    
    try {
      setLoading(true);
      
      const result = await startGame(gameId);
      
      if (result) {
        toast.success("Game started successfully!");
        setGameStatus('active');
        
        await loadGameData();
      } else {
        throw new Error("Failed to start game");
      }
    } catch (error) {
      console.error("Error starting game:", error);
      toast.error("Error: Failed to start game");
    } finally {
      setLoading(false);
    }
  };

  const handlePauseGame = async () => {
    if (!gameId) return;
    
    try {
      setLoading(true);
      
      const result = await pauseGame(gameId);
      
      if (result) {
        toast.success("Game paused successfully!");
        setGameStatus('paused');
        
        await loadGameData();
      } else {
        throw new Error("Failed to pause game");
      }
    } catch (error) {
      console.error("Error pausing game:", error);
      toast.error("Error: Failed to pause game");
    } finally {
      setLoading(false);
    }
  };

  const handleResumeGame = async () => {
    if (!gameId) return;
    
    try {
      setLoading(true);
      
      const result = await resumeGame(gameId);
      
      if (result) {
        toast.success("Game resumed successfully!");
        setGameStatus('active');
        
        await loadGameData();
      } else {
        throw new Error("Failed to resume game");
      }
    } catch (error) {
      console.error("Error resuming game:", error);
      toast.error("Error: Failed to resume game");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setGameId("");
    setGameCode("");
    setRole("");
    setView("join");
    setCurrentGameData([]);
    setAllRolesData([]);
    toast.success("Successfully logged out");
  };

  const handleAdminOrderToRetailer = async (quantity: number) => {
    if (!gameId || quantity <= 0) {
      toast.error("Invalid order quantity");
      return;
    }
    
    try {
      setLoading(true);
      
      if (gameStatus === 'paused') {
        toast.error("Cannot place orders while game is paused");
        return;
      }
      
      const { data: game } = await supabase
        .from('games')
        .select('current_round')
        .eq('id', gameId)
        .single();
      
      if (!game) {
        throw new Error("Failed to get current round");
      }
      
      console.log(`Admin placing order from retailer to customer in game ${gameId}, current round: ${game.current_round}, quantity: ${quantity}`);
      
      const order = await placeAdminOrder(
        gameId,
        game.current_round,
        quantity,
        'retailer',
        game.current_round + 1
      );
      
      if (order) {
        toast.success(`Admin order placed: ${quantity} units from retailer`);
        
        await loadGameData();
      } else {
        throw new Error("Failed to place admin order");
      }
    } catch (error) {
      console.error("Error placing admin order:", error);
      toast.error("Error: Failed to place admin order");
    } finally {
      setLoading(false);
    }
  };

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
    gameStatus,
    allRoles,
    loadGameData,
    handleJoinGame,
    handlePlaceOrder,
    handleNextRound,
    handleStartGame,
    handlePauseGame,
    handleResumeGame,
    handleLogout,
    handleAdminOrderToRetailer,
    getDataKeys,
  };
};
