export interface SearchResult<T = any> {
  hits: T[];
  nbHits: number;
  page: number;
  nbPages: number;
  processingTimeMs: number;
  facets?: Record<string, Record<string, number>>;
}

export interface SearchParams {
  query: string;
  filters?: string;
  facets?: string[];
  page?: number;
  hitsPerPage?: number;
  attributesToRetrieve?: string[];
  attributesToHighlight?: string[];
  sort?: string[];
}

export interface IndexConfig {
  name: string;
  primaryKey?: string;
  searchableAttributes?: string[];
  filterableAttributes?: string[];
  sortableAttributes?: string[];
  rankingRules?: string[];
  typoTolerance?: {
    enabled: boolean;
    minWordSizeFor1Typo?: number;
    minWordSizeFor2Typos?: number;
    disableOnWords?: string[];
    disableOnAttributes?: string[];
  };
}

export interface Synonym {
  objectID: string;
  type: 'synonym' | 'oneWaySynonym' | 'altCorrection1' | 'altCorrection2' | 'placeholder';
  synonyms: string[];
  input?: string; // For oneWaySynonym
  corrections?: string[]; // For altCorrection
  replacements?: string[]; // For placeholder
  placeholder?: string; // For placeholder
}

export interface SearchProvider {
  /**
   * Initialize the provider with configuration
   */
  init(config: any): Promise<void>;

  /**
   * Search for documents
   */
  search<T = any>(indexName: string, params: SearchParams): Promise<SearchResult<T>>;

  /**
   * Add or update documents
   */
  addDocuments(indexName: string, documents: any[]): Promise<any>;

  /**
   * Delete documents
   */
  deleteDocuments(indexName: string, documentIds: string[]): Promise<any>;

  /**
   * Configure index settings
   */
  configureIndex(indexName: string, config: IndexConfig): Promise<any>;

  /**
   * Delete an index
   */
  deleteIndex(indexName: string): Promise<any>;

  /**
   * Save synonyms
   */
  saveSynonyms(indexName: string, synonyms: Synonym[]): Promise<any>;

  /**
   * Get synonyms
   */
  searchSynonyms(indexName: string, query?: string): Promise<Synonym[]>;

  /**
   * Delete synonym
   */
  deleteSynonym(indexName: string, synonymId: string): Promise<any>;

  /**
   * Get provider name
   */
  getProviderName(): string;
}
