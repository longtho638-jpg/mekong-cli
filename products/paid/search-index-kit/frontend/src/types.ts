export interface SearchResult {
  id: number;
  title: string;
  url: string;
  snippet?: string;
  category?: string;
  score: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  page_size: number;
}

export interface FacetItem {
  value: string;
  count: number;
}

export interface FacetResponse {
  categories: FacetItem[];
  tags: FacetItem[];
}
