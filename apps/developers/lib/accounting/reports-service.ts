/**
 * Reports Service - Financial Reporting (Trial Balance, P&L)
 */

import { createClient } from '@supabase/supabase-js'
import type { AccountType, TrialBalance, ProfitAndLoss } from './accounting-types'

// Simple cache for reports (TTL: 10 minutes)
const reportsCache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 10 * 60 * 1000

export class ReportsService {
  private supabase

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_KEY || ''
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TRIAL BALANCE REPORT
  // ─────────────────────────────────────────────────────────────────────────

  async getTrialBalance(tenantId: string, asOfDate: Date): Promise<TrialBalance> {
    const cacheKey = `trial-balance:${tenantId}:${asOfDate.toISOString()}`
    const cached = reportsCache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as TrialBalance
    }

    const { data: accounts } = await this.supabase
      .from('accounts')
      .select('id, code, name, type, balance')
      .eq('tenant_id', tenantId)
      .eq('is_group', false)
      .order('code')

    const balances = (accounts || []).map((acc) => {
      const isDebitNormal = ['asset', 'expense'].includes(acc.type)
      return {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type as AccountType,
        debit:
          isDebitNormal && acc.balance > 0
            ? acc.balance
            : !isDebitNormal && acc.balance < 0
              ? -acc.balance
              : 0,
        credit:
          !isDebitNormal && acc.balance > 0
            ? acc.balance
            : isDebitNormal && acc.balance < 0
              ? -acc.balance
              : 0,
      }
    })

    const result = {
      accounts: balances,
      totalDebit: balances.reduce((sum, a) => sum + a.debit, 0),
      totalCredit: balances.reduce((sum, a) => sum + a.credit, 0),
      asOfDate,
    }

    reportsCache.set(cacheKey, { data: result, timestamp: Date.now() })

    return result
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PROFIT & LOSS REPORT
  // ─────────────────────────────────────────────────────────────────────────

  async getProfitAndLoss(tenantId: string, fromDate: Date, toDate: Date): Promise<ProfitAndLoss> {
    const cacheKey = `p-l:${tenantId}:${fromDate.toISOString()}:${toDate.toISOString()}`
    const cached = reportsCache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as ProfitAndLoss
    }

    // Get income accounts
    const { data: income } = await this.supabase
      .from('accounts')
      .select('id, code, name, balance')
      .eq('tenant_id', tenantId)
      .eq('type', 'income')
      .eq('is_group', false)

    // Get expense accounts
    const { data: expenses } = await this.supabase
      .from('accounts')
      .select('id, code, name, balance')
      .eq('tenant_id', tenantId)
      .eq('type', 'expense')
      .eq('is_group', false)

    const totalIncome = (income || []).reduce((sum, acc) => sum + Math.abs(acc.balance), 0)
    const totalExpenses = (expenses || []).reduce((sum, acc) => sum + Math.abs(acc.balance), 0)

    const result = {
      income: income || [],
      expenses: expenses || [],
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      fromDate,
      toDate,
    }

    reportsCache.set(cacheKey, { data: result, timestamp: Date.now() })

    return result
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CACHE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────

  clearCache(tenantId?: string): void {
    if (tenantId) {
      Array.from(reportsCache.keys()).forEach((key) => {
        if (key.includes(tenantId)) {
          reportsCache.delete(key)
        }
      })
    } else {
      reportsCache.clear()
    }
  }
}

export function getReportsService() {
  return new ReportsService()
}
