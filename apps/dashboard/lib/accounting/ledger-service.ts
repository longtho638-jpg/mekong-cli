/**
 * Ledger Service - Account and Balance Management
 */

import { createClient } from '@supabase/supabase-js'
import type { Account, AccountRow } from './accounting-types'
import { DEFAULT_CHART_OF_ACCOUNTS } from './chart-of-accounts-data'

// Simple cache for account balances (TTL: 5 minutes)
const balanceCache = new Map<string, { balance: number; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000

export class LedgerService {
  private supabase

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CHART OF ACCOUNTS OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────

  async getChartOfAccounts(tenantId: string): Promise<Account[]> {
    const { data, error } = await this.supabase
      .from('accounts')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('code')

    if (error) throw new Error(`Failed to get chart of accounts: ${error.message}`)
    return (data || []).map(this.mapToAccount)
  }

  async createAccount(
    tenantId: string,
    account: Omit<Account, 'id' | 'tenantId' | 'balance' | 'createdAt' | 'updatedAt'>
  ): Promise<Account> {
    const { data, error } = await this.supabase
      .from('accounts')
      .insert({
        tenant_id: tenantId,
        code: account.code,
        name: account.name,
        type: account.type,
        parent_id: account.parentId,
        is_group: account.isGroup,
        currency: account.currency,
        balance: 0,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create account: ${error.message}`)
    return this.mapToAccount(data)
  }

  async initializeChartOfAccounts(tenantId: string): Promise<void> {
    // Check if already initialized
    const existing = await this.getChartOfAccounts(tenantId)
    if (existing.length > 0) return

    // Batch create default accounts
    const accountsToCreate = DEFAULT_CHART_OF_ACCOUNTS.map((acc) => ({
      tenant_id: tenantId,
      code: acc.code,
      name: acc.name,
      type: acc.type,
      parent_id: acc.parentId,
      is_group: acc.isGroup,
      currency: acc.currency,
      balance: 0,
    }))

    const { error } = await this.supabase.from('accounts').insert(accountsToCreate)

    if (error) throw new Error(`Failed to initialize chart of accounts: ${error.message}`)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BALANCE OPERATIONS (WITH CACHING)
  // ─────────────────────────────────────────────────────────────────────────

  async getAccountBalance(tenantId: string, accountId: string): Promise<number> {
    const cacheKey = `${tenantId}:${accountId}`
    const cached = balanceCache.get(cacheKey)

    // Return cached balance if valid
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.balance
    }

    // Fetch from database
    const { data } = await this.supabase
      .from('accounts')
      .select('balance')
      .eq('tenant_id', tenantId)
      .eq('id', accountId)
      .single()

    const balance = data?.balance || 0

    // Update cache
    balanceCache.set(cacheKey, { balance, timestamp: Date.now() })

    return balance
  }

  async adjustAccountBalance(accountId: string, adjustment: number): Promise<void> {
    const { error } = await this.supabase.rpc('adjust_account_balance', {
      p_account_id: accountId,
      p_adjustment: adjustment,
    })

    if (error) throw new Error(`Failed to adjust account balance: ${error.message}`)

    // Invalidate cache
    Array.from(balanceCache.keys()).forEach((key) => {
      if (key.endsWith(`:${accountId}`)) {
        balanceCache.delete(key)
      }
    })
  }

  // Batch balance adjustments for multiple accounts
  async batchAdjustBalances(
    adjustments: Array<{ accountId: string; adjustment: number }>
  ): Promise<void> {
    const promises = adjustments.map(({ accountId, adjustment }) =>
      this.adjustAccountBalance(accountId, adjustment)
    )

    await Promise.all(promises)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  private mapToAccount(data: AccountRow): Account {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      code: data.code,
      name: data.name,
      type: data.type,
      parentId: data.parent_id,
      isGroup: data.is_group,
      currency: data.currency,
      balance: data.balance || 0,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }
  }

  // Clear cache (useful for testing)
  clearCache(): void {
    balanceCache.clear()
  }
}

export function getLedgerService() {
  return new LedgerService()
}
