import React from 'react';

interface CollaborativeCursorProps {
  position: { top: number; left: number; height: number };
  color: string;
  name: string;
}

export const CollaborativeCursor: React.FC<CollaborativeCursorProps> = ({ position, color, name }) => {
  return (
    <div
      className="absolute pointer-events-none transition-all duration-100 ease-linear z-10"
      style={{
        top: position.top,
        left: position.left,
        height: position.height,
        borderLeft: `2px solid ${color}`
      }}
    >
      <div
        className="absolute top-0 left-0 text-[10px] text-white px-1 rounded-r-sm rounded-bl-sm whitespace-nowrap -mt-4 opacity-50 hover:opacity-100 transition-opacity"
        style={{ backgroundColor: color }}
      >
        {name}
      </div>
    </div>
  );
};
