
import React from "react";
import GameView from "@/components/GameView";
import { Toaster } from "sonner";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <GameView />
      <Toaster position="top-right" />
    </div>
  );
};

export default Index;
