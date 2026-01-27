import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MeilisearchProvider } from '../src/providers/meilisearch';

// Mock Meilisearch
vi.mock('meilisearch', () => {
  const indexMock = {
    search: vi.fn().mockResolvedValue({
      hits: [],
      estimatedTotalHits: 0,
      processingTimeMs: 1,
    }),
    addDocuments: vi.fn().mockResolvedValue({ taskUid: 1 }),
    updateSettings: vi.fn().mockResolvedValue({ taskUid: 2 }),
    deleteIndex: vi.fn().mockResolvedValue({ taskUid: 3 }),
    getSynonyms: vi.fn().mockResolvedValue({}),
    updateSynonyms: vi.fn().mockResolvedValue({ taskUid: 4 }),
    resetSynonyms: vi.fn().mockResolvedValue({ taskUid: 5 }),
  };

  const clientMock = {
    index: vi.fn().mockReturnValue(indexMock),
    deleteIndex: vi.fn().mockResolvedValue({ taskUid: 3 }),
  };

  return {
    Meilisearch: class {
      constructor() {
        return clientMock;
      }
    },
  };
});

describe('MeilisearchProvider', () => {
  let provider: MeilisearchProvider;

  beforeEach(() => {
    provider = new MeilisearchProvider();
  });

  it('should initialize successfully', async () => {
    await expect(
      provider.init({ host: 'http://localhost:7700', apiKey: 'test' })
    ).resolves.not.toThrow();
  });

  it('should search', async () => {
    await provider.init({ host: 'http://localhost:7700', apiKey: 'test' });
    const result = await provider.search('index', { query: 'test' });
    expect(result).toHaveProperty('hits');
    expect(result).toHaveProperty('nbHits');
  });
});
