
import React from "react";

const LoadingIndicator: React.FC = () => {
  return (
    <div className="w-full flex justify-center my-4">
      <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
    </div>
  );
};

export default LoadingIndicator;
