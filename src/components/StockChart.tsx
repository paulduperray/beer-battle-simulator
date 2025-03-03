
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";

interface GameData {
  round: number;
  [key: string]: number | string;
}

interface StockChartProps {
  data: GameData[];
  dataKeys: string[];
  title: string;
  description: string;
  colorMap?: Record<string, string>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 p-3 border border-border/60 rounded-md shadow-md backdrop-blur-sm">
        <p className="font-medium">Round {label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-medium">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }

  return null;
};

const StockChart: React.FC<StockChartProps> = ({ data, dataKeys, title, description, colorMap }) => {
  // Default colors if not provided
  const defaultColors = {
    "factory_stock": "hsl(220, 70%, 50%)",
    "distributor_stock": "hsl(160, 70%, 50%)",
    "wholesaler_stock": "hsl(280, 70%, 50%)",
    "retailer_stock": "hsl(340, 70%, 50%)",
    "factory_cost": "hsl(220, 70%, 70%)",
    "distributor_cost": "hsl(160, 70%, 70%)",
    "wholesaler_cost": "hsl(280, 70%, 70%)",
    "retailer_cost": "hsl(340, 70%, 70%)",
    "stock": "hsl(var(--primary))",
    "cost": "hsl(265, 89%, 78%)"
  };

  const colors = { ...defaultColors, ...colorMap };

  // Ensure we have data
  const chartData = data.length > 0 ? data : [{ round: 0 }];

  return (
    <Card className="beer-card overflow-hidden border border-border/60 bg-card/95 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
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
              {dataKeys.map((key, index) => (
                <Line 
                  key={key}
                  type="monotone" 
                  dataKey={key} 
                  name={key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                  stroke={colors[key]} 
                  strokeWidth={2}
                  dot={{ stroke: colors[key], fill: 'hsl(var(--card))' }}
                  activeDot={{ r: 6, stroke: colors[key], fill: colors[key] }}
                  animationDuration={1000 + (index * 100)}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockChart;
