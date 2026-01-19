/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useCallback, useMemo } from 'react'
import { logger } from '@/lib/utils/logger'

/**
 * 📊 Chart of Accounts Hook
 *
 * Inspired by ERPNext Accounting Chart of Accounts
 * Hierarchical account structure for full double-entry bookkeeping
 */

export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense'
export type AccountSubtype =
  | 'cash'
  | 'bank'
  | 'receivable'
  | 'inventory'
  | 'fixed_asset'
  | 'other_asset'
  | 'payable'
  | 'credit_card'
  | 'tax_payable'
  | 'other_liability'
  | 'retained_earnings'
  | 'owner_equity'
  | 'revenue'
  | 'other_income'
  | 'cost_of_goods'
  | 'operating_expense'
  | 'payroll'
  | 'other_expense'

export interface Account {
  id: string
  code: string
  name: string
  type: AccountType
  subtype: AccountSubtype
  parentId?: string
  balance: number
  currency: string
  isActive: boolean
  description?: string
  children?: Account[]
}

export interface JournalEntry {
  id: string
  date: string
  description: string
  lines: JournalLine[]
  status: 'draft' | 'posted' | 'void'
  createdAt: string
}

export interface JournalLine {
  id: string
  accountId: string
  accountName: string
  debit: number
  credit: number
  memo?: string
}

export interface AccountingPeriod {
  startDate: string
  endDate: string
  isClosed: boolean
}

export interface FinancialSummary {
  totalAssets: number
  totalLiabilities: number
  totalEquity: number
  totalIncome: number
  totalExpenses: number
  netIncome: number
  accountsReceivable: number
  accountsPayable: number
  cashBalance: number
}

export function useChartOfAccounts() {
  const [accounts, setAccounts] = useState<Account[]>(getDefaultAccounts())
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(false)

  // Build tree structure
  const accountTree = useMemo(() => {
    const map = new Map<string, Account>()
    const roots: Account[] = []

    accounts.forEach(acc => map.set(acc.id, { ...acc, children: [] }))

    accounts.forEach(acc => {
      if (acc.parentId) {
        const parent = map.get(acc.parentId)
        if (parent) parent.children?.push(map.get(acc.id)!)
      } else {
        roots.push(map.get(acc.id)!)
      }
    })

    return roots
  }, [accounts])

  // Get accounts by type
  const getByType = useCallback(
    (type: AccountType) => accounts.filter(a => a.type === type),
    [accounts]
  )

  // Create journal entry
  const createJournalEntry = useCallback(
    (date: string, description: string, lines: Omit<JournalLine, 'id'>[]): JournalEntry | null => {
      // Validate debits = credits
      const totalDebits = lines.reduce((sum, l) => sum + l.debit, 0)
      const totalCredits = lines.reduce((sum, l) => sum + l.credit, 0)

      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        logger.error('Debits must equal credits')
        return null
      }

      const entry: JournalEntry = {
        id: crypto.randomUUID(),
        date,
        description,
        lines: lines.map(l => ({ ...l, id: crypto.randomUUID() })),
        status: 'draft',
        createdAt: new Date().toISOString(),
      }

      setEntries(prev => [entry, ...prev])
      return entry
    },
    []
  )

  // Post journal entry (affects account balances)
  const postEntry = useCallback(
    (entryId: string) => {
      const entry = entries.find(e => e.id === entryId)
      if (!entry || entry.status !== 'draft') return

      // Update account balances
      setAccounts(prev =>
        prev.map(acc => {
          const line = entry.lines.find(l => l.accountId === acc.id)
          if (!line) return acc

          let balanceChange = 0
          if (['asset', 'expense'].includes(acc.type)) {
            balanceChange = line.debit - line.credit
          } else {
            balanceChange = line.credit - line.debit
          }

          return { ...acc, balance: acc.balance + balanceChange }
        })
      )

      setEntries(prev => prev.map(e => (e.id === entryId ? { ...e, status: 'posted' } : e)))
    },
    [entries]
  )

  // Financial summary
  const summary: FinancialSummary = useMemo(() => {
    const byType = (type: AccountType) =>
      accounts.filter(a => a.type === type).reduce((sum, a) => sum + a.balance, 0)

    const totalAssets = byType('asset')
    const totalLiabilities = byType('liability')
    const totalEquity = byType('equity')
    const totalIncome = byType('income')
    const totalExpenses = byType('expense')

    const cashAccounts = accounts.filter(a => a.subtype === 'cash' || a.subtype === 'bank')
    const receivables = accounts.filter(a => a.subtype === 'receivable')
    const payables = accounts.filter(a => a.subtype === 'payable')

    return {
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      accountsReceivable: receivables.reduce((sum, a) => sum + a.balance, 0),
      accountsPayable: payables.reduce((sum, a) => sum + a.balance, 0),
      cashBalance: cashAccounts.reduce((sum, a) => sum + a.balance, 0),
    }
  }, [accounts])

  // Trial Balance
  const trialBalance = useMemo(() => {
    return accounts.map(acc => ({
      ...acc,
      debit: acc.balance > 0 && ['asset', 'expense'].includes(acc.type) ? acc.balance : 0,
      credit:
        acc.balance > 0 && ['liability', 'equity', 'income'].includes(acc.type) ? acc.balance : 0,
    }))
  }, [accounts])

  return {
    accounts,
    accountTree,
    entries,
    summary,
    trialBalance,
    loading,
    getByType,
    createJournalEntry,
    postEntry,
  }
}

