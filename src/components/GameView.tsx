import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JoinGame from "./JoinGame";
import PlayerView from "./PlayerView";
import AdminView from "./AdminView";
import { User, Users, LayoutDashboard } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Game data structure by game ID
type GameDataType = {
  gameAllRolesData: Array<{
    round: number;
    factory_stock: number;
    distributor_stock: number;
    wholesaler_stock: number;
    retailer_stock: number;
    factory_cost: number;
    distributor_cost: number;
    wholesaler_cost: number;
    retailer_cost: number;
  }>;
  pendingOrders: Array<{
    id: string;
    round: number;
    deliveryRound: number;
    amount: number;
    source: string;
    destination: string;
    status: "pending" | "completed";
  }>;
  pendingOrderId: number;
};

// Store for all game data by game ID
const gameStore: Record<string, GameDataType> = {};

// Helper function to get or create game data for a specific gameId
const getGameData = (gameId: string): GameDataType => {
  if (!gameStore[gameId]) {
    // Initialize new game data
    gameStore[gameId] = {
      gameAllRolesData: [
        {
          round: 1,
          factory_stock: 15,
          distributor_stock: 12,
          wholesaler_stock: 10,
          retailer_stock: 8,
          factory_cost: 100,
          distributor_cost: 120,
          wholesaler_cost: 150,
          retailer_cost: 180
        }
      ],
      pendingOrders: [],
      pendingOrderId: 1
    };
  }
  return gameStore[gameId];
};

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

// Mock socket.io-client for the demo
const mockSocket = {
  on: (event: string, callback: Function) => {
    // Store callbacks to trigger them later
    if (!mockCallbacks[event]) {
      mockCallbacks[event] = [];
    }
    mockCallbacks[event].push(callback);
    return mockSocket;
  },
  off: () => mockSocket,
  emit: (event: string, data: any) => {
    console.log(`Emitted ${event}:`, data);
    
    // Mock responses based on emitted events
    if (event === "joinGame") {
      setTimeout(() => {
        const { gameId, role } = data;
        const gameData = getGameData(gameId);
        
        mockCallbacks["updateStock"]?.forEach(cb => 
          cb({ stock: 10, cost: Math.floor(Math.random() * 200) })
        );
        
        // Update the Admin view with data for all roles
        if (role === "admin") {
          updateAdminView(gameId);
        }
      }, 500);
    }
    
    if (event === "placeOrder") {
      setTimeout(() => {
        const { gameId, order, role } = data;
        const gameData = getGameData(gameId);
        
        // Add the order to pendingOrders with a 2-round delay
        const orderAmount = order;
        const targetDeliveryRound = gameData.gameAllRolesData.length + 2; // Deliver after 2 rounds
        
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
        }
        
        // Add the pending order to the game's order buffer
        gameData.pendingOrders.push({
          id: `order-${gameData.pendingOrderId++}`,
          round: gameData.gameAllRolesData.length,
          deliveryRound: targetDeliveryRound,
          amount: orderAmount,
          source: source,
          destination: destination,
          status: "pending"
        });
        
        // Get latest data (for display purposes only - actual stock update will happen later)
        const lastRoundData = { ...gameData.gameAllRolesData[gameData.gameAllRolesData.length - 1] };
        
        // Update the current player's view with pending order info
        mockCallbacks["updateStock"]?.forEach(cb => {
          if (role) {
            // No immediate stock change, only cost increases to reflect the order placement
            const newCost = lastRoundData[`${role}_cost`] + (orderAmount * getCostMultiplier(role));
            cb({ stock: lastRoundData[`${role}_stock`], cost: newCost });
            
            // Update cost in the data
            const updatedLastRound = { ...lastRoundData };
            updatedLastRound[`${role}_cost`] = newCost;
            
            // Update the last round data with the new cost
            gameData.gameAllRolesData[gameData.gameAllRolesData.length - 1] = updatedLastRound;
          }
        });
        
        // Update the admin view with pending orders information
        updateAdminView(gameId);
      }, 500);
    }
    
    if (event === "nextRound") {
      setTimeout(() => {
        const { gameId } = data;
        const gameData = getGameData(gameId);
        
        // Get latest data
        const lastRoundData = { ...gameData.gameAllRolesData[gameData.gameAllRolesData.length - 1] };
        const nextRound = gameData.gameAllRolesData.length + 1;
        
        // Create new round data as a starting point
        const newRoundData = {
          round: nextRound,
          factory_stock: lastRoundData.factory_stock,
          distributor_stock: lastRoundData.distributor_stock,
          wholesaler_stock: lastRoundData.wholesaler_stock,
          retailer_stock: lastRoundData.retailer_stock,
          factory_cost: lastRoundData.factory_cost,
          distributor_cost: lastRoundData.distributor_cost,
          wholesaler_cost: lastRoundData.wholesaler_cost,
          retailer_cost: lastRoundData.retailer_cost
        };
        
        // Process orders that are ready for delivery in this round
        const ordersToProcess = gameData.pendingOrders.filter(order => 
          order.deliveryRound === nextRound && order.status === "pending"
        );
        
        // Process each order that is due in this round
        ordersToProcess.forEach(order => {
          // Update stocks based on the order
          if (order.destination === "retailer") {
            newRoundData.retailer_stock += order.amount;
            newRoundData.wholesaler_stock = Math.max(0, newRoundData.wholesaler_stock - order.amount);
          } else if (order.destination === "wholesaler") {
            newRoundData.wholesaler_stock += order.amount;
            newRoundData.distributor_stock = Math.max(0, newRoundData.distributor_stock - order.amount);
          } else if (order.destination === "distributor") {
            newRoundData.distributor_stock += order.amount;
            newRoundData.factory_stock = Math.max(0, newRoundData.factory_stock - order.amount);
          } else if (order.destination === "factory") {
            newRoundData.factory_stock += order.amount; // Production creates new stock
          }
          
          // Mark the order as completed
          order.status = "completed";
        });
        
        // Add random variations to make the game more interesting
        newRoundData.factory_stock = Math.max(0, newRoundData.factory_stock + Math.floor(Math.random() * 6) - 2);
        newRoundData.distributor_stock = Math.max(0, newRoundData.distributor_stock + Math.floor(Math.random() * 4) - 2);
        newRoundData.wholesaler_stock = Math.max(0, newRoundData.wholesaler_stock + Math.floor(Math.random() * 4) - 2);
        newRoundData.retailer_stock = Math.max(0, newRoundData.retailer_stock + Math.floor(Math.random() * 4) - 2);
        
        // Add the new data to the game history
        gameData.gameAllRolesData.push(newRoundData);
        
        // Update the admin view with the latest data
        updateAdminView(gameId);
        
        // Also update the current player's stats
        mockCallbacks["updateStock"]?.forEach(cb => {
          if (currentPlayerRole && currentGameId === gameId) {
            const newStock = newRoundData[`${currentPlayerRole}_stock`];
            const newCost = newRoundData[`${currentPlayerRole}_cost`];
            cb({ stock: newStock, cost: newCost });
          }
        });
      }, 800);
    }
    
    return mockSocket;
  }
};

