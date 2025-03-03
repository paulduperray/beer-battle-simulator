
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";

interface GameData {
  round: number;
  cost: number;
  stock: number;
}

interface StockChartProps {
  data: GameData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 p-3 border border-border/60 rounded-md shadow-md backdrop-blur-sm">
        <p className="font-medium">Round {label}</p>
        <p className="text-sm text-blue-500">
          Stock: <span className="font-medium">{payload[0].value} units</span>
        </p>
        <p className="text-sm text-violet-500">
          Cost: <span className="font-medium">{payload[1].value}€</span>
        </p>
      </div>
    );
  }

  return null;
};

const StockChart: React.FC<StockChartProps> = ({ data }) => {
  // Ensure we have data
  const chartData = data.length > 0 ? data : [{ round: 0, cost: 0, stock: 0 }];

  return (
    <Card className="beer-card overflow-hidden border border-border/60 bg-card/95 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Game Performance</CardTitle>
        <CardDescription>Track your stock and cost over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="round" 
                stroke="hsl(var(--muted-foreground))" 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="stock" 
                name="Stock Level" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ stroke: 'hsl(var(--primary))', fill: 'hsl(var(--card))' }}
                activeDot={{ r: 6, stroke: 'hsl(var(--primary))', fill: 'hsl(var(--primary))' }}
                animationDuration={1000}
              />
              <Line 
                type="monotone" 
                dataKey="cost" 
                name="Cumulative Cost" 
                stroke="hsl(265, 89%, 78%)" 
                strokeWidth={2}
                dot={{ stroke: 'hsl(265, 89%, 78%)', fill: 'hsl(var(--card))' }}
                activeDot={{ r: 6, stroke: 'hsl(265, 89%, 78%)', fill: 'hsl(265, 89%, 78%)' }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockChart;
