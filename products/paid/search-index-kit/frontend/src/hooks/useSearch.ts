import { useState, useEffect, useCallback } from 'react';
import { SearchResponse, FacetResponse } from '../types';

const API_BASE = 'http://localhost:8000/api';

interface UseSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  results: SearchResponse | null;
  loading: boolean;
  error: string | null;
  facets: FacetResponse | null;
  selectedCategory: string | null;
  setSelectedCategory: (c: string | null) => void;
  page: number;
  setPage: (p: number) => void;
  search: () => void;
}

export const useSearch = (): UseSearchReturn => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facets, setFacets] = useState<FacetResponse | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchFacets = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/search/facets`);
      if (res.ok) {
        const data = await res.json();
        setFacets(data);
      }
    } catch (err) {
      console.error('Error fetching facets', err);
    }
  }, []);

  useEffect(() => {
    fetchFacets();
  }, [fetchFacets]);

  const search = useCallback(async () => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        query,
        page: page.toString(),
        page_size: '10'
      });

      if (selectedCategory) {
        params.append('category', selectedCategory);
      }

      const res = await fetch(`${API_BASE}/search?${params.toString()}`, {
        method: 'POST'
      });

      if (!res.ok) {
        throw new Error('Search failed');
      }

      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [query, page, selectedCategory]);

  // Debounce search if needed, or trigger manually
  // For this kit, we expose the search function to be called by the UI

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    facets,
    selectedCategory,
    setSelectedCategory,
    page,
    setPage,
    search
  };
};
