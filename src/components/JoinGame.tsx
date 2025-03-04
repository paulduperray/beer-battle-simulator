
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, LogIn, List } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface JoinGameProps {
  onJoin: (gameId: string, role: string) => void;
}

const JoinGame: React.FC<JoinGameProps> = ({ onJoin }) => {
  const [gameId, setGameId] = useState("");
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recentGames, setRecentGames] = useState<{id: string, game_code: string}[]>([]);
  const [view, setView] = useState<"join" | "create">("join");

  // Fetch recent games when component mounts
  useEffect(() => {
    const fetchRecentGames = async () => {
      try {
        const { data, error } = await supabase
          .from('games')
          .select('id, game_code')
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setRecentGames(data || []);
      } catch (error) {
        console.error("Error fetching recent games:", error);
      }
    };

    fetchRecentGames();
  }, []);

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

  const handleCreate = () => {
    if (role) {
      setIsLoading(true);
      // Generate a random 6-character game ID
      const randomGameId = Math.random().toString(36).substring(2, 8).toUpperCase();
      setTimeout(() => {
        onJoin(randomGameId, role);
        setIsLoading(false);
      }, 600);
    }
  };

  const selectRecentGame = (gameCode: string) => {
    setGameId(gameCode);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
      <div className="w-full max-w-md px-4">
        <Card className="beer-card overflow-hidden border border-border/60 bg-card/95 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="mb-6">
              <div className="flex justify-center space-x-4 mb-6">
                <Button 
                  variant={view === "join" ? "default" : "outline"} 
                  onClick={() => setView("join")}
                  className="flex items-center"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Join Game
                </Button>
                <Button 
                  variant={view === "create" ? "default" : "outline"} 
                  onClick={() => setView("create")}
                  className="flex items-center"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Game
                </Button>
              </div>
              
              <h2 className="text-2xl font-medium tracking-tight mb-1">
                {view === "join" ? "Join Game" : "Create Game"}
              </h2>
              <p className="text-muted-foreground text-sm">
                {view === "join" 
                  ? "Enter game details to join an existing game" 
                  : "Create a new game session and invite others"}
              </p>
            </div>
            
            <div className="space-y-4">
              {view === "join" && (
                <div className="space-y-2">
                  <Label htmlFor="gameId">Game ID</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="gameId"
                      type="text"
                      placeholder="Enter game ID"
                      className="input-field"
                      value={gameId}
                      onChange={(e) => setGameId(e.target.value)}
                    />
                    {recentGames.length > 0 && (
                      <Select onValueChange={selectRecentGame}>
                        <SelectTrigger className="w-[120px]">
                          <List className="h-4 w-4" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="bg-background">
                          {recentGames.map((game) => (
                            <SelectItem key={game.id} value={game.game_code}>
                              {game.game_code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="role">Select Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="input-field">
                    <SelectValue placeholder="Choose your role" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    <SelectItem value="factory">Factory</SelectItem>
                    <SelectItem value="distributor">Distributor</SelectItem>
                    <SelectItem value="wholesaler">Wholesaler</SelectItem>
                    <SelectItem value="retailer">Retailer</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {view === "join" ? (
                <Button 
                  onClick={handleJoin} 
                  className="beer-button w-full mt-6 flex items-center justify-center" 
                  disabled={!gameId || !role || isLoading}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  {isLoading ? "Joining..." : "Join Game"}
                </Button>
              ) : (
                <Button 
                  onClick={handleCreate} 
                  className="beer-button w-full mt-6 flex items-center justify-center" 
                  disabled={!role || isLoading}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {isLoading ? "Creating..." : "Create Game"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JoinGame;
