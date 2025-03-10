
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, ArrowDown, ArrowUp, TrendingUp, Clock, Hash, AlertTriangle, DollarSign, ShoppingCart, LogOut } from "lucide-react";
import StockChart from "./StockChart";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PlayerViewProps {
  role: string;
  stock: number;
  cost: number;
  roundCost: number;
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
  gameData?: any[];
  gameStatus?: string;
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
  gameData = [],
  gameStatus = 'active',
  onPlaceOrder,
  onLogout = () => toast.error("Logout function not implemented")
}) => {
  const [order, setOrder] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastValues, setLastValues] = useState({
    stock,
    cost,
    roundCost,
    lastDownstreamOrder
  });

  useEffect(() => {
    // Check for changes to display notifications
    if (stock !== lastValues.stock) {
      // Stock has changed
      const diff = stock - lastValues.stock;
      if (diff > 0) {
        toast.success(`Received ${diff} units of inventory`);
      } else if (diff < 0 && lastValues.stock > 0) {
        toast.info(`Shipped ${Math.abs(diff)} units from inventory`);
      }
    }

    if (roundCost > 0 && roundCost !== lastValues.roundCost) {
      toast.info(`Cost this round: ${roundCost}€`);
    }

    if (lastDownstreamOrder !== lastValues.lastDownstreamOrder && lastDownstreamOrder !== null) {
      toast.info(`New order received: ${lastDownstreamOrder} units`);
    }

    // Update last values
    setLastValues({
      stock,
      cost,
      roundCost,
      lastDownstreamOrder
    });
  }, [stock, cost, roundCost, lastDownstreamOrder, lastValues]);

  const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setOrder(isNaN(value) ? 0 : value);
  };

  const handleSubmit = () => {
    if (order >= 0) {
      setIsSubmitting(true);
      // Simulate loading for better UX
      setTimeout(() => {
        onPlaceOrder(order);
        setIsSubmitting(false);
        setOrder(0); // Reset order after submission
      }, 400);
    }
  };

  // Map roles to readable names
  const roleTitles: Record<string, string> = {
    factory: "Factory",
    distributor: "Distributor", 
    wholesaler: "Wholesaler",
    retailer: "Retailer"
  };

  const roleDescriptions: Record<string, string> = {
    factory: "Manage production and supply chain",
    distributor: "Supply to wholesalers",
    wholesaler: "Connect distributors and retailers",
    retailer: "Sell directly to consumers"
  };

  // Determine stock status for visual indicators
  const getStockStatus = () => {
    if (stock < 0) return "negative";
    if (stock < 5) return "low";
    if (stock > 15) return "high";
    return "normal";
  };

  const stockStatus = getStockStatus();
  const stockColor = {
    negative: "text-red-500",
    low: "text-amber-500",
    high: "text-green-500",
    normal: "text-sky-500"
  };

  const stockBadge = {
    negative: <Badge variant="destructive" className="animate-pulse">Backorder</Badge>,
    low: <Badge variant="destructive" className="animate-pulse">Low Stock</Badge>,
    high: <Badge className="bg-green-500">Well Stocked</Badge>,
    normal: <Badge variant="secondary">Stable</Badge>
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <div>
          <Badge variant="outline" className="mb-2 animate-float">
            {roleTitles[role] || role}
          </Badge>
          <h2 className="text-2xl font-medium tracking-tight">{roleTitles[role] || role} Dashboard</h2>
          <p className="text-muted-foreground">{roleDescriptions[role] || "Manage your inventory and orders"}</p>
        </div>
        <div className="flex items-center gap-2">
          {gameCode && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Hash className="h-3 w-3" />
              Game ID: {gameCode}
            </Badge>
          )}
          <Badge variant="outline" className={`flex items-center gap-2 ${
            gameStatus === 'paused' ? 'bg-amber-100 text-amber-800' : 
            'bg-blue-100 text-blue-800'
          }`}>
            <Clock className="h-4 w-4" />
            {gameStatus === 'paused' ? 'Game Paused' : 'Game Active'}
          </Badge>
          <Button 
            onClick={onLogout} 
            variant="ghost"
            className="flex items-center"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {gameStatus === 'paused' && (
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertTitle>Game Paused</AlertTitle>
          <AlertDescription>
            The game has been paused by the administrator. You cannot place orders until the game is resumed.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Card className="beer-card overflow-hidden border border-border/60 bg-card/95 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5 text-primary" />
              Current Inventory
            </CardTitle>
            <CardDescription>Your available stock</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end space-x-2">
              <span className={`text-4xl font-semibold ${stockColor[stockStatus]}`}>{stock}</span>
              <span className="text-muted-foreground mb-1">units</span>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div>{stockBadge[stockStatus]}</div>
              
              {stock < 0 && (
                <div className="flex items-center text-sm text-red-500">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  <span>Extra cost: {Math.abs(stock) * costParameters.shortageCost}€</span>
                </div>
              )}
              
              {stock > 0 && (
                <div className="flex items-center text-sm text-amber-500">
                  <DollarSign className="h-3 w-3 mr-1" />
                  <span>Holding cost: {stock * costParameters.holdingCost}€</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="beer-card overflow-hidden border border-border/60 bg-card/95 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-primary" />
              Cost Analysis
            </CardTitle>
            <CardDescription>Total and current costs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <div className="flex items-end space-x-2">
                <span className="text-4xl font-semibold">{cost.toFixed(0)}</span>
                <span className="text-muted-foreground mb-1">€ total</span>
              </div>
              
              <div className="mt-2 flex items-center text-sm">
                <span className="text-amber-500">+{roundCost}€ this round</span>
              </div>
            </div>
            
            <div className="mt-4 flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shortage cost:</span>
                <span>{costParameters.shortageCost}€ per unit</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Holding cost:</span>
                <span>{costParameters.holdingCost}€ per unit</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Card className="beer-card overflow-hidden border border-border/60 bg-card/95 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <ArrowDown className="mr-2 h-5 w-5 text-primary" />
              Incoming Deliveries
            </CardTitle>
            <CardDescription>Orders arriving soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-secondary/30 rounded-md">
                <span className="font-medium">Next round:</span>
                <Badge variant="outline" className={`bg-blue-100 ${upcomingDeliveries.nextRound > 0 ? 'animate-pulse' : ''}`}>
                  {upcomingDeliveries.nextRound} units
                </Badge>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-secondary/30 rounded-md">
                <span className="font-medium">In two rounds:</span>
                <Badge variant="outline" className="bg-blue-100">
                  {upcomingDeliveries.futureRound} units
                </Badge>
              </div>
              
              {role === 'retailer' && customerOrder !== null && (
                <div className="mt-4">
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center p-2 bg-amber-50 rounded-md">
                    <div className="flex items-center">
                      <ShoppingCart className="h-4 w-4 mr-2 text-amber-500" />
                      <span className="font-medium text-amber-700">Customer demand:</span>
                    </div>
                    <Badge variant="outline" className="bg-amber-100 text-amber-800">
                      {customerOrder} units
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="beer-card overflow-hidden border border-border/60 bg-card/95 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <ArrowUp className="mr-2 h-5 w-5 text-primary" />
              Downstream Orders
            </CardTitle>
            <CardDescription>Orders from next in chain</CardDescription>
          </CardHeader>
          <CardContent>
            {lastDownstreamOrder !== null ? (
              <div className="flex justify-between items-center p-2 bg-secondary/30 rounded-md">
                <span className="font-medium">Last order received:</span>
                <Badge variant="outline" className="bg-purple-100">
                  {lastDownstreamOrder} units
                </Badge>
              </div>
            ) : (
              <div className="text-muted-foreground text-center py-4">
                No downstream orders yet
              </div>
            )}
            
            <div className="mt-4 flex items-center bg-secondary/30 rounded-md px-3 py-2">
              <Clock className="h-4 w-4 text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground">Keep track of orders from your customers</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      {gameData.length > 0 && (
        <Card className="mt-4 beer-card overflow-hidden border border-border/60 bg-card/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Performance History</CardTitle>
            <CardDescription>Track your stock levels and costs over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <StockChart 
                data={gameData} 
                dataKeys={["stock", "cost"]}
                title=""
                description=""
                colorMap={{
                  "stock": "hsl(220, 70%, 50%)",
                  "cost": "hsl(30, 70%, 50%)"
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6 beer-card overflow-hidden border border-border/60 bg-card/95 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Place New Order</CardTitle>
          <CardDescription>Order inventory for the next round (delivery after 2 rounds)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center bg-secondary/30 rounded-md px-3 py-2">
              <Clock className="h-4 w-4 text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground">Orders will arrive after 2 rounds</span>
            </div>
            <div className="flex space-x-4">
              <div className="flex-1">
                <Input
                  type="number"
                  min="0"
                  placeholder="Enter order amount"
                  value={order || ""}
                  onChange={handleOrderChange}
                  className="input-field"
                  disabled={gameStatus === 'paused'}
                />
              </div>
              <Button 
                onClick={handleSubmit} 
                className="beer-button" 
                disabled={isSubmitting || gameStatus === 'paused'}
              >
                {isSubmitting ? "Submitting..." : "Place Order"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerView;
