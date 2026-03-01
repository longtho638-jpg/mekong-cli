/**
 * @agencyos/vibe-embedded-finance — Account Manager
 *
 * Virtual account CRUD, balance queries, and transfer operations.
 * Supports Unit, Stripe Treasury, Column providers.
 */

import type {
  EmbeddedFinanceConfig,
  VirtualAccount,
  AccountBalance,
  CreateAccountRequest,
  TransferRequest,
  LedgerEntry,
} from './types';

// ─── Account Manager ────────────────────────────────────────────

export function createAccountManager(config: EmbeddedFinanceConfig) {
  const { apiKey, baseUrl, provider } = config;

  const apiBase = baseUrl ?? resolveProviderUrl(provider, config.environment);

  async function apiRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${apiBase}${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Embedded Finance API error: ${(error as Record<string, string>).message ?? response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  return {
    /** Create a new virtual account */
    async createAccount(request: CreateAccountRequest): Promise<VirtualAccount> {
      return apiRequest<VirtualAccount>('POST', '/accounts', request);
    },

    /** Get account details */
    async getAccount(accountId: string): Promise<VirtualAccount> {
      return apiRequest<VirtualAccount>('GET', `/accounts/${accountId}`);
    },

    /** Get account balance */
    async getBalance(accountId: string): Promise<AccountBalance> {
      return apiRequest<AccountBalance>('GET', `/accounts/${accountId}/balance`);
    },

    /** List accounts for a customer */
    async listAccounts(customerId: string): Promise<VirtualAccount[]> {
      return apiRequest<VirtualAccount[]>('GET', `/customers/${customerId}/accounts`);
    },

    /** Freeze an account */
    async freezeAccount(accountId: string, reason: string): Promise<VirtualAccount> {
      return apiRequest<VirtualAccount>('POST', `/accounts/${accountId}/freeze`, { reason });
    },

    /** Close an account */
    async closeAccount(accountId: string): Promise<VirtualAccount> {
      return apiRequest<VirtualAccount>('POST', `/accounts/${accountId}/close`, {});
    },

    /** Transfer funds between accounts */
    async transfer(request: TransferRequest): Promise<LedgerEntry> {
      return apiRequest<LedgerEntry>('POST', '/transfers', request);
    },

    /** List transfers for an account */
    async listTransfers(accountId: string, limit = 20): Promise<LedgerEntry[]> {
      return apiRequest<LedgerEntry[]>('GET', `/accounts/${accountId}/transfers?limit=${limit}`);
    },
  };
}

// ─── Provider URL Resolution ────────────────────────────────────

function resolveProviderUrl(provider: string, environment: string): string {
  const urls: Record<string, Record<string, string>> = {
    'unit': {
      sandbox: 'https://api.s.unit.sh',
      production: 'https://api.unit.co',
    },
    'stripe-treasury': {
      sandbox: 'https://api.stripe.com/v1/treasury',
      production: 'https://api.stripe.com/v1/treasury',
    },
    'column': {
      sandbox: 'https://api.column.com/v1',
      production: 'https://api.column.com/v1',
    },
  };

  return urls[provider]?.[environment] ?? `https://api.${provider}.com/v1`;
}
