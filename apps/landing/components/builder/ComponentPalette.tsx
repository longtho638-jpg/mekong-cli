import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { LucideIcon, LayoutTemplate, Grid, DollarSign, Megaphone, MessageSquareQuote, Type, Image, MousePointerClick } from 'lucide-react';
import { COMPONENT_DEFINITIONS, ComponentType } from '../../lib/builder/types';
import { cn } from '../../lib/utils';

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  LayoutTemplate,
  Grid,
  DollarSign,
  Megaphone,
  MessageSquareQuote,
  Type,
  Image,
  MousePointerClick
};

const DraggableItem = ({ type, label, icon }: { type: ComponentType; label: string; icon: string }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: {
      type,
      isPaletteItem: true,
    },
  });

  const Icon = iconMap[icon] || LayoutTemplate;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "flex flex-col items-center justify-center p-4 bg-white border rounded-lg cursor-grab hover:border-primary hover:shadow-sm transition-all",
        isDragging && "opacity-50 ring-2 ring-primary"
      )}
    >
      <Icon className="w-6 h-6 mb-2 text-gray-600" />
      <span className="text-xs font-medium text-gray-700">{label}</span>
    </div>
  );
};

export const ComponentPalette = () => {
  return (
    <div className="w-64 bg-gray-50 border-r h-full overflow-y-auto p-4 flex-shrink-0">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Components</h3>
      <div className="grid grid-cols-2 gap-3">
        {(Object.keys(COMPONENT_DEFINITIONS) as ComponentType[]).map((type) => {
          const def = COMPONENT_DEFINITIONS[type];
          return (
            <DraggableItem
              key={type}
              type={type}
              label={def.label}
              icon={def.icon}
            />
          );
        })}
      </div>
    </div>
  );
};
