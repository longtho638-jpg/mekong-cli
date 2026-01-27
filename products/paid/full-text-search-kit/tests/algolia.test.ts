import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AlgoliaProvider } from '../src/providers/algolia';

// Mock algoliasearch
vi.mock('algoliasearch', () => {
  const initIndexMock = {
    search: vi.fn().mockResolvedValue({
      hits: [],
      nbHits: 0,
      page: 0,
      nbPages: 0,
      processingTimeMS: 1,
    }),
    saveObjects: vi.fn().mockResolvedValue({ objectIDs: ['1'] }),
    setSettings: vi.fn().mockResolvedValue({ updatedAt: 'now' }),
    delete: vi.fn().mockResolvedValue({ updatedAt: 'now' }),
  };

  return {
    default: vi.fn().mockReturnValue({
      initIndex: vi.fn().mockReturnValue(initIndexMock),
    }),
    SearchClient: vi.fn(),
    SearchIndex: vi.fn(),
  };
});

describe('AlgoliaProvider', () => {
  let provider: AlgoliaProvider;

  beforeEach(() => {
    provider = new AlgoliaProvider();
  });

  it('should initialize successfully', async () => {
    await expect(
      provider.init({ appId: 'test', apiKey: 'test' })
    ).resolves.not.toThrow();
  });

  it('should search', async () => {
    await provider.init({ appId: 'test', apiKey: 'test' });
    const result = await provider.search('index', { query: 'test' });
    expect(result).toHaveProperty('hits');
    expect(result).toHaveProperty('nbHits');
  });
});
