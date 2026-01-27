import React, { useState, useEffect, useRef } from 'react';
import { useSearchStore } from './store.js';

interface AutocompleteProps {
  indexName: string;
  placeholder?: string;
  className?: string;
  onSelect?: (query: string) => void;
}

export const Autocomplete: React.FC<AutocompleteProps> = ({
  indexName,
  placeholder = 'Search...',
  className = '',
  onSelect,
}) => {
  const { query, setQuery, search } = useSearchStore();
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('fts_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save query to recent searches on submit/select
  const saveRecentSearch = (q: string) => {
    if (!q.trim()) return;
    const updated = [q, ...recentSearches.filter((s) => s !== q)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('fts_recent_searches', JSON.stringify(updated));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    // Instant search as you type
    search(indexName, { query: val });
  };

  const handleSelect = (val: string) => {
    setQuery(val);
    setIsOpen(false);
    saveRecentSearch(val);
    search(indexName, { query: val });
    if (onSelect) onSelect(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpen(false);
    saveRecentSearch(query);
    search(indexName, { query });
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
          {recentSearches.length > 0 && !query && (
            <div className="py-2">
              <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase">
                Recent Searches
              </div>
              <ul>
                {recentSearches.map((s) => (
                  <li
                    key={s}
                    onClick={() => handleSelect(s)}
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center"
                  >
                    <span className="mr-2 text-gray-400">🕒</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Query Suggestions would go here.
              Since we rely on the main search results for now,
              we could potentially show top hits as suggestions.
          */}
        </div>
      )}
    </div>
  );
};
