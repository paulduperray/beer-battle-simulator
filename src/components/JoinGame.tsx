
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface JoinGameProps {
  onJoin: (gameId: string, role: string) => void;
}

const JoinGame: React.FC<JoinGameProps> = ({ onJoin }) => {
  const [gameId, setGameId] = useState("");
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = () => {
    if (gameId && role) {
      setIsLoading(true);
      // Simulate loading for better UX
      setTimeout(() => {
        onJoin(gameId, role);
        setIsLoading(false);
      }, 600);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
      <div className="w-full max-w-md px-4">
        <Card className="beer-card overflow-hidden border border-border/60 bg-card/95 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-medium tracking-tight mb-1">Join Game</h2>
              <p className="text-muted-foreground text-sm">Enter your game details to continue</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gameId">Game ID</Label>
                <Input
                  id="gameId"
                  type="text"
                  placeholder="Enter game ID"
                  className="input-field"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Select Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="input-field">
                    <SelectValue placeholder="Choose your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="factory">Factory</SelectItem>
                    <SelectItem value="distributor">Distributor</SelectItem>
                    <SelectItem value="wholesaler">Wholesaler</SelectItem>
                    <SelectItem value="retailer">Retailer</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleJoin} 
                className="beer-button w-full mt-6" 
                disabled={!gameId || !role || isLoading}
              >
                {isLoading ? "Joining..." : "Join Game"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JoinGame;
