/**
 * Supabase facade — typed queries, org-scoped CRUD, subscription helpers
 */
export interface SupabaseConfig {
  projectUrl: string;
  anonKey: string;
  serviceRoleKey?: string;
}

export interface QueryResult<T> {
  data: T[];
  count: number;
  error?: string;
}

export interface OrgScopedQuery {
  table: string;
  orgId: string;
  filters?: Record<string, unknown>;
  select?: string;
  limit?: number;
  offset?: number;
}

export class SupabaseFacade {
  constructor(private readonly config: SupabaseConfig) {}

  async query<T>(query: OrgScopedQuery): Promise<QueryResult<T>> {
    throw new Error('Implement with vibe-supabase provider');
  }

  async upsert<T>(table: string, data: Partial<T>, orgId: string): Promise<T> {
    throw new Error('Implement with vibe-supabase provider');
  }

  async subscribe(table: string, callback: (payload: unknown) => void): Promise<{ unsubscribe: () => void }> {
    throw new Error('Implement with vibe-supabase provider');
  }
}