// Default Chart of Accounts for agencies
function getDefaultAccounts(): Account[] {
  return [
    // Assets
    {
      id: '1000',
      code: '1000',
      name: 'Cash',
      type: 'asset',
      subtype: 'cash',
      balance: 45000,
      currency: 'USD',
      isActive: true,
    },
    {
      id: '1010',
      code: '1010',
      name: 'Operating Bank Account',
      type: 'asset',
      subtype: 'bank',
      balance: 125000,
      currency: 'USD',
      isActive: true,
    },
    {
      id: '1100',
      code: '1100',
      name: 'Accounts Receivable',
      type: 'asset',
      subtype: 'receivable',
      balance: 68000,
      currency: 'USD',
      isActive: true,
    },
    {
      id: '1500',
      code: '1500',
      name: 'Equipment',
      type: 'asset',
      subtype: 'fixed_asset',
      balance: 35000,
      currency: 'USD',
      isActive: true,
    },
    // Liabilities
    {
      id: '2000',
      code: '2000',
      name: 'Accounts Payable',
      type: 'liability',
      subtype: 'payable',
      balance: 12500,
      currency: 'USD',
      isActive: true,
    },
    {
      id: '2100',
      code: '2100',
      name: 'Credit Card',
      type: 'liability',
      subtype: 'credit_card',
      balance: 3200,
      currency: 'USD',
      isActive: true,
    },
    {
      id: '2200',
      code: '2200',
      name: 'Sales Tax Payable',
      type: 'liability',
      subtype: 'tax_payable',
      balance: 4800,
      currency: 'USD',
      isActive: true,
    },
    // Equity
    {
      id: '3000',
      code: '3000',
      name: 'Owner Equity',
      type: 'equity',
      subtype: 'owner_equity',
      balance: 200000,
      currency: 'USD',
      isActive: true,
    },
    {
      id: '3100',
      code: '3100',
      name: 'Retained Earnings',
      type: 'equity',
      subtype: 'retained_earnings',
      balance: 52500,
      currency: 'USD',
      isActive: true,
    },
    // Income
    {
      id: '4000',
      code: '4000',
      name: 'Service Revenue',
      type: 'income',
      subtype: 'revenue',
      balance: 285000,
      currency: 'USD',
      isActive: true,
    },
    {
      id: '4100',
      code: '4100',
      name: 'Consulting Income',
      type: 'income',
      subtype: 'revenue',
      balance: 45000,
      currency: 'USD',
      isActive: true,
    },
    // Expenses
    {
      id: '5000',
      code: '5000',
      name: 'Payroll Expense',
      type: 'expense',
      subtype: 'payroll',
      balance: 95000,
      currency: 'USD',
      isActive: true,
    },
    {
      id: '5100',
      code: '5100',
      name: 'Rent Expense',
      type: 'expense',
      subtype: 'operating_expense',
      balance: 24000,
      currency: 'USD',
      isActive: true,
    },
    {
      id: '5200',
      code: '5200',
      name: 'Software & Subscriptions',
      type: 'expense',
      subtype: 'operating_expense',
      balance: 8500,
      currency: 'USD',
      isActive: true,
    },
    {
      id: '5300',
      code: '5300',
      name: 'Marketing Expense',
      type: 'expense',
      subtype: 'operating_expense',
      balance: 15000,
      currency: 'USD',
      isActive: true,
    },
  ]
}

export default useChartOfAccounts
