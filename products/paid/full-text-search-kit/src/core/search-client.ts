import { SearchProvider, SearchParams, SearchResult, IndexConfig, Synonym } from './types.js';
import { AlgoliaProvider, AlgoliaConfig } from '../providers/algolia.js';
import { MeilisearchProvider, MeilisearchConfig } from '../providers/meilisearch.js';

export type SearchProviderConfig =
  | { type: 'algolia'; config: AlgoliaConfig }
  | { type: 'meilisearch'; config: MeilisearchConfig };

export class SearchClient implements SearchProvider {
  private provider: SearchProvider;
  private config: SearchProviderConfig;

  constructor(config: SearchProviderConfig) {
    this.config = config;
    if (config.type === 'algolia') {
      this.provider = new AlgoliaProvider();
    } else if (config.type === 'meilisearch') {
      this.provider = new MeilisearchProvider();
    } else {
      throw new Error('Invalid provider type');
    }
  }

  async init(config?: any): Promise<void> {
    // Initialize with the config passed to constructor
    await this.provider.init(this.config.config);
  }

  async search<T = any>(indexName: string, params: SearchParams): Promise<SearchResult<T>> {
    return this.provider.search<T>(indexName, params);
  }

  async addDocuments(indexName: string, documents: any[]): Promise<any> {
    return this.provider.addDocuments(indexName, documents);
  }

  async deleteDocuments(indexName: string, documentIds: string[]): Promise<any> {
    return this.provider.deleteDocuments(indexName, documentIds);
  }

  async configureIndex(indexName: string, config: IndexConfig): Promise<any> {
    return this.provider.configureIndex(indexName, config);
  }

  async deleteIndex(indexName: string): Promise<any> {
    return this.provider.deleteIndex(indexName);
  }

  async saveSynonyms(indexName: string, synonyms: Synonym[]): Promise<any> {
    return this.provider.saveSynonyms(indexName, synonyms);
  }

  async searchSynonyms(indexName: string, query?: string): Promise<Synonym[]> {
    return this.provider.searchSynonyms(indexName, query);
  }

  async deleteSynonym(indexName: string, synonymId: string): Promise<any> {
    return this.provider.deleteSynonym(indexName, synonymId);
  }

  getProviderName(): string {
    return this.provider.getProviderName();
  }
}
