import React from 'react';
import { COMPONENT_DEFINITIONS, LandingComponent, ComponentPropValue } from '../../lib/builder/types';
import { cn } from '../../lib/utils';

interface PropertyPanelProps {
  selectedComponent: LandingComponent | null;
  onUpdate: (id: string, props: Record<string, ComponentPropValue>) => void;
  onDelete: (id: string) => void;
}

// Type-safe prop accessors
const getString = (value: ComponentPropValue, fallback = ''): string => {
  return typeof value === 'string' ? value : fallback;
};

const getNumber = (value: ComponentPropValue, fallback = 0): number => {
  return typeof value === 'number' ? value : fallback;
};

export const PropertyPanel: React.FC<PropertyPanelProps> = ({ selectedComponent, onUpdate, onDelete }) => {
  if (!selectedComponent) {
    return (
      <div className="w-80 bg-gray-50 border-l h-full p-6 flex flex-col items-center justify-center text-gray-500 text-sm">
        <p>Select a component to edit its properties</p>
      </div>
    );
  }

  const def = COMPONENT_DEFINITIONS[selectedComponent.type];

  const handleChange = (name: string, value: ComponentPropValue) => {
    onUpdate(selectedComponent.id, { [name]: value });
  };

  return (
    <div className="w-80 bg-white border-l h-full flex flex-col">
      <div className="p-4 border-b flex justify-between items-center bg-gray-50">
        <h3 className="font-semibold text-gray-800">{def.label}</h3>
        <button
          onClick={() => onDelete(selectedComponent.id)}
          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
          title="Delete Component"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {def.properties.map((prop) => (
          <div key={prop.name} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {prop.label}
            </label>

            {prop.type === 'text' && (
              <input
                type="text"
                value={getString(selectedComponent.props[prop.name])}
                onChange={(e) => handleChange(prop.name, e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            )}

            {prop.type === 'number' && (
              <input
                type="number"
                value={getNumber(selectedComponent.props[prop.name])}
                onChange={(e) => handleChange(prop.name, Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            )}

            {prop.type === 'select' && (
              <select
                value={getString(selectedComponent.props[prop.name])}
                onChange={(e) => handleChange(prop.name, e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
              >
                {prop.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}

            {prop.type === 'color' && (
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={getString(selectedComponent.props[prop.name], '#000000')}
                  onChange={(e) => handleChange(prop.name, e.target.value)}
                  className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  value={getString(selectedComponent.props[prop.name])}
                  onChange={(e) => handleChange(prop.name, e.target.value)}
                  className="flex-1 px-3 py-1 border rounded-md text-sm font-mono"
                />
              </div>
            )}

            {prop.type === 'image' && (
               <div className="space-y-2">
                 <input
                    type="text"
                    value={getString(selectedComponent.props[prop.name])}
                    onChange={(e) => handleChange(prop.name, e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://..."
                 />
                 {selectedComponent.props[prop.name] && (
                   <div className="relative aspect-video w-full rounded-md overflow-hidden bg-gray-100 border">
                     <img
                       src={getString(selectedComponent.props[prop.name])}
                       alt="Preview"
                       className="object-cover w-full h-full"
                     />
                   </div>
                 )}
               </div>
            )}

            {prop.type === 'boolean' && (
               <label className="flex items-center space-x-2 cursor-pointer">
                 <input
                    type="checkbox"
                    checked={!!selectedComponent.props[prop.name]}
                    onChange={(e) => handleChange(prop.name, e.target.checked)}
                    className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                 />
                 <span className="text-sm text-gray-600">Enabled</span>
               </label>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
