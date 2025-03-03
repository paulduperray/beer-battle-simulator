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
        
        setGameAllRolesData(gameAllRolesData);
      }, 500);
    }
    
    if (event === "placeOrder") {
      setTimeout(() => {
        // Simulate the impact of an order on stock levels
        // When a role places an order, it affects their stock and the stock of the next upstream role
        const orderAmount = data.order;
        const role = data.role;
        
        // Get latest data
        const lastRoundData = { ...gameAllRolesData[gameAllRolesData.length - 1] };
        const nextRound = gameAllRolesData.length + 1;
        
        // Create updated stock data for all roles
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
        
        // Update stock based on the role that placed the order
        // This is a simplified model - in a real game, these would be more complex
        if (role === "retailer") {
          // Retailer order affects retailer's stock (increase) and wholesaler's stock (decrease)
          newRoundData.retailer_stock += orderAmount;
          newRoundData.wholesaler_stock = Math.max(0, newRoundData.wholesaler_stock - orderAmount);
          newRoundData.retailer_cost += orderAmount * 5; // Cost of ordering
        } else if (role === "wholesaler") {
          newRoundData.wholesaler_stock += orderAmount;
          newRoundData.distributor_stock = Math.max(0, newRoundData.distributor_stock - orderAmount);
          newRoundData.wholesaler_cost += orderAmount * 4;
        } else if (role === "distributor") {
          newRoundData.distributor_stock += orderAmount;
          newRoundData.factory_stock = Math.max(0, newRoundData.factory_stock - orderAmount);
          newRoundData.distributor_cost += orderAmount * 3;
        } else if (role === "factory") {
          newRoundData.factory_stock += orderAmount;
          newRoundData.factory_cost += orderAmount * 2; // Production cost
        }
        
        // Add the new data to the game history
        gameAllRolesData.push(newRoundData);
        setGameAllRolesData(gameAllRolesData);
        
        // Update the current player's view
        mockCallbacks["updateStock"]?.forEach(cb => {
          const newStock = newRoundData[`${role}_stock`];
          const newCost = newRoundData[`${role}_cost`];
          cb({ stock: newStock, cost: newCost });
        });
        
        // If admin is connected, update all stocks
        mockCallbacks["updateAllStocks"]?.forEach(cb => 
          cb({
            stocks: {
              factory: newRoundData.factory_stock,
              distributor: newRoundData.distributor_stock,
              wholesaler: newRoundData.wholesaler_stock,
              retailer: newRoundData.retailer_stock,
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
      }, 500);
    }
    
    if (event === "nextRound") {
      setTimeout(() => {
        // Get latest data
        const lastRoundData = { ...gameAllRolesData[gameAllRolesData.length - 1] };
        const nextRound = gameAllRolesData.length + 1;
        
        // Simulate random changes for the next round
        const newRoundData = {
          round: nextRound,
          factory_stock: Math.max(0, lastRoundData.factory_stock + Math.floor(Math.random() * 10) - 5),
          distributor_stock: Math.max(0, lastRoundData.distributor_stock + Math.floor(Math.random() * 8) - 4),
          wholesaler_stock: Math.max(0, lastRoundData.wholesaler_stock + Math.floor(Math.random() * 6) - 3),
          retailer_stock: Math.max(0, lastRoundData.retailer_stock + Math.floor(Math.random() * 4) - 2),
          factory_cost: lastRoundData.factory_cost + Math.floor(Math.random() * 30),
          distributor_cost: lastRoundData.distributor_cost + Math.floor(Math.random() * 25),
          wholesaler_cost: lastRoundData.wholesaler_cost + Math.floor(Math.random() * 20),
          retailer_cost: lastRoundData.retailer_cost + Math.floor(Math.random() * 15)
        };
        
        // Add the new data to the game history
        gameAllRolesData.push(newRoundData);
        setGameAllRolesData(gameAllRolesData);
        
        // Update all player stats in the admin view
        mockCallbacks["updateAllStocks"]?.forEach(cb => 
          cb({
            stocks: {
              factory: newRoundData.factory_stock,
              distributor: newRoundData.distributor_stock,
              wholesaler: newRoundData.wholesaler_stock,
              retailer: newRoundData.retailer_stock,
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

let currentRole = "";

const setGameAllRolesData = (updaterFn: (prev: any[]) => any[]) => {
  gameAllRolesData = updaterFn(gameAllRolesData);
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
