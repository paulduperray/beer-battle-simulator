
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
  roundCost?: number; 
  gameCode?: string;
  allRolesData: any[];
  playerStocks: Record<string, number>;
  pendingOrders: Record<string, number>;
  incomingDeliveries: Record<string, number>;
  upcomingDeliveries?: {
    nextRound: number;
    futureRound: number;
  };
  customerOrder?: number | null;
  lastDownstreamOrder?: number | null;
  costParameters?: {
    shortageCost: number;
    holdingCost: number;
  };
  currentGameData?: any[];
  gameStatus?: string;
  allRoles?: string[];
  onJoinGame: (gameCode: string, role: string) => void;
  onPlaceOrder: (order: number) => void;
  onNextRound: () => void;
  onStartGame?: () => void;
  onPauseGame?: () => void;
  onResumeGame?: () => void;
  onLogout?: () => void;
  chartDataKeys: {
    stocks: string[];
    costs: string[];
  };
}

const GameTabs: React.FC<GameTabsProps> = ({
  view,
  setView,
  role,
  stock,
  cost,
  roundCost = 0,
  gameCode,
  allRolesData,
  playerStocks,
  pendingOrders,
  incomingDeliveries,
  upcomingDeliveries = { nextRound: 0, futureRound: 0 },
  customerOrder = null,
  lastDownstreamOrder = null,
  costParameters = { shortageCost: 10, holdingCost: 5 },
  currentGameData = [],
  gameStatus = 'active',
  allRoles = [],
  onJoinGame,
  onPlaceOrder,
  onNextRound,
  onStartGame,
  onPauseGame,
  onResumeGame,
  onLogout,
  chartDataKeys,
}) => {
  return (
    <Tabs defaultValue={view} value={view} onValueChange={setView} className="w-full">
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
          roundCost={roundCost}
          gameCode={gameCode}
          customerOrder={customerOrder}
          upcomingDeliveries={upcomingDeliveries}
          lastDownstreamOrder={lastDownstreamOrder}
          costParameters={costParameters}
          gameData={currentGameData}
          gameStatus={gameStatus}
          onPlaceOrder={onPlaceOrder}
          onLogout={onLogout}
        />
      </TabsContent>
      
      <TabsContent value="admin" className="mt-0 animate-scale-in">
        <AdminView 
          gameData={allRolesData}
          gameCode={gameCode}
          playerStocks={playerStocks}
          pendingOrders={pendingOrders}
          incomingDeliveries={incomingDeliveries}
          customerOrder={customerOrder}
          costParameters={costParameters}
          gameStatus={gameStatus}
          allRoles={allRoles}
          onNextRound={onNextRound}
          onStartGame={onStartGame}
          onPauseGame={onPauseGame}
          onResumeGame={onResumeGame}
          onLogout={onLogout}
          chartDataKeys={chartDataKeys}
        />
      </TabsContent>
    </Tabs>
  );
};

export default GameTabs;
