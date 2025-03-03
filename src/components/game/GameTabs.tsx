
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JoinGame from "../JoinGame";
import PlayerView from "../PlayerView";
import AdminView from "../AdminView";
import { User, Users, LayoutDashboard } from "lucide-react";

interface GameTabsProps {
  view: string;
  setView: (view: string) => void;
  role: string;
  stock: number;
  cost: number;
  allRolesData: any[];
  playerStocks: Record<string, number>;
  pendingOrders: Record<string, number>;
  incomingDeliveries: Record<string, number>;
  onJoinGame: (gameCode: string, role: string) => void;
  onPlaceOrder: (order: number) => void;
  onNextRound: () => void;
  chartDataKeys: string[];
}

const GameTabs: React.FC<GameTabsProps> = ({
  view,
  setView,
  role,
  stock,
  cost,
  allRolesData,
  playerStocks,
  pendingOrders,
  incomingDeliveries,
  onJoinGame,
  onPlaceOrder,
  onNextRound,
  chartDataKeys,
}) => {
  return (
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
        <JoinGame onJoin={onJoinGame} />
      </TabsContent>
      
      <TabsContent value="player" className="mt-0 animate-scale-in">
        <PlayerView 
          role={role} 
          stock={stock} 
          cost={cost} 
          onPlaceOrder={onPlaceOrder} 
        />
      </TabsContent>
      
      <TabsContent value="admin" className="mt-0 animate-scale-in">
        <AdminView 
          gameData={allRolesData}
          playerStocks={playerStocks}
          pendingOrders={pendingOrders}
          incomingDeliveries={incomingDeliveries}
          onNextRound={onNextRound}
          chartDataKeys={chartDataKeys}
        />
      </TabsContent>
    </Tabs>
  );
};

export default GameTabs;
