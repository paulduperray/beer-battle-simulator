
import React from "react";
import GameView from "@/components/GameView";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {!isSupabaseConfigured && (
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Supabase configuration missing</AlertTitle>
            <AlertDescription>
              Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.
              The application will run in offline mode with limited functionality until these are provided.
            </AlertDescription>
          </Alert>
        </div>
      )}
      <GameView />
    </div>
  );
};

export default Index;
