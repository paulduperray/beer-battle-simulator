
import React from "react";
import GameView from "@/components/GameView";
import { Toaster } from "sonner";
import { Beer } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYtMi42ODYgNi02cy0yLjY4Ni02LTYtNmMtMyAwLTYgMi42ODYtNiA2czMgNiA2IDZ6bTAgMGMzLjMxNCAwIDYtMi42ODYgNi02cy0yLjY4Ni02LTYtNmMtMyAwLTYgMi42ODYtNiA2czMgNiA2IDZ6bTAgMGMzLjMxNCAwIDYtMi42ODYgNi02cy0yLjY4Ni02LTYtNmMtMyAwLTYgMi42ODYtNiA2czMgNiA2IDZ6IiBzdHJva2U9IiNmOGE3MDAiIG9wYWNpdHk9Ii4xNSIvPjxwYXRoIGQ9Ik0yIDQ0aDU2cDJoLTYwejIyeiIgc3Ryb2tlPSIjZjhhNzAwIiBvcGFjaXR5PSIuMiIvPjwvZz48L3N2Zz4=')] opacity-10"></div>
      
      {/* Header decoration */}
      <div className="w-full bg-amber-500/10 border-b border-amber-200 py-3 mb-6 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2">
            <Beer className="h-8 w-8 text-amber-600" />
            <h1 className="text-2xl font-bold text-amber-800">Beer Distribution Game</h1>
          </div>
        </div>
        
        {/* Animated beer bubbles decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i}
              className="absolute rounded-full bg-amber-300"
              style={{
                width: `${8 + Math.random() * 20}px`,
                height: `${8 + Math.random() * 20}px`,
                left: `${Math.random() * 100}%`,
                bottom: '-20px',
                animation: `float ${3 + Math.random() * 4}s ease-in-out ${Math.random() * 5}s infinite`
              }}
            />
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <GameView />
      </div>
      <Toaster position="top-right" />
    </div>
  );
};

export default Index;