// Function to update the admin view with latest data for a specific game
const updateAdminView = (gameId: string) => {
  const gameData = getGameData(gameId);
  const lastRoundData = gameData.gameAllRolesData[gameData.gameAllRolesData.length - 1];
  
  // Count pending orders for each role
  const pendingOrdersByRole = {
    factory: 0,
    distributor: 0,
    wholesaler: 0,
    retailer: 0
  };
  
  // Count incoming deliveries for each role
  const incomingDeliveriesByRole = {
    factory: 0,
    distributor: 0,
    wholesaler: 0,
    retailer: 0
  };
  
  // Process pending orders to get counts
  gameData.pendingOrders.forEach(order => {
    if (order.status === "pending") {
      // Increment pending orders for the source
      if (order.source !== "production" && pendingOrdersByRole[order.source] !== undefined) {
        pendingOrdersByRole[order.source] += order.amount;
      }
      
      // Increment incoming deliveries for the destination
      if (incomingDeliveriesByRole[order.destination] !== undefined) {
        incomingDeliveriesByRole[order.destination] += order.amount;
      }
    }
  });
  
  // Update the Admin view with data for all roles
  mockCallbacks["updateAllStocks"]?.forEach(cb => 
    cb({
      gameData: gameData.gameAllRolesData,
      stocks: {
        factory: lastRoundData.factory_stock,
        distributor: lastRoundData.distributor_stock,
        wholesaler: lastRoundData.wholesaler_stock,
        retailer: lastRoundData.retailer_stock,
      },
      pendingOrders: pendingOrdersByRole,
      incomingDeliveries: incomingDeliveriesByRole
    })
  );
};

// Store for callbacks
const mockCallbacks: Record<string, Function[]> = {};

