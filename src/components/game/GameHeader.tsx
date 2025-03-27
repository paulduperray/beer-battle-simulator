
import React from "react";

interface GameHeaderProps {
  title: string;
  description: string;
}

const GameHeader: React.FC<GameHeaderProps> = ({ title, description }) => {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-semibold tracking-tight mb-1">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

export default GameHeader;
