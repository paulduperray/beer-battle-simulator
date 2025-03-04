
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package, ArrowDown, ArrowUp, TrendingUp, Clock, Hash } from "lucide-react";

interface PlayerViewProps {
  role: string;
  stock: number;
  cost: number;
  gameCode?: string;
  onPlaceOrder: (order: number) => void;
}

const PlayerView: React.FC<PlayerViewProps> = ({ role, stock, cost, gameCode, onPlaceOrder }) => {
  const [order, setOrder] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setOrder(isNaN(value) ? 0 : value);
  };

  const handleSubmit = () => {
    if (order > 0) {
      setIsSubmitting(true);
      // Simulate loading for better UX
      setTimeout(() => {
        onPlaceOrder(order);
        setIsSubmitting(false);
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
        {gameCode && (
          <div className="flex items-center">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Hash className="h-3 w-3" />
              Game ID: {gameCode}
            </Badge>
          </div>
        )}
      </div>

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
              <span className="text-4xl font-semibold">{stock}</span>
              <span className="text-muted-foreground mb-1">units</span>
            </div>
            
            <div className="mt-4 flex items-center">
              {stock < 5 ? (
                <Badge variant="destructive" className="animate-pulse">Low Stock</Badge>
              ) : stock > 15 ? (
                <Badge className="bg-green-500">Well Stocked</Badge>
              ) : (
                <Badge variant="secondary">Stable</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="beer-card overflow-hidden border border-border/60 bg-card/95 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-primary" />
              Cumulative Cost
            </CardTitle>
            <CardDescription>Total running expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end space-x-2">
              <span className="text-4xl font-semibold">{cost.toFixed(0)}</span>
              <span className="text-muted-foreground mb-1">€</span>
            </div>
            
            <div className="mt-4 flex items-center">
              {cost > 500 ? (
                <Badge variant="destructive">High Expenses</Badge>
              ) : cost > 200 ? (
                <Badge variant="secondary">Moderate</Badge>
              ) : (
                <Badge className="bg-green-500">Efficient</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
                />
              </div>
              <Button 
                onClick={handleSubmit} 
                className="beer-button" 
                disabled={order <= 0 || isSubmitting}
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
