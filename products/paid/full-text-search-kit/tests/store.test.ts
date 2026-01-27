import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSearchStore } from '../src/ui/store';
import { SearchClient } from '../src/core/search-client';

// Mock SearchClient
vi.mock('../src/core/search-client', () => {
  const SearchClient = vi.fn();
  SearchClient.prototype.init = vi.fn().mockResolvedValue(undefined);
  SearchClient.prototype.search = vi.fn().mockResolvedValue({
    hits: [{ objectID: '1', title: 'Test Hit' }],
    nbHits: 1,
    page: 0,
    nbPages: 1,
    processingTimeMs: 10,
    facets: {}
  });
  return { SearchClient };
});

describe('useSearchStore', () => {
  beforeEach(() => {
    useSearchStore.setState({
      query: '',
      results: null,
      loading: false,
      error: null,
      client: null,
      config: null,
      filters: {},
    });
  });

  it('should initialize with default state', () => {
    const state = useSearchStore.getState();
    expect(state.query).toBe('');
    expect(state.results).toBeNull();
    expect(state.loading).toBe(false);
  });

  it('should set query', () => {
    useSearchStore.getState().setQuery('test query');
    expect(useSearchStore.getState().query).toBe('test query');
  });

  it('should initialize client', async () => {
    await useSearchStore.getState().init({
      type: 'algolia',
      config: { appId: 'test', apiKey: 'test' },
    });

    expect(useSearchStore.getState().client).not.toBeNull();
    expect(useSearchStore.getState().error).toBeNull();
  });

  it('should perform search', async () => {
    await useSearchStore.getState().init({
      type: 'algolia',
      config: { appId: 'test', apiKey: 'test' },
    });

    await useSearchStore.getState().search('test_index');

    expect(useSearchStore.getState().loading).toBe(false);
    expect(useSearchStore.getState().results).not.toBeNull();
    expect(useSearchStore.getState().results?.nbHits).toBe(1);
  });

  it('should toggle filters', () => {
    const store = useSearchStore.getState();

    store.toggleFilter('category', 'books');
    expect(useSearchStore.getState().filters['category']).toContain('books');

    store.toggleFilter('category', 'books');
    expect(useSearchStore.getState().filters['category']).not.toContain('books');
  });
});
