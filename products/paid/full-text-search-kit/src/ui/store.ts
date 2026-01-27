import { create } from 'zustand';
import { SearchClient, SearchProviderConfig } from '../core/search-client.js';
import { SearchParams, SearchResult } from '../core/types.js';

interface SearchState {
  query: string;
  results: SearchResult | null;
  loading: boolean;
  error: string | null;
  client: SearchClient | null;
  config: SearchProviderConfig | null;

  // Actions
  init: (config: SearchProviderConfig) => Promise<void>;
  setQuery: (query: string) => void;
  search: (indexName: string, params?: Partial<SearchParams>) => Promise<void>;
  filters: Record<string, string[]>;
  toggleFilter: (attribute: string, value: string) => void;
  clearFilters: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  results: null,
  loading: false,
  error: null,
  client: null,
  config: null,
  filters: {},

  init: async (config: SearchProviderConfig) => {
    try {
      const client = new SearchClient(config);
      await client.init();
      set({ client, config, error: null });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  setQuery: (query: string) => set({ query }),

  toggleFilter: (attribute: string, value: string) => {
    const { filters, search, config } = get();
    const currentFilters = filters[attribute] || [];
    const newFilters = currentFilters.includes(value)
      ? currentFilters.filter((v) => v !== value)
      : [...currentFilters, value];

    const updatedFilters = {
      ...filters,
      [attribute]: newFilters,
    };

    set({ filters: updatedFilters });

    // Trigger search with new filters
    // We need to construct the filter string based on provider
    // This logic might need to be moved to the client or a utility
    // For now, let's just trigger a search and handle construction inside search or here
    // But search() takes params.
    // We should probably invoke search(lastIndexName) but we don't track indexName in store.
    // Let's assume the component calls search separately or we update search to use store state.
  },

  clearFilters: () => set({ filters: {} }),

  search: async (indexName: string, params: Partial<SearchParams> = {}) => {
    const { client, query, filters, config } = get();
    if (!client) {
      set({ error: 'Search client not initialized' });
      return;
    }

    set({ loading: true, error: null });

    try {
      // Construct filter string
      let filterString = params.filters || '';

      // Simple filter construction (AND between attributes, OR within attribute)
      // This works for Algolia. Meilisearch syntax is slightly different but mostly compatible for basic cases.
      // Algolia: (category:Book OR category:Movie) AND author:John
      // Meilisearch: (category = Book OR category = Movie) AND author = John

      const generatedFilters: string[] = [];
      Object.entries(filters).forEach(([attr, values]) => {
        if (values.length > 0) {
          if (config?.type === 'meilisearch') {
             const attrFilters = values.map(v => `${attr} = "${v}"`).join(' OR ');
             generatedFilters.push(`(${attrFilters})`);
          } else {
             const attrFilters = values.map(v => `${attr}:"${v}"`).join(' OR ');
             generatedFilters.push(`(${attrFilters})`);
          }
        }
      });

      if (generatedFilters.length > 0) {
        const genFilterStr = generatedFilters.join(' AND ');
        filterString = filterString ? `${filterString} AND ${genFilterStr}` : genFilterStr;
      }

      const searchParams: SearchParams = {
        query,
        ...params,
        filters: filterString,
      };

      const results = await client.search(indexName, searchParams);
      set({ results, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
}));
