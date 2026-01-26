import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000/api';

export const useAutocomplete = (query: string, delay: number = 300) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/search/autocomplete?query=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions);
        }
      } catch (err) {
        console.error('Autocomplete error', err);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay]);

  return suggestions;
};
