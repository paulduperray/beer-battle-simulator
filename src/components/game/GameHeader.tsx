
import React from "react";

interface GameHeaderProps {
  title: string;
  description: string;
}

const GameHeader: React.FC<GameHeaderProps> = ({ title, description }) => {
  return (
    <div className="mb-6 relative">
      <h1 className="text-3xl font-semibold tracking-tight mb-1">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
      
      {/* Small bubbles decorations near the header */}
      <div className="absolute -top-4 -right-2 w-20 h-20 pointer-events-none opacity-40">
        {[...Array(5)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-amber-300"
            style={{
              width: `${4 + Math.random() * 8}px`,
              height: `${4 + Math.random() * 8}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 3}s ease-in-out ${Math.random() * 2}s infinite alternate`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default GameHeader;
