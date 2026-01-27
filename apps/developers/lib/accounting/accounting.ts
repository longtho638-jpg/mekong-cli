/**
 * Accounting Module for AgencyOS
 * ERPNext Parity: Chart of Accounts, Journal Entries, Ledgers
 *
 * Main facade providing unified access to accounting services
 */

// Re-export types
export type {
  Account,
  AccountType,
  JournalEntry,
  JournalLine,
  TrialBalance,
  ProfitAndLoss,
} from './accounting-types'

// Re-export services
export { LedgerService, getLedgerService } from './ledger-service'
export { JournalService, getJournalService } from './journal-service'
export { ReportsService, getReportsService } from './reports-service'
export { DEFAULT_CHART_OF_ACCOUNTS } from './chart-of-accounts-data'

// ═══════════════════════════════════════════════════════════════════════════
// 🏢 UNIFIED ACCOUNTING SERVICE (Backward Compatibility)
// ═══════════════════════════════════════════════════════════════════════════

import { LedgerService } from './ledger-service'
import { JournalService } from './journal-service'
import { ReportsService } from './reports-service'
import type { Account, JournalEntry, TrialBalance, ProfitAndLoss } from './accounting-types'

/**
 * Unified accounting service combining all sub-services
 * Maintains backward compatibility with existing code
 */
export class AccountingService {
  private ledger: LedgerService
  private journal: JournalService
  private reports: ReportsService

  constructor() {
    this.ledger = new LedgerService()
    this.journal = new JournalService()
    this.reports = new ReportsService()
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CHART OF ACCOUNTS (Delegated to LedgerService)
  // ─────────────────────────────────────────────────────────────────────────

  async getChartOfAccounts(tenantId: string): Promise<Account[]> {
    return this.ledger.getChartOfAccounts(tenantId)
  }

  async createAccount(
    tenantId: string,
    account: Omit<Account, 'id' | 'tenantId' | 'balance' | 'createdAt' | 'updatedAt'>
  ): Promise<Account> {
    return this.ledger.createAccount(tenantId, account)
  }

  async initializeChartOfAccounts(tenantId: string): Promise<void> {
    return this.ledger.initializeChartOfAccounts(tenantId)
  }

  async getAccountBalance(tenantId: string, accountId: string): Promise<number> {
    return this.ledger.getAccountBalance(tenantId, accountId)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // JOURNAL ENTRIES (Delegated to JournalService)
  // ─────────────────────────────────────────────────────────────────────────

  async createJournalEntry(
    tenantId: string,
    entry: {
      date: Date
      reference: string
      description: string
      lines: { accountId: string; debit: number; credit: number; description?: string }[]
    },
    createdBy: string
  ): Promise<JournalEntry> {
    return this.journal.createJournalEntry(tenantId, entry, createdBy)
  }

  async postJournalEntry(tenantId: string, journalId: string): Promise<void> {
    return this.journal.postJournalEntry(tenantId, journalId)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REPORTS (Delegated to ReportsService)
  // ─────────────────────────────────────────────────────────────────────────

  async getTrialBalance(tenantId: string, asOfDate: Date): Promise<TrialBalance> {
    return this.reports.getTrialBalance(tenantId, asOfDate)
  }

  async getProfitAndLoss(
    tenantId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<ProfitAndLoss> {
    return this.reports.getProfitAndLoss(tenantId, fromDate, toDate)
  }
}

// Factory function for lazy initialization
export function getAccountingService() {
  return new AccountingService()
}
