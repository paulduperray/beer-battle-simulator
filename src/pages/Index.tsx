import React, { useEffect, useState } from "react";
import GameView from "@/components/GameView";
import { Toaster } from "sonner";
import { Beer } from "lucide-react";
import GameHeader from "@/components/game/GameHeader";

const Index = () => {
  const [bubbles, setBubbles] = useState<Array<{id: number, size: number, left: number, bottom: number, speed: number, delay: number}>>([]);

  useEffect(() => {
    // Create 15 bubbles with random properties
    const newBubbles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      size: 5 + Math.random() * 15, // Size between 5px and 20px
      left: Math.random() * 100, // Position across the full width
      bottom: -10 - Math.random() * 20, // Start below the visible area
      speed: 1.5 + Math.random() * 2, // Different speeds
      delay: Math.random() * 5 // Staggered start times
    }));
    setBubbles(newBubbles);

    // Regenerate bubbles every 10 seconds for continuous effect
    const intervalId = setInterval(() => {
      setBubbles(prev => prev.map(bubble => ({
        ...bubble,
        bottom: -10 - Math.random() * 20, // Reset position
        left: Math.random() * 100, // New horizontal position
        speed: 1.5 + Math.random() * 2 // New speed
      })));
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYtMi42ODYgNi02cy0yLjY4Ni02LTYtNmMtMyAwLTYgMi42ODYtNiA2czMgNiA2IDZ6bTAgMGMzLjMxNCAwIDYtMi42ODYgNi02cy0yLjY4Ni02LTYtNmMtMyAwLTYgMi42ODYtNiA2czMgNiA2IDZ6IiBzdHJva2U9IiNmOGE3MDAiIG9wYWNpdHk9Ii4xNSIvPjxwYXRoIGQ9Ik0yIDQ0aDU2cDJoLTYwejIyeiIgc3Ryb2tlPSIjZjhhNzAwIiBvcGFjaXR5PSIuMiIvPjwvZz48L3N2Zz4=')] opacity-10"></div>
      
      {/* Header with enhanced bubbles animation */}
      <div className="w-full bg-amber-500/10 border-b border-amber-200 py-3 mb-6 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2">
            <Beer className="h-8 w-8 text-amber-600" />
            <h1 className="text-2xl font-bold text-amber-800">Beer Distribution Game</h1>
          </div>
        </div>
        
        {/* Enhanced animated beer bubbles */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          {bubbles.map((bubble) => (
            <div 
              key={bubble.id}
              className="absolute rounded-full bg-gradient-to-br from-amber-200 to-amber-300 opacity-70"
              style={{
                width: `${bubble.size}px`,
                height: `${bubble.size}px`,
                left: `${bubble.left}%`,
                bottom: `${bubble.bottom}px`,
                animation: `float ${bubble.speed}s ease-in-out ${bubble.delay}s infinite, 
                           wobble ${bubble.speed * 1.5}s ease-in-out ${bubble.delay}s infinite,
                           pop ${15 + Math.random() * 20}s linear ${5 + bubble.delay * 2}s forwards`
              }}
            />
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <GameHeader 
          title="Beer Distribution Game" 
          description="Simulate supply chain dynamics and decision-making"
        />
        <GameView />
      </div>
      <Toaster position="top-right" />
    </div>
  );
};

export default Index;
