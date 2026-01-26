import { useState, useCallback } from 'react';

export interface RemoteCursor {
  userId: string;
  position: number;
}

export const useCursors = () => {
  const [cursors, setCursors] = useState<Map<string, number>>(new Map());

  const handleCursorUpdate = useCallback((userId: string, position: number) => {
    setCursors(prev => {
      const newCursors = new Map(prev);
      newCursors.set(userId, position);
      return newCursors;
    });
  }, []);

  return { cursors, handleCursorUpdate };
};
