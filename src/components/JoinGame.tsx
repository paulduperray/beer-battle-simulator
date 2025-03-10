
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, LogIn, List, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface JoinGameProps {
  onJoin: (gameId: string, role: string) => void;
}

const JoinGame: React.FC<JoinGameProps> = ({ onJoin }) => {
  const [gameId, setGameId] = useState("");
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recentGames, setRecentGames] = useState<{id: string, game_code: string, status: string}[]>([]);
  const [view, setView] = useState<"join" | "create" | "admin">("join");
  const [createdGameId, setCreatedGameId] = useState<string | null>(null);
  const [takenRoles, setTakenRoles] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentGames();
  }, []);

  useEffect(() => {
    if (!gameId) {
      setTakenRoles([]);
      return;
    }
    
    const checkTakenRoles = async () => {
      try {
        const { data: game, error: gameError } = await supabase
          .from('games')
          .select('id')
          .eq('game_code', gameId)
          .maybeSingle();
          
        if (gameError || !game) {
          return;
        }
        
        const { data: players, error: playersError } = await supabase
          .from('players')
          .select('role')
          .eq('game_id', game.id);
          
        if (!playersError && players) {
          setTakenRoles(players.map(p => p.role));
        }
      } catch (error) {
        console.error("Error checking taken roles:", error);
      }
    };
    
    checkTakenRoles();
  }, [gameId]);

  const fetchRecentGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('id, game_code, status')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentGames(data || []);
    } catch (error) {
      console.error("Error fetching recent games:", error);
    }
  };

  const handleJoin = () => {
    setErrorMessage(null);
    
    if (!gameId) {
      setErrorMessage("Please enter a game ID");
      return;
    }
    
    if (!role) {
      setErrorMessage("Please select a role");
      return;
    }
    
    setIsLoading(true);
    
    onJoin(gameId, role);
    
    setTimeout(() => {
      setIsLoading(false);
    }, 600);
  };

  const getNextGameId = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('game_code')
        .order('game_code', { ascending: false })
        .limit(1);

      if (error) throw error;

      let nextId = 1;
      
      if (data && data.length > 0) {
        const highestGame = data[0].game_code;
        const parsedId = parseInt(highestGame, 10);
        
        if (!isNaN(parsedId)) {
          nextId = parsedId + 1;
        }
      }
      
      return nextId.toString();
    } catch (error) {
      console.error("Error getting next game ID:", error);
      return Math.floor(Math.random() * 1000).toString();
    }
  };

  const handleCreate = async () => {
    setErrorMessage(null);
    
    if (!role) {
      setErrorMessage("Please select a role");
      return;
    }
    
    setIsLoading(true);
    try {
      const nextGameId = await getNextGameId();
      console.log(`About to create game with ID: ${nextGameId}`);
      setGameId(nextGameId); // Set the gameId for join
      setCreatedGameId(nextGameId);
      
      // Only call onJoin which will handle both creation and joining
      await onJoin(nextGameId, role);
      
      // Update recent games list
      setRecentGames(prev => [
        { id: 'new', game_code: nextGameId, status: 'active' },
        ...prev
      ]);
      
      // Refresh the game list to see the newly created game
      await fetchRecentGames();

      if (role === 'admin') {
        setView("admin");
      }

      toast.success(`Game ${nextGameId} created successfully!`);
    } catch (error) {
      console.error("Error creating game:", error);
      setErrorMessage("Failed to create game. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectRecentGame = (gameCode: string) => {
    setGameId(gameCode);
    setErrorMessage(null);
  };
  
  const refreshGames = () => {
    fetchRecentGames();
    toast.success("Game list refreshed");
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
                    setErrorMessage(null);
                  }}
                  className="flex items-center"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  <span>Join Game</span>
                </Button>
                <Button 
                  variant={view === "create" ? "default" : "outline"} 
                  onClick={() => {
                    setView("create");
                    setErrorMessage(null);
                  }}
                  className="flex items-center"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Create Game</span>
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
            
            {errorMessage && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            
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
                      onChange={(e) => {
                        setGameId(e.target.value);
                        setErrorMessage(null);
                      }}
                    />
                    <div className="flex space-x-1">
                      {recentGames.length > 0 && (
                        <Select onValueChange={selectRecentGame}>
                          <SelectTrigger className="w-[100px]">
                            <List className="h-4 w-4" />
                          </SelectTrigger>
                          <SelectContent position="popper" className="bg-background">
                            {recentGames.map((game) => (
                              <SelectItem key={game.id} value={game.game_code}>
                                <div className="flex items-center gap-2">
                                  <span>{game.game_code}</span>
                                  <Badge variant="outline" className={
                                    game.status === 'active' ? 'bg-green-100 text-green-800' :
                                    game.status === 'paused' ? 'bg-amber-100 text-amber-800' :
                                    'bg-blue-100 text-blue-800'
                                  }>
                                    {game.status}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={refreshGames}
                        title="Refresh game list"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
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
                <Select 
                  value={role} 
                  onValueChange={(val) => {
                    setRole(val);
                    setErrorMessage(null);
                  }}
                >
                  <SelectTrigger className="input-field">
                    <SelectValue placeholder="Choose your role" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    <SelectItem value="factory">
                      Factory
                      {takenRoles.includes("factory") && <span className="ml-2 text-xs text-muted-foreground">(Already used)</span>}
                    </SelectItem>
                    <SelectItem value="distributor">
                      Distributor
                      {takenRoles.includes("distributor") && <span className="ml-2 text-xs text-muted-foreground">(Already used)</span>}
                    </SelectItem>
                    <SelectItem value="wholesaler">
                      Wholesaler
                      {takenRoles.includes("wholesaler") && <span className="ml-2 text-xs text-muted-foreground">(Already used)</span>}
                    </SelectItem>
                    <SelectItem value="retailer">
                      Retailer
                      {takenRoles.includes("retailer") && <span className="ml-2 text-xs text-muted-foreground">(Already used)</span>}
                    </SelectItem>
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
