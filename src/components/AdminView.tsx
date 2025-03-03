
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import StockChart from "./StockChart";
import { PlayCircle } from "lucide-react";

interface AdminViewProps {
  gameData: any[];
  playerStocks: Record<string, number>;
  pendingOrders: Record<string, number>;
  incomingDeliveries: Record<string, number>;
  onNextRound: () => void;
  chartDataKeys?: string[];
}

const AdminView: React.FC<AdminViewProps> = ({ 
  gameData, 
  playerStocks, 
  pendingOrders, 
  incomingDeliveries, 
  onNextRound,
  chartDataKeys = ["factory_stock", "distributor_stock", "wholesaler_stock", "retailer_stock"]
}) => {
  // Map roles to readable names
  const roleTitles: Record<string, string> = {
    "factory": "Factory",
    "distributor": "Distributor", 
    "wholesaler": "Wholesaler",
    "retailer": "Retailer"
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-medium tracking-tight mb-1">Game Administration</h2>
          <p className="text-muted-foreground">Monitor and control the game flow</p>
        </div>
        <Button 
          onClick={onNextRound} 
          className="beer-button flex items-center"
        >
          <PlayCircle className="mr-2 h-5 w-5" />
          Next Round
        </Button>
      </div>

      <StockChart 
        data={gameData} 
        dataKeys={chartDataKeys}
        title="Supply Chain Performance"
        description="Track stock levels and costs across all roles"
      />

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
                      stock < 5 ? 'bg-red-100 text-red-800' : 
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminView;
