/**
 * Accounting Types for AgencyOS
 * ERPNext Parity: Chart of Accounts, Journal Entries, Ledgers
 */

export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense'

export interface Account {
  id: string
  tenantId: string
  code: string
  name: string
  type: AccountType
  parentId: string | null
  isGroup: boolean
  currency: string
  balance: number
  createdAt: Date
  updatedAt: Date
}

export interface JournalEntry {
  id: string
  tenantId: string
  date: Date
  reference: string
  description: string
  lines: JournalLine[]
  totalDebit: number
  totalCredit: number
  status: 'draft' | 'posted' | 'cancelled'
  createdBy: string
  createdAt: Date
}

export interface JournalLine {
  id: string
  journalId: string
  accountId: string
  accountCode: string
  accountName: string
  debit: number
  credit: number
  description?: string
}

export interface TrialBalance {
  accounts: {
    id: string
    code: string
    name: string
    type: AccountType
    debit: number
    credit: number
  }[]
  totalDebit: number
  totalCredit: number
  asOfDate: Date
}

export interface ProfitAndLoss {
  income: Array<{ id: string; code: string; name: string; balance: number }>
  expenses: Array<{ id: string; code: string; name: string; balance: number }>
  totalIncome: number
  totalExpenses: number
  netProfit: number
  fromDate: Date
  toDate: Date
}

// Database mapping types
export interface AccountRow {
  id: string
  tenant_id: string
  code: string
  name: string
  type: AccountType
  parent_id: string | null
  is_group: boolean
  currency: string
  balance?: number
  created_at: string
  updated_at: string
}

export interface JournalEntryRow {
  id: string
  tenant_id: string
  date: string
  reference: string
  description: string
  total_debit: number
  total_credit: number
  status: 'draft' | 'posted' | 'cancelled'
  created_by: string
  created_at: string
  journal_lines?: JournalLineRow[]
}

export interface JournalLineRow {
  id: string
  journal_id: string
  account_id: string
  debit: number
  credit: number
  description?: string
  accounts?: { code: string; name: string }
}
