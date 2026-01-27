import { SearchProvider, SearchParams, SearchResult, IndexConfig, Synonym } from '../core/types.js';
import { Meilisearch, Index } from 'meilisearch';

export interface MeilisearchConfig {
  host: string;
  apiKey: string;
}

export class MeilisearchProvider implements SearchProvider {
  private client: Meilisearch | null = null;

  async init(config: MeilisearchConfig): Promise<void> {
    this.client = new Meilisearch({
      host: config.host,
      apiKey: config.apiKey,
    });
  }

  private getClient(): Meilisearch {
    if (!this.client) {
      throw new Error('Meilisearch client not initialized');
    }
    return this.client;
  }

  async search<T = any>(indexName: string, params: SearchParams): Promise<SearchResult<T>> {
    const index = this.getClient().index(indexName);

    const meiliParams: any = {
      offset: (params.page || 0) * (params.hitsPerPage || 20),
      limit: params.hitsPerPage || 20,
      attributesToRetrieve: params.attributesToRetrieve,
      attributesToHighlight: params.attributesToHighlight,
      sort: params.sort,
    };

    if (params.filters) {
      meiliParams.filter = params.filters;
    }

    if (params.facets) {
      meiliParams.facets = params.facets;
    }

    const response = await index.search(params.query, meiliParams);

    // Calculate pages since Meilisearch returns offset/limit
    const nbPages = Math.ceil((response.estimatedTotalHits || 0) / (params.hitsPerPage || 20));

    return {
      hits: response.hits as T[],
      nbHits: response.estimatedTotalHits || 0,
      page: params.page || 0,
      nbPages: nbPages,
      processingTimeMs: response.processingTimeMs,
      facets: response.facetDistribution,
    };
  }

  async addDocuments(indexName: string, documents: any[]): Promise<any> {
    const index = this.getClient().index(indexName);
    return index.addDocuments(documents);
  }

  async deleteDocuments(indexName: string, documentIds: string[]): Promise<any> {
    const index = this.getClient().index(indexName);
    return index.deleteDocuments(documentIds);
  }

  async configureIndex(indexName: string, config: IndexConfig): Promise<any> {
    const index = this.getClient().index(indexName);

    const settings: any = {};

    if (config.searchableAttributes) {
      settings.searchableAttributes = config.searchableAttributes;
    }

    if (config.filterableAttributes) {
      settings.filterableAttributes = config.filterableAttributes;
    }

    if (config.sortableAttributes) {
      settings.sortableAttributes = config.sortableAttributes;
    }

    if (config.rankingRules) {
      settings.rankingRules = config.rankingRules;
    }

    if (config.typoTolerance) {
      settings.typoTolerance = {
        enabled: config.typoTolerance.enabled,
        minWordSizeForTypos: {
            oneTypo: config.typoTolerance.minWordSizeFor1Typo,
            twoTypos: config.typoTolerance.minWordSizeFor2Typos,
        },
        disableOnWords: config.typoTolerance.disableOnWords,
        disableOnAttributes: config.typoTolerance.disableOnAttributes
      };
    }

    return index.updateSettings(settings);
  }

  async deleteIndex(indexName: string): Promise<any> {
    return this.getClient().deleteIndex(indexName);
  }

  async saveSynonyms(indexName: string, synonyms: Synonym[]): Promise<any> {
    const index = this.getClient().index(indexName);
    // Meilisearch synonym format is a map: { word: [synonyms], ... }
    // Our Synonym interface is array of objects. We need to convert.
    // NOTE: Meilisearch only supports basic synonyms (multi-way).
    // It doesn't support placeholders or one-way in the same way Algolia does via the settings API easily
    // Actually Meilisearch `updateSynonyms` takes a dictionary object.

    const synonymsMap: Record<string, string[]> = {};
    synonyms.forEach(syn => {
       // We only support simple synonyms for Meilisearch in this abstraction
       if (syn.type === 'synonym') {
           // For each word in synonyms list, map it to the others
           // Meilisearch format: { "wolverine": ["x-men", "logan"], "logan": ["wolverine", "x-men"] }
           // Actually Meilisearch api is: index.updateSynonyms({ wolverine: ['logan', 'x-men'], logan: ['wolverine'] })
           // This implies one-way unless reciprocal is added.

           // If it's a "synonym" type in our interface, we assume 2-way for all
           syn.synonyms.forEach(word => {
               const others = syn.synonyms.filter(w => w !== word);
               if (!synonymsMap[word]) {
                   synonymsMap[word] = [];
               }
               synonymsMap[word] = [...new Set([...synonymsMap[word], ...others])];
           });
       }
    });

    return index.updateSynonyms(synonymsMap);
  }

  async searchSynonyms(indexName: string, query?: string): Promise<Synonym[]> {
    const index = this.getClient().index(indexName);
    const synonymsMap = await index.getSynonyms();

    // Convert back to our Synonym format
    // This is lossy because Meilisearch doesn't store IDs or Types like Algolia
    // We'll create synthetic Synonym objects

    const synonyms: Synonym[] = [];
    Object.entries(synonymsMap).forEach(([word, syns], idx) => {
        // Simple heuristic: if query is present, filter
        if (query && !word.includes(query) && !syns.some(s => s.includes(query))) {
            return;
        }

        synonyms.push({
            objectID: `synonym_${idx}`,
            type: 'synonym', // Assuming standard
            synonyms: [word, ...syns]
        });
    });

    return synonyms;
  }

  async deleteSynonym(indexName: string, synonymId: string): Promise<any> {
    // Meilisearch doesn't support deleting by ID. You have to reset synonyms or update them.
    // This abstraction is leaky here.
    // We would need to fetch all, remove the one matching, and update.
    // For now, let's implement resetAllSynonyms if ID is specific keyword, or throw not supported
    if (synonymId === '__ALL__') {
        return this.getClient().index(indexName).resetSynonyms();
    }
    throw new Error('Meilisearch does not support deleting individual synonyms by ID. Use resetAllSynonyms or updateSynonyms.');
  }

  getProviderName(): string {
    return 'meilisearch';
  }
}
