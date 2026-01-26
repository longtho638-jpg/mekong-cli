import React from 'react';
import { FacetResponse } from '../types';

interface FacetedFiltersProps {
  facets: FacetResponse | null;
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
}

export const FacetedFilters: React.FC<FacetedFiltersProps> = ({
  facets,
  selectedCategory,
  onCategorySelect
}) => {
  if (!facets) return null;

  return (
    <div className="w-full md:w-64 mb-6 md:mb-0 md:mr-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>

      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Categories</h4>
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => onCategorySelect(null)}
              className={`flex items-center w-full text-left px-2 py-1 rounded text-sm ${
                selectedCategory === null
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Categories
            </button>
          </li>
          {facets.categories.map((cat) => (
            <li key={cat.value}>
              <button
                onClick={() => onCategorySelect(cat.value)}
                className={`flex justify-between items-center w-full text-left px-2 py-1 rounded text-sm ${
                  selectedCategory === cat.value
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>{cat.value}</span>
                <span className="bg-gray-100 text-gray-600 text-xs py-0.5 px-2 rounded-full">
                  {cat.count}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
