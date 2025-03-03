
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JoinGame from "./JoinGame";
import PlayerView from "./PlayerView";
import AdminView from "./AdminView";
import { User, Users, LayoutDashboard } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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
        mockCallbacks["updateStock"]?.forEach(cb => 
          cb({ stock: 10, cost: Math.floor(Math.random() * 200) })
        );
        
        // Initialize all role data if this is a new game
        if (!gameAllRolesData.length) {
          gameAllRolesData = [
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
          ];
        }
        
        // Update the Admin view with data for all roles
        if (data.role === "admin") {
          mockCallbacks["updateAllStocks"]?.forEach(cb => 
            cb({
              stocks: {
                factory: gameAllRolesData[gameAllRolesData.length - 1].factory_stock,
                distributor: gameAllRolesData[gameAllRolesData.length - 1].distributor_stock,
                wholesaler: gameAllRolesData[gameAllRolesData.length - 1].wholesaler_stock,
                retailer: gameAllRolesData[gameAllRolesData.length - 1].retailer_stock,
              },
              pendingOrders: {
                factory: Math.floor(Math.random() * 10),
                distributor: Math.floor(Math.random() * 10),
                wholesaler: Math.floor(Math.random() * 10),
                retailer: Math.floor(Math.random() * 10),
              },
              incomingDeliveries: {
                factory: Math.floor(Math.random() * 10),
                distributor: Math.floor(Math.random() * 10),
                wholesaler: Math.floor(Math.random() * 10),
                retailer: Math.floor(Math.random() * 10),
              }
            })
          );
        }
        
        // Fix: Using a callback function that returns the new state
        setGameAllRolesData(() => [...gameAllRolesData]);
      }, 500);
    }
    
    if (event === "placeOrder") {
      setTimeout(() => {
        // When a role places an order, add it to pendingOrders with a 2-round delay
        const orderAmount = data.order;
        const role = data.role;
        
        // Add the order to the pendingOrders array with the target delivery round
        const targetDeliveryRound = gameAllRolesData.length + 2; // Deliver after 2 rounds
        
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
        
        // Add the pending order to our buffer
        pendingOrders.push({
          id: `order-${pendingOrderId++}`,
          round: gameAllRolesData.length,
          deliveryRound: targetDeliveryRound,
          amount: orderAmount,
          source: source,
          destination: destination,
          status: "pending"
        });
        
        // Get latest data (for display purposes only - actual stock update will happen later)
        const lastRoundData = { ...gameAllRolesData[gameAllRolesData.length - 1] };
        
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
            gameAllRolesData[gameAllRolesData.length - 1] = updatedLastRound;
            
            // Fix: Using a callback function that returns the new state
            setGameAllRolesData(() => [...gameAllRolesData]);
          }
        });
        
        // Update the admin view with pending orders information
        updateAdminView();
        
      }, 500);
    }
    
    if (event === "nextRound") {
      setTimeout(() => {
        // Get latest data
        const lastRoundData = { ...gameAllRolesData[gameAllRolesData.length - 1] };
        const nextRound = gameAllRolesData.length + 1;
        
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
        const ordersToProcess = pendingOrders.filter(order => order.deliveryRound === nextRound && order.status === "pending");
        
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
        gameAllRolesData.push(newRoundData);
        
        // Fix: Using a callback function that returns the new state
        setGameAllRolesData(() => [...gameAllRolesData]);
        
        // Update the admin view with the latest data
        updateAdminView();
        
        // Also update the current player's stats
        mockCallbacks["updateStock"]?.forEach(cb => {
          if (currentRole) {
            const newStock = newRoundData[`${currentRole}_stock`];
            const newCost = newRoundData[`${currentRole}_cost`];
            cb({ stock: newStock, cost: newCost });
          }
        });
      }, 800);
    }
    
    return mockSocket;
  }
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

// Function to update the admin view with latest data
const updateAdminView = () => {
  const lastRoundData = gameAllRolesData[gameAllRolesData.length - 1];
  
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
  pendingOrders.forEach(order => {
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

// Mock initial game data for all roles
let gameAllRolesData = [
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
];

// Initialize pending orders array and ID counter
let pendingOrders: Array<{
  id: string;
  round: number;
  deliveryRound: number;
  amount: number;
  source: string;
  destination: string;
  status: "pending" | "completed";
}> = [];
let pendingOrderId = 1;

let currentRole = "";

// Fixed: Changed to accept a callback function
const setGameAllRolesData = (updaterFn: () => any[]) => {
  gameAllRolesData = updaterFn();
};

const GameView: React.FC = () => {
  const [view, setView] = useState<string>("join");
  const [gameId, setGameId] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [stock, setStock] = useState<number>(10);
  const [cost, setCost] = useState<number>(0);
  const [currentGameData, setCurrentGameData] = useState<any[]>([]);
  const [allRolesData, setAllRolesData] = useState<any[]>(gameAllRolesData);
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
      stocks: Record<string, number>; 
      pendingOrders: Record<string, number>; 
      incomingDeliveries: Record<string, number> 
    }) => {
      setPlayerStocks(data.stocks);
      setPendingOrders(data.pendingOrders);
      setIncomingDeliveries(data.incomingDeliveries);
    });

    // Keep track of all roles data
    setAllRolesData(gameAllRolesData);
    
    return () => {
      // Cleanup listeners
      mockSocket.off();
    };
  }, [currentGameData, role]);

  const handleJoinGame = (newGameId: string, newRole: string) => {
    if (newGameId && newRole) {
      setGameId(newGameId);
      setRole(newRole);
      currentRole = newRole;
      setView(newRole === "admin" ? "admin" : "player");
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
