import React from 'react';
import { useSearchStore } from './store.js';

interface FacetListProps {
  attribute: string;
  indexName: string;
  title?: string;
  className?: string;
}

export const FacetList: React.FC<FacetListProps> = ({
  attribute,
  indexName,
  title,
  className = '',
}) => {
  const { results, search, filters, toggleFilter } = useSearchStore();

  if (!results || !results.facets || !results.facets[attribute]) {
    return null;
  }

  const facets = results.facets[attribute];

  // Sort facets by count descending
  const sortedFacets = Object.entries(facets).sort((a, b) => b[1] - a[1]);

  const handleSelect = (value: string) => {
    toggleFilter(attribute, value);
    search(indexName);
  };

  const isSelected = (value: string) => {
    return filters[attribute]?.includes(value) || false;
  };

  return (
    <div className={`facet-list ${className}`}>
      {title && <h3 className="font-bold mb-2">{title}</h3>}
      <ul className="space-y-1">
        {sortedFacets.map(([value, count]) => (
          <li key={value} className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="mr-2"
                checked={isSelected(value)}
                onChange={() => handleSelect(value)}
              />
              <span className="text-sm">{value}</span>
            </label>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