// Track current player info
let currentGameId = "";
let currentPlayerRole = "";

const GameView: React.FC = () => {
  const [view, setView] = useState<string>("join");
  const [gameId, setGameId] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [stock, setStock] = useState<number>(10);
  const [cost, setCost] = useState<number>(0);
  const [currentGameData, setCurrentGameData] = useState<any[]>([]);
  const [allRolesData, setAllRolesData] = useState<any[]>([]);
  const [playerStocks, setPlayerStocks] = useState<Record<string, number>>({});
  const [pendingOrders, setPendingOrders] = useState<Record<string, number>>({});
  const [incomingDeliveries, setIncomingDeliveries] = useState<Record<string, number>>({});
  
  const { toast } = useToast();

  useEffect(() => {
    // Set up mock socket listeners
    mockSocket.on("updateStock", (data: { stock: number; cost: number }) => {
      setStock(data.stock);
      setCost(data.cost);
      
      // Update local game data for the player view
      if (role) {
        const lastData = currentGameData.length > 0 ? currentGameData[currentGameData.length - 1] : { round: 0 };
        setCurrentGameData(prev => [...prev, { 
          round: lastData.round + 1, 
          cost: data.cost, 
          stock: data.stock 
        }]);
      }
    });

    mockSocket.on("updateAllStocks", (data: { 
      gameData: any[];
      stocks: Record<string, number>; 
      pendingOrders: Record<string, number>; 
      incomingDeliveries: Record<string, number> 
    }) => {
      if (data.gameData) {
        setAllRolesData(data.gameData);
      }
      setPlayerStocks(data.stocks);
      setPendingOrders(data.pendingOrders);
      setIncomingDeliveries(data.incomingDeliveries);
    });
    
    return () => {
      // Cleanup listeners
      mockSocket.off();
    };
  }, [currentGameData, role]);

  const handleJoinGame = (newGameId: string, newRole: string) => {
    if (newGameId && newRole) {
      setGameId(newGameId);
      setRole(newRole);
      currentGameId = newGameId;
      currentPlayerRole = newRole;
      setView(newRole === "admin" ? "admin" : "player");
      
      // Initialize game data for this game ID if it doesn't exist yet
      getGameData(newGameId);
      
      mockSocket.emit("joinGame", { gameId: newGameId, role: newRole });
      
      toast({
        title: "Joined Game",
        description: `You joined game ${newGameId} as ${newRole}`,
      });
    }
  };

  const handlePlaceOrder = (orderAmount: number) => {
    mockSocket.emit("placeOrder", { order: orderAmount, role, gameId });
    
    toast({
      title: "Order Placed",
      description: `You ordered ${orderAmount} units`,
    });
  };

  const handleNextRound = () => {
    mockSocket.emit("nextRound", { gameId });
    
    toast({
      title: "Next Round",
      description: "Advanced to the next round",
    });
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight mb-1">Beer Distribution Game</h1>
        <p className="text-muted-foreground">Simulate supply chain dynamics and decision-making</p>
      </div>
      
      {role ? (
        <div className="mb-6">
          <Tabs defaultValue={view === "admin" ? "admin" : "player"} onValueChange={setView} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="join" className="flex items-center justify-center">
                <Users className="mr-2 h-4 w-4" />
                <span>Join Game</span>
              </TabsTrigger>
              <TabsTrigger value="player" disabled={!role || role === "admin"} className="flex items-center justify-center">
                <User className="mr-2 h-4 w-4" />
                <span>Player View</span>
              </TabsTrigger>
              <TabsTrigger value="admin" disabled={role !== "admin"} className="flex items-center justify-center">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Admin View</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="join" className="mt-0 animate-slide-in">
              <JoinGame onJoin={handleJoinGame} />
            </TabsContent>
            
            <TabsContent value="player" className="mt-0 animate-scale-in">
              <PlayerView 
                role={role} 
                stock={stock} 
                cost={cost} 
                onPlaceOrder={handlePlaceOrder} 
              />
            </TabsContent>
            
            <TabsContent value="admin" className="mt-0 animate-scale-in">
              <AdminView 
                gameData={allRolesData}
                playerStocks={playerStocks}
                pendingOrders={pendingOrders}
                incomingDeliveries={incomingDeliveries}
                onNextRound={handleNextRound}
                chartDataKeys={getDataKeys()}
              />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <JoinGame onJoin={handleJoinGame} />
      )}
    </div>
  );
};

export default GameView;
