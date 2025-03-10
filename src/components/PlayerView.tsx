
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { PackageIcon, TruckIcon, WarehouseIcon, StoreIcon, LogOutIcon, ShoppingCartIcon, DatabaseIcon, BanknoteIcon, BadgeInfoIcon } from "lucide-react";
import StockChart from "./StockChart";

interface PlayerViewProps {
  role: string;
  stock: number;
  cost: number;
  roundCost?: number;
  gameCode?: string;
  customerOrder?: number | null;
  upcomingDeliveries?: {
    nextRound: number;
    futureRound: number;
  };
  lastDownstreamOrder?: number | null;
  costParameters?: {
    shortageCost: number;
    holdingCost: number;
  };
  currentGameData?: any[];
  gameStatus?: string;
  currentRound?: number;
  onPlaceOrder: (order: number) => void;
  onLogout?: () => void;
}

const PlayerView: React.FC<PlayerViewProps> = ({
  role,
  stock,
  cost,
  roundCost = 0,
  gameCode,
  customerOrder = null,
  upcomingDeliveries = { nextRound: 0, futureRound: 0 },
  lastDownstreamOrder = null,
  costParameters = { shortageCost: 10, holdingCost: 5 },
  currentGameData = [],
  gameStatus = 'active',
  currentRound = 1,
  onPlaceOrder,
  onLogout
}) => {
  const [orderAmount, setOrderAmount] = useState<string>("0");
  const [hasOrderedThisRound, setHasOrderedThisRound] = useState(false);

  const getRoleIcon = () => {
    switch (role) {
      case "factory":
        return <WarehouseIcon className="h-6 w-6" />;
      case "distributor":
        return <TruckIcon className="h-6 w-6" />;
      case "wholesaler":
        return <PackageIcon className="h-6 w-6" />;
      case "retailer":
        return <StoreIcon className="h-6 w-6" />;
      default:
        return <BadgeInfoIcon className="h-6 w-6" />;
    }
  };

  const getRoleName = () => {
    switch (role) {
      case "factory":
        return "Factory";
      case "distributor":
        return "Distributor";
      case "wholesaler":
        return "Wholesaler";
      case "retailer":
        return "Retailer";
      default:
        return "Player";
    }
  };

  const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setOrderAmount(value);
    }
  };

  const handleSubmitOrder = () => {
    const amount = Number(orderAmount);
    if (amount >= 0) {
      onPlaceOrder(amount);
      setHasOrderedThisRound(true);
    }
  };

  const isOrderDisabled = () => {
    return gameStatus === 'paused' || parseInt(orderAmount) < 0 || hasOrderedThisRound;
  };

  const getOrderButtonText = () => {
    if (hasOrderedThisRound) {
      return "Order Placed for This Round";
    } else if (gameStatus === 'paused') {
      return "Game Paused";
    } else {
      return "Place Order";
    }
  };

  // Reset hasOrderedThisRound when the round changes
  React.useEffect(() => {
    setHasOrderedThisRound(false);
  }, [currentRound]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getRoleIcon()}
          <h2 className="text-2xl font-bold">{getRoleName()} Dashboard</h2>
          <Badge variant="outline" className="ml-2">
            Game: {gameCode}
          </Badge>
          <Badge variant={gameStatus === 'active' ? 'default' : 'secondary'} className="ml-2">
            {gameStatus === 'active' ? 'Active' : 'Paused'}
          </Badge>
          <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800">
            Round {currentRound}
          </Badge>
        </div>
        {onLogout && (
          <Button variant="ghost" size="icon" onClick={onLogout} title="Logout">
            <LogOutIcon className="h-5 w-5" />
          </Button>
        )}
      </div>

      {gameStatus === 'paused' && (
        <Alert variant="warning">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertTitle>Game Paused</AlertTitle>
          <AlertDescription>
            The game is currently paused by the administrator. You cannot place orders until it resumes.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="beer-card overflow-hidden border border-border/60 bg-card/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DatabaseIcon className="h-5 w-5" />
              Current Inventory
            </CardTitle>
            <CardDescription>Your current stock level and costs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col p-4 bg-accent/20 rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-1">Current Stock</div>
                <div className="text-3xl font-bold">{stock} units</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Total Cost</div>
                  <div className="text-2xl font-bold">${cost}</div>
                </div>
                <div className="flex flex-col p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Last Round Cost</div>
                  <div className="text-2xl font-bold">${roundCost}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="beer-card overflow-hidden border border-border/60 bg-card/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TruckIcon className="h-5 w-5" />
              Logistics Overview
            </CardTitle>
            <CardDescription>
              Upcoming deliveries and orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col p-4 bg-accent/20 rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Next Delivery</div>
                  <div className="text-2xl font-bold">{upcomingDeliveries.nextRound} units</div>
                  <div className="text-xs text-muted-foreground mt-1">Arriving next round</div>
                </div>
                <div className="flex flex-col p-4 bg-accent/20 rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Future Delivery</div>
                  <div className="text-2xl font-bold">{upcomingDeliveries.futureRound} units</div>
                  <div className="text-xs text-muted-foreground mt-1">Arriving in 2 rounds</div>
                </div>
              </div>
              
              {role === "retailer" && (
                <div className="flex flex-col p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Customer Demand</div>
                  <div className="text-2xl font-bold flex items-center">
                    <ShoppingCartIcon className="h-5 w-5 mr-2" />
                    {customerOrder !== null ? `${customerOrder} units` : "Unknown"}
                  </div>
                </div>
              )}
              
              {role !== "factory" && lastDownstreamOrder !== null && (
                <div className="flex flex-col p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Last Order from {role === "distributor" ? "Factory" : role === "wholesaler" ? "Distributor" : "Wholesaler"}
                  </div>
                  <div className="text-2xl font-bold">{lastDownstreamOrder} units</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="beer-card overflow-hidden border border-border/60 bg-card/95 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BanknoteIcon className="h-5 w-5" />
            Cost Parameters
          </CardTitle>
          <CardDescription>Current cost settings for inventory management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <div className="text-sm font-medium text-muted-foreground mb-1">Shortage Cost</div>
              <div className="text-2xl font-bold">${costParameters.shortageCost} per unit</div>
              <div className="text-xs text-muted-foreground mt-1">Cost incurred when you can't fulfill an order</div>
            </div>
            <div className="flex flex-col p-4 bg-green-100 dark:bg-green-900 rounded-lg">
              <div className="text-sm font-medium text-muted-foreground mb-1">Holding Cost</div>
              <div className="text-2xl font-bold">${costParameters.holdingCost} per unit</div>
              <div className="text-xs text-muted-foreground mt-1">Cost of keeping inventory in stock</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="beer-card overflow-hidden border border-border/60 bg-card/95 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Place New Order</CardTitle>
          <CardDescription>
            {role === "factory" 
              ? "Order from production" 
              : role === "distributor" 
                ? "Order from factory" 
                : role === "wholesaler" 
                  ? "Order from distributor" 
                  : "Order from wholesaler"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <div className="mb-2 text-sm font-medium">
                Order Quantity
              </div>
              <Input
                type="text"
                value={orderAmount}
                onChange={handleOrderChange}
                disabled={isOrderDisabled()}
                placeholder="Enter quantity"
                className="w-full"
              />
            </div>
            <Button
              onClick={handleSubmitOrder}
              disabled={isOrderDisabled()}
              className="beer-button"
            >
              {getOrderButtonText()}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50 dark:bg-slate-900 text-sm text-muted-foreground px-6 py-3">
          <p>Delivery will arrive in 2 rounds. Plan accordingly!</p>
        </CardFooter>
      </Card>

      {currentGameData && currentGameData.length > 0 && (
        <Card className="mt-4 beer-card overflow-hidden border border-border/60 bg-card/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Performance History</CardTitle>
            <CardDescription>Your stock levels and costs over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <StockChart 
                data={currentGameData} 
                dataKeys={["stock", "cost"]}
                title=""
                description=""
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PlayerView;
