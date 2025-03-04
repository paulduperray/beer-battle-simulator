
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, LogIn, List } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

interface JoinGameProps {
  onJoin: (gameId: string, role: string) => void;
}

const JoinGame: React.FC<JoinGameProps> = ({ onJoin }) => {
  const [gameId, setGameId] = useState("");
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recentGames, setRecentGames] = useState<{id: string, game_code: string}[]>([]);
  const [view, setView] = useState<"join" | "create">("join");
  const [createdGameId, setCreatedGameId] = useState<string | null>(null);

  // Fetch recent games when component mounts
  useEffect(() => {
    const fetchRecentGames = async () => {
      try {
        const { data, error } = await supabase
          .from('games')
          .select('id, game_code')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setRecentGames(data || []);
      } catch (error) {
        console.error("Error fetching recent games:", error);
      }
    };

    fetchRecentGames();
  }, []);

  const handleJoin = () => {
    if (!gameId) {
      toast.error("Please enter a game ID");
      return;
    }
    
    if (!role) {
      toast.error("Please select a role");
      return;
    }
    
    setIsLoading(true);
    
    // Join the game
    onJoin(gameId, role);
    
    // Reset loading after a short delay
    setTimeout(() => {
      setIsLoading(false);
    }, 600);
  };

  const getNextGameId = async () => {
    try {
      // Get the highest existing game code that is numeric
      const { data, error } = await supabase
        .from('games')
        .select('game_code')
        .order('game_code', { ascending: false })
        .limit(1);

      if (error) throw error;

      let nextId = 1; // Default start at 1
      
      if (data && data.length > 0) {
        // Try to parse the highest game code as a number
        const highestGame = data[0].game_code;
        const parsedId = parseInt(highestGame, 10);
        
        // If it's a valid number, increment it
        if (!isNaN(parsedId)) {
          nextId = parsedId + 1;
        }
      }
      
      return nextId.toString();
    } catch (error) {
      console.error("Error getting next game ID:", error);
      // Fallback to a random ID if there's an error
      return Math.floor(Math.random() * 1000).toString();
    }
  };

  const handleCreate = async () => {
    if (!role) {
      toast.error("Please select a role");
      return;
    }
    
    setIsLoading(true);
    try {
      // Get next sequential game ID
      const nextGameId = await getNextGameId();
      setCreatedGameId(nextGameId);
      
      // Join the game
      onJoin(nextGameId, role);

      // Update the recent games list
      setRecentGames(prev => [
        { id: 'new', game_code: nextGameId },
        ...prev
      ]);

      toast.success(`Game ${nextGameId} created successfully!`);
    } catch (error) {
      console.error("Error creating game:", error);
      toast.error("Failed to create game. Please try again.");
    } finally {
      setIsLoading(false);
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
                  onClick={() => {
                    setView("join");
                    setCreatedGameId(null);
                  }}
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
              
              {/* Display the created game ID */}
              {view === "create" && createdGameId && (
                <div className="space-y-2 animate-fade-in">
                  <Label htmlFor="createdGameId">Your Game ID</Label>
                  <div className="flex items-center space-x-2 p-2 bg-accent/30 rounded-md border border-border">
                    <span className="font-medium text-lg text-accent-foreground">{createdGameId}</span>
                    <span className="text-xs text-muted-foreground ml-2">(Share this with other players)</span>
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
