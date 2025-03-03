
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StockChart from "./StockChart";
import { Package, Truck, ClipboardList, SkipForward } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface AdminViewProps {
  gameData: any[];
  playerStocks: Record<string, number>;
  pendingOrders: Record<string, number>;
  incomingDeliveries: Record<string, number>;
  onNextRound: () => void;
}

const AdminView: React.FC<AdminViewProps> = ({
  gameData,
  playerStocks,
  pendingOrders,
  incomingDeliveries,
  onNextRound,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleNextRound = () => {
    setIsLoading(true);
    // Simulate loading for better UX
    setTimeout(() => {
      onNextRound();
      setIsLoading(false);
    }, 800);
  };

  // Format player names for display
  const formatPlayerName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <Badge variant="outline" className="mb-2 animate-float">Admin</Badge>
        <h2 className="text-2xl font-medium tracking-tight">Game Administration</h2>
        <p className="text-muted-foreground">Monitor and control the beer distribution game</p>
      </div>

      <div className="grid grid-cols-1 gap-6 mt-6">
        <Card className="beer-card overflow-hidden border border-border/60 bg-card/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <SkipForward className="mr-2 h-5 w-5 text-primary" />
              Game Control
            </CardTitle>
            <CardDescription>Advance the game to the next round</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-4">
              All players will process their pending orders and receive deliveries.
            </div>
            <Button 
              onClick={handleNextRound} 
              className="beer-button w-full sm:w-auto" 
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Advance to Next Round"}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="beer-card overflow-hidden border border-border/60 bg-card/95 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-base">
                <Package className="mr-2 h-5 w-5 text-primary" />
                Inventory Levels
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-0">
              <ul className="divide-y divide-border/60">
                {Object.entries(playerStocks).map(([player, stock]) => (
                  <li key={player} className="py-2 flex justify-between items-center">
                    <span className="text-sm">{formatPlayerName(player)}</span>
                    <Badge variant={stock < 5 ? "destructive" : "outline"}>
                      {stock} units
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="beer-card overflow-hidden border border-border/60 bg-card/95 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-base">
                <ClipboardList className="mr-2 h-5 w-5 text-primary" />
                Pending Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-0">
              <ul className="divide-y divide-border/60">
                {Object.entries(pendingOrders).map(([player, order]) => (
                  <li key={player} className="py-2 flex justify-between items-center">
                    <span className="text-sm">{formatPlayerName(player)}</span>
                    <Badge variant="secondary">
                      {order} units
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="beer-card overflow-hidden border border-border/60 bg-card/95 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-base">
                <Truck className="mr-2 h-5 w-5 text-primary" />
                Incoming Deliveries
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-0">
              <ul className="divide-y divide-border/60">
                {Object.entries(incomingDeliveries).map(([player, delivery]) => (
                  <li key={player} className="py-2 flex justify-between items-center">
                    <span className="text-sm">{formatPlayerName(player)}</span>
                    <Badge variant="outline" className="bg-primary/10">
                      {delivery} units
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <StockChart data={gameData} />
      </div>
    </div>
  );
};

export default AdminView;
