import React, { useEffect } from 'react';
import { useSearchStore } from './store.js';

interface SearchBarProps {
  indexName: string;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  indexName,
  placeholder = 'Search...',
  className = '',
  debounceMs = 300,
}) => {
  const { query, setQuery, search } = useSearchStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      search(indexName);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs, indexName, search]);

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {query && (
        <button
          onClick={() => {
            setQuery('');
            search(indexName, { query: '' }); // Immediate clear
          }}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      )}
    </div>
  );
};
