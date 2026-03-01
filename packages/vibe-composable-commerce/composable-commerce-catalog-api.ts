/**
 * @agencyos/vibe-composable-commerce — Catalog API Client
 *
 * Product catalog CRUD, search, and category management.
 * Provider-agnostic — works with commercetools, Medusa, Saleor, or custom API.
 */

import type {
  CommerceConfig,
  Product,
  Category,
} from './types';

// ─── Catalog Client ─────────────────────────────────────────────

export function createCatalogClient(config: CommerceConfig) {
  const { apiEndpoint, apiKey } = config;
  const baseUrl = apiEndpoint ?? resolveEngineUrl(config.engine);

  async function apiRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Catalog API error: ${(error as Record<string, string>).message ?? response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  return {
    // ─── Products ─────────────────────────────────────────────

    async getProduct(idOrSlug: string): Promise<Product> {
      return apiRequest<Product>('GET', `/products/${idOrSlug}`);
    },

    async listProducts(params?: {
      category?: string;
      search?: string;
      limit?: number;
      offset?: number;
      sort?: string;
    }): Promise<{ items: Product[]; total: number }> {
      const searchParams = new URLSearchParams();
      if (params?.category) searchParams.set('category', params.category);
      if (params?.search) searchParams.set('q', params.search);
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.offset) searchParams.set('offset', String(params.offset));
      if (params?.sort) searchParams.set('sort', params.sort);

      const query = searchParams.toString();
      return apiRequest('GET', `/products${query ? `?${query}` : ''}`);
    },

    async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
      return apiRequest<Product>('POST', '/products', product);
    },

    async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
      return apiRequest<Product>('PATCH', `/products/${id}`, updates);
    },

    async deleteProduct(id: string): Promise<void> {
      await apiRequest('DELETE', `/products/${id}`);
    },

    // ─── Categories ───────────────────────────────────────────

    async listCategories(): Promise<Category[]> {
      return apiRequest<Category[]>('GET', '/categories');
    },

    async getCategory(idOrSlug: string): Promise<Category> {
      return apiRequest<Category>('GET', `/categories/${idOrSlug}`);
    },

    async createCategory(category: Omit<Category, 'id' | 'productCount'>): Promise<Category> {
      return apiRequest<Category>('POST', '/categories', category);
    },

    // ─── Search ───────────────────────────────────────────────

    async searchProducts(query: string, filters?: Record<string, string>): Promise<Product[]> {
      const body = { query, filters };
      return apiRequest<Product[]>('POST', '/products/search', body);
    },
  };
}

// ─── Engine URL Resolution ──────────────────────────────────────

function resolveEngineUrl(engine: string): string {
  const urls: Record<string, string> = {
    'commercetools': 'https://api.commercetools.com',
    'medusa': 'http://localhost:9000/store',
    'saleor': 'http://localhost:8000/graphql',
  };
  return urls[engine] ?? `https://api.${engine}.com/v1`;
}
