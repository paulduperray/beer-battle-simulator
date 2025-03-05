
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import StockChart from "./StockChart";
import { PlayCircle, Clock, AlertTriangle, Hash, Package, DollarSign, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AdminViewProps {
  gameData: any[];
  gameCode?: string;
  playerStocks: Record<string, number>;
  pendingOrders: Record<string, number>;
  incomingDeliveries: Record<string, number>;
  customerOrder?: number | null;
  costParameters?: {
    shortageCost: number;
    holdingCost: number;
  };
  onNextRound: () => void;
  chartDataKeys?: {
    stocks: string[];
    costs: string[];
  };
}

const AdminView: React.FC<AdminViewProps> = ({ 
  gameData, 
  gameCode,
  playerStocks, 
  pendingOrders, 
  incomingDeliveries,
  customerOrder = 5,
  costParameters = { shortageCost: 10, holdingCost: 5 },
  onNextRound,
  chartDataKeys = {
    stocks: ["factory_stock", "distributor_stock", "wholesaler_stock", "retailer_stock"],
    costs: ["factory_cost", "distributor_cost", "wholesaler_cost", "retailer_cost"]
  }
}) => {
  // Map roles to readable names
  const roleTitles: Record<string, string> = {
    "factory": "Factory",
    "distributor": "Distributor", 
    "wholesaler": "Wholesaler",
    "retailer": "Retailer"
  };

  // Get current round number
  const currentRound = gameData.length;

  // Color mapping for consistent styling
  const roleColors = {
    factory: "hsl(220, 70%, 50%)",
    distributor: "hsl(160, 70%, 50%)",
    wholesaler: "hsl(280, 70%, 50%)",
    retailer: "hsl(340, 70%, 50%)"
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-medium tracking-tight mb-1">Game Administration</h2>
          <p className="text-muted-foreground">Monitor and control the game flow</p>
        </div>
        <div className="flex items-center gap-4">
          {gameCode && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Hash className="h-3 w-3" />
              Game ID: {gameCode}
            </Badge>
          )}
          <Badge variant="outline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Round {currentRound}
          </Badge>
          <Button 
            onClick={onNextRound} 
            className="beer-button flex items-center"
          >
            <PlayCircle className="mr-2 h-5 w-5" />
            Next Round
          </Button>
        </div>
      </div>

      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800">Game Information</h4>
            <p className="text-sm text-amber-700">
              Current customer demand: <strong>{customerOrder} units</strong> | 
              Shortage cost: <strong>{costParameters.shortageCost}€ per unit</strong> | 
              Holding cost: <strong>{costParameters.holdingCost}€ per unit</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <Card className="beer-card overflow-hidden border border-border/60 bg-card/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5 text-primary" />
              Stock Levels
            </CardTitle>
            <CardDescription>Track inventory across all roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <StockChart 
                data={gameData} 
                dataKeys={chartDataKeys.stocks}
                title=""
                description=""
                colorMap={{
                  "factory_stock": roleColors.factory,
                  "distributor_stock": roleColors.distributor,
                  "wholesaler_stock": roleColors.wholesaler,
                  "retailer_stock": roleColors.retailer
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="beer-card overflow-hidden border border-border/60 bg-card/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5 text-primary" />
              Cost Analysis
            </CardTitle>
            <CardDescription>Track costs across all roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <StockChart 
                data={gameData} 
                dataKeys={chartDataKeys.costs}
                title=""
                description=""
                colorMap={{
                  "factory_cost": roleColors.factory,
                  "distributor_cost": roleColors.distributor,
                  "wholesaler_cost": roleColors.wholesaler,
                  "retailer_cost": roleColors.retailer
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card className="beer-card overflow-hidden border border-border/60 bg-card/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Current Stock Levels</CardTitle>
            <CardDescription>Available inventory by role</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {Object.entries(playerStocks).map(([role, stock]) => (
                <li key={role} className="py-3 flex justify-between items-center">
                  <span className="font-medium">{roleTitles[role] || role}</span>
                  <div className="flex items-center">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      stock < 0 ? 'bg-red-100 text-red-800' : 
                      stock < 5 ? 'bg-amber-100 text-amber-800' : 
                      stock > 15 ? 'bg-green-100 text-green-800' : 
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {stock} units
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="beer-card overflow-hidden border border-border/60 bg-card/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Pending Orders</CardTitle>
            <CardDescription>Orders waiting to be fulfilled</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {Object.entries(pendingOrders).map(([role, order]) => (
                <li key={role} className="py-3 flex justify-between items-center">
                  <span className="font-medium">{roleTitles[role] || role}</span>
                  <div className="flex items-center">
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm">
                      {order} units
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="beer-card overflow-hidden border border-border/60 bg-card/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Incoming Deliveries</CardTitle>
            <CardDescription>Shipments on their way</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {Object.entries(incomingDeliveries).map(([role, delivery]) => (
                <li key={role} className="py-3 flex justify-between items-center">
                  <span className="font-medium">{roleTitles[role] || role}</span>
                  <div className="flex items-center">
                    <span className="px-3 py-1 rounded-full bg-violet-100 text-violet-800 text-sm">
                      {delivery} units
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 p-2 bg-amber-100 rounded-md flex items-center">
              <ShoppingCart className="h-4 w-4 mr-2 text-amber-600" />
              <span className="text-sm text-amber-800">
                Customer demand: <strong>{customerOrder} units</strong>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminView;
