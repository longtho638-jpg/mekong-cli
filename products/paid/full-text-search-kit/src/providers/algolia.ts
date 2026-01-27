import { SearchProvider, SearchParams, SearchResult, IndexConfig, Synonym } from '../core/types.js';
import algoliasearch from 'algoliasearch';
// @ts-ignore
const algoliaClient = algoliasearch.default || algoliasearch;
import { SearchClient, SearchIndex } from 'algoliasearch';

export interface AlgoliaConfig {
  appId: string;
  apiKey: string;
}

export class AlgoliaProvider implements SearchProvider {
  private client: SearchClient | null = null;

  async init(config: AlgoliaConfig): Promise<void> {
    this.client = algoliaClient(config.appId, config.apiKey);
  }

  private getIndex(indexName: string): SearchIndex {
    if (!this.client) {
      throw new Error('Algolia client not initialized');
    }
    return this.client.initIndex(indexName);
  }

  async search<T = any>(indexName: string, params: SearchParams): Promise<SearchResult<T>> {
    const index = this.getIndex(indexName);

    const algoliaParams: any = {
      page: params.page || 0,
      hitsPerPage: params.hitsPerPage || 20,
      attributesToRetrieve: params.attributesToRetrieve,
      attributesToHighlight: params.attributesToHighlight,
    };

    if (params.filters) {
      algoliaParams.filters = params.filters;
    }

    if (params.facets) {
      algoliaParams.facets = params.facets;
    }

    const response = await index.search<T>(params.query, algoliaParams);

    return {
      hits: response.hits,
      nbHits: response.nbHits,
      page: response.page,
      nbPages: response.nbPages,
      processingTimeMs: response.processingTimeMS,
      facets: response.facets,
    };
  }

  async addDocuments(indexName: string, documents: any[]): Promise<any> {
    const index = this.getIndex(indexName);
    return index.saveObjects(documents, { autoGenerateObjectIDIfNotExist: true });
  }

  async deleteDocuments(indexName: string, documentIds: string[]): Promise<any> {
    const index = this.getIndex(indexName);
    return index.deleteObjects(documentIds);
  }

  async configureIndex(indexName: string, config: IndexConfig): Promise<any> {
    const index = this.getIndex(indexName);
    const settings: any = {};

    if (config.searchableAttributes) {
      settings.searchableAttributes = config.searchableAttributes;
    }

    if (config.filterableAttributes) {
      settings.attributesForFaceting = config.filterableAttributes;
    }

    if (config.rankingRules) {
      settings.ranking = config.rankingRules;
    }

    if (config.typoTolerance) {
      settings.typoTolerance = config.typoTolerance.enabled;
      if (config.typoTolerance.minWordSizeFor1Typo) {
        settings.minWordSizefor1Typo = config.typoTolerance.minWordSizeFor1Typo;
      }
      if (config.typoTolerance.minWordSizeFor2Typos) {
        settings.minWordSizefor2Typos = config.typoTolerance.minWordSizeFor2Typos;
      }
      if (config.typoTolerance.disableOnWords) {
        settings.disableTypoToleranceOnWords = config.typoTolerance.disableOnWords;
      }
      if (config.typoTolerance.disableOnAttributes) {
        settings.disableTypoToleranceOnAttributes = config.typoTolerance.disableOnAttributes;
      }
    }

    // Sortable attributes usually require replicas in Algolia Standard,
    // but can be configured in settings for Virtual Replicas or just general settings.
    // We'll map it to standard settings where possible.

    return index.setSettings(settings);
  }

  async deleteIndex(indexName: string): Promise<any> {
    // Note: deleteIndex is on the client, not the index object usually,
    // but the JS SDK exposes it on the index object too or we can just use delete.
    const index = this.getIndex(indexName);
    return index.delete();
  }

  async saveSynonyms(indexName: string, synonyms: Synonym[]): Promise<any> {
    const index = this.getIndex(indexName);
    // Algolia expects specific format, types match reasonably well
    return index.saveSynonyms(synonyms, { replaceExistingSynonyms: false });
  }

  async searchSynonyms(indexName: string, query: string = ''): Promise<Synonym[]> {
    const index = this.getIndex(indexName);
    const result = await index.searchSynonyms(query);
    // Cast to our interface (compatible)
    return result.hits as unknown as Synonym[];
  }

  async deleteSynonym(indexName: string, synonymId: string): Promise<any> {
    const index = this.getIndex(indexName);
    return index.deleteSynonym(synonymId);
  }

  getProviderName(): string {
    return 'algolia';
  }
}
