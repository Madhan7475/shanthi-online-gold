import React from "react";

const Process = () => {
  return (
    <div className="relative w-full">
      {/* SVG Banner */}
      <img
        src="/process.svg" // update path if needed
        alt="Process Banner"
        className="w-full h-auto"
      />

      {/* Your process steps/components can go below */}
      <div className="container mx-auto py-10 px-4">
        {/* Your steps or cards go here */}
      </div>
    </div>
  );
};

export default Process;
