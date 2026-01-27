import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { LandingComponent } from '../../lib/builder/types';
import { SortableItem } from './SortableItem';
import { cn } from '../../lib/utils';

interface CanvasProps {
  components: LandingComponent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  device: 'desktop' | 'tablet' | 'mobile';
}

export const Canvas: React.FC<CanvasProps> = ({ components, selectedId, onSelect, device }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-droppable',
    data: {
      isCanvas: true,
    }
  });

  const maxWidth = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  }[device];

  return (
    <div className="flex-1 bg-gray-100 overflow-y-auto p-8 flex justify-center">
      <div
        ref={setNodeRef}
        className={cn(
          "bg-white min-h-[calc(100vh-4rem)] shadow-lg transition-all duration-300 ease-in-out",
          isOver && "ring-2 ring-primary ring-offset-2 bg-primary/5"
        )}
        style={{ width: maxWidth }}
      >
        <SortableContext items={components.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {components.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 border-2 border-dashed border-gray-200 m-4 rounded-lg">
              <svg className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>Drag components here to start building</p>
            </div>
          ) : (
            <div className="flex flex-col min-h-full">
              {components.map((component) => (
                <SortableItem
                  key={component.id}
                  component={component}
                  isSelected={selectedId === component.id}
                  onSelect={onSelect}
                />
              ))}
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
};
