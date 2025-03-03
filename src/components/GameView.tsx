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
        
        if (data.role === "admin") {
          mockCallbacks["updateAllStocks"]?.forEach(cb => 
            cb({
              stocks: {
                factory: Math.floor(Math.random() * 20) + 5,
                distributor: Math.floor(Math.random() * 20) + 5,
                wholesaler: Math.floor(Math.random() * 20) + 5,
                retailer: Math.floor(Math.random() * 20) + 5,
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
      }, 500);
    }
    
    if (event === "placeOrder") {
      setTimeout(() => {
        mockCallbacks["updateStock"]?.forEach(cb => {
          const newStock = Math.max(0, 10 - Math.floor(Math.random() * 5));
          const newCost = Math.floor(Math.random() * 100) + 100;
          cb({ stock: newStock, cost: newCost });
        });
      }, 500);
    }
    
    if (event === "nextRound") {
      setTimeout(() => {
        // Update all player stats
        mockCallbacks["updateAllStocks"]?.forEach(cb => 
          cb({
            stocks: {
              factory: Math.floor(Math.random() * 20) + 5,
              distributor: Math.floor(Math.random() * 20) + 5,
              wholesaler: Math.floor(Math.random() * 20) + 5,
              retailer: Math.floor(Math.random() * 20) + 5,
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
          const prevCost = gameData[gameData.length - 1]?.cost || 0;
          const newStock = Math.floor(Math.random() * 15) + 5;
          const newCost = prevCost + Math.floor(Math.random() * 50);
          cb({ stock: newStock, cost: newCost });
          
          // Add to game data for chart
          setGameData(prev => [...prev, { round: prev.length + 1, stock: newStock, cost: newCost }]);
        });
      }, 800);
    }
    
    return mockSocket;
  }
};

// Store for callbacks
const mockCallbacks: Record<string, Function[]> = {};

// Mock initial game data for the chart
const initialGameData = [
  { round: 1, cost: 100, stock: 10 },
  { round: 2, cost: 150, stock: 8 },
  { round: 3, cost: 180, stock: 12 }
];

// Track game data outside component for the mock socket to access
let gameData = [...initialGameData];
const setGameData = (updaterFn: (prev: any[]) => any[]) => {
  gameData = updaterFn(gameData);
};

const GameView: React.FC = () => {
  const [view, setView] = useState<string>("join");
  const [gameId, setGameId] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [stock, setStock] = useState<number>(10);
  const [cost, setCost] = useState<number>(0);
  const [currentGameData, setCurrentGameData] = useState<any[]>(initialGameData);
  const [playerStocks, setPlayerStocks] = useState<Record<string, number>>({});
  const [pendingOrders, setPendingOrders] = useState<Record<string, number>>({});
  const [incomingDeliveries, setIncomingDeliveries] = useState<Record<string, number>>({});
  
  const { toast } = useToast();

  useEffect(() => {
    // Set up mock socket listeners
    mockSocket.on("updateStock", (data: { stock: number; cost: number }) => {
      setStock(data.stock);
      setCost(data.cost);
      setCurrentGameData(prev => [...prev, { round: prev.length + 1, cost: data.cost, stock: data.stock }]);
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

    // Keep the local gameData in sync
    gameData = currentGameData;
    
    return () => {
      // Cleanup listeners
      mockSocket.off();
    };
  }, [currentGameData]);

  const handleJoinGame = (newGameId: string, newRole: string) => {
    if (newGameId && newRole) {
      setGameId(newGameId);
      setRole(newRole);
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
                gameData={currentGameData}
                playerStocks={playerStocks}
                pendingOrders={pendingOrders}
                incomingDeliveries={incomingDeliveries}
                onNextRound={handleNextRound}
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
