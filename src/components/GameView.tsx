
import React, { useEffect } from "react";
import { useGameState } from "./game/useGameState";
import useGameSubscription from "./game/useGameSubscription";
import GameHeader from "./game/GameHeader";
import LoadingIndicator from "./game/LoadingIndicator";
import GameTabs from "./game/GameTabs";
import JoinGame from "./JoinGame";

const GameView: React.FC = () => {
  const {
    view,
    setView,
    gameId,
    gameCode,
    role,
    stock,
    cost,
    currentGameData,
    allRolesData,
    playerStocks,
    pendingOrders,
    incomingDeliveries,
    loading,
    loadGameData,
    handleJoinGame,
    handlePlaceOrder,
    handleNextRound,
    getDataKeys
  } = useGameState();

  // Set up real-time subscriptions
  useGameSubscription({
    gameId,
    role,
    loadGameData
  });

  // Automatically redirect to the appropriate view after login
  useEffect(() => {
    if (role === "admin") {
      setView("admin");
    } else if (role && role !== "admin") {
      setView("player");
    }
  }, [role, setView]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <GameHeader 
        title="Beer Distribution Game" 
        description="Simulate supply chain dynamics and decision-making"
      />
      
      {loading && <LoadingIndicator />}
      
      {role ? (
        <div className="mb-6">
          <GameTabs
            view={view}
            setView={setView}
            role={role}
            stock={stock}
            cost={cost}
            gameCode={gameCode}
            allRolesData={allRolesData}
            playerStocks={playerStocks}
            pendingOrders={pendingOrders}
            incomingDeliveries={incomingDeliveries}
            onJoinGame={handleJoinGame}
            onPlaceOrder={handlePlaceOrder}
            onNextRound={handleNextRound}
            chartDataKeys={getDataKeys()}
          />
        </div>
      ) : (
        <JoinGame onJoin={handleJoinGame} />
      )}
    </div>
  );
};

export default GameView;
