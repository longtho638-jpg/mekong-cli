import React from 'react';
import { useSearchStore } from './store.js';

interface SearchResultsProps<T> {
  renderItem: (item: T) => React.ReactNode;
  className?: string;
  emptyComponent?: React.ReactNode;
}

export const SearchResults = <T extends any>({
  renderItem,
  className = '',
  emptyComponent,
}: SearchResultsProps<T>) => {
  const { results, loading, error } = useSearchStore();

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  }

  if (!results || results.hits.length === 0) {
    if (emptyComponent) {
      return <>{emptyComponent}</>;
    }
    return <div className="p-4 text-center text-gray-500">No results found.</div>;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-sm text-gray-500 mb-2">
        Found {results.nbHits} results in {results.processingTimeMs}ms
      </div>
      <ul className="divide-y divide-gray-200">
        {results.hits.map((hit: any, index: number) => (
          <li key={hit.objectID || index} className="py-2">
            {renderItem(hit as T)}
          </li>
        ))}
      </ul>
    </div>
  );
};
