import React, { useState } from 'react';
import { useSearch } from '../hooks/useSearch';
import { SearchBar } from './SearchBar';
import { SearchResults } from './SearchResults';
import { FacetedFilters } from './FacetedFilters';

export const SearchPage: React.FC = () => {
  const {
    query,
    setQuery,
    results,
    loading,
    facets,
    selectedCategory,
    setSelectedCategory,
    search
  } = useSearch();

  const handleSearch = (q: string) => {
    setQuery(q);
    // Trigger search immediately on submit
    // In a real app, useSearch might handle this via effect, but explicit is fine
    setTimeout(search, 0);
  };

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    setTimeout(search, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Search Index Kit
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Full-text search for your documentation and content.
          </p>
        </div>

        <div className="mb-10">
          <SearchBar onSearch={handleSearch} initialQuery={query} />
        </div>

        <div className="flex flex-col md:flex-row max-w-6xl mx-auto">
          <aside className="md:w-1/4">
            <FacetedFilters
              facets={facets}
              selectedCategory={selectedCategory}
              onCategorySelect={handleCategorySelect}
            />
          </aside>

          <main className="md:w-3/4">
            {results && (
              <SearchResults
                results={results.results}
                total={results.total}
                loading={loading}
              />
            )}
            {!results && !loading && (
              <div className="text-center text-gray-500 mt-10">
                Enter a search query to get started.
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
