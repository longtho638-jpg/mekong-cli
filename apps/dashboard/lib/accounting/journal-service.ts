/**
 * Journal Service - Journal Entry Creation and Posting
 */

import { createClient } from '@supabase/supabase-js'
import type { JournalEntry, JournalLine, JournalEntryRow, JournalLineRow } from './accounting-types'
import { LedgerService } from './ledger-service'

export class JournalService {
  private supabase
  private ledgerService: LedgerService

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )
    this.ledgerService = new LedgerService()
  }

  // ─────────────────────────────────────────────────────────────────────────
  // JOURNAL ENTRY OPERATIONS
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
    // Validate: debits must equal credits
    const totalDebit = entry.lines.reduce((sum, l) => sum + l.debit, 0)
    const totalCredit = entry.lines.reduce((sum, l) => sum + l.credit, 0)

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Journal entry must balance: Debit ${totalDebit} ≠ Credit ${totalCredit}`)
    }

    // Create journal entry
    const { data: journal, error } = await this.supabase
      .from('journal_entries')
      .insert({
        tenant_id: tenantId,
        date: entry.date.toISOString(),
        reference: entry.reference,
        description: entry.description,
        total_debit: totalDebit,
        total_credit: totalCredit,
        status: 'draft',
        created_by: createdBy,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create journal entry: ${error.message}`)

    // Create lines
    const lines = await this.createJournalLines(journal.id, entry.lines)

    return {
      id: journal.id,
      tenantId,
      date: new Date(journal.date),
      reference: journal.reference,
      description: journal.description,
      lines,
      totalDebit,
      totalCredit,
      status: journal.status,
      createdBy: journal.created_by,
      createdAt: new Date(journal.created_at),
    }
  }

  async postJournalEntry(tenantId: string, journalId: string): Promise<void> {
    // Get journal with lines
    const { data: journal } = await this.supabase
      .from('journal_entries')
      .select('*, journal_lines(*)')
      .eq('id', journalId)
      .eq('tenant_id', tenantId)
      .single()

    if (!journal) throw new Error('Journal entry not found')
    if (journal.status !== 'draft') throw new Error('Only draft entries can be posted')

    // Calculate balance adjustments for each account
    const adjustments = new Map<string, number>()
    for (const line of journal.journal_lines || []) {
      const adjustment = line.debit - line.credit
      const current = adjustments.get(line.account_id) || 0
      adjustments.set(line.account_id, current + adjustment)
    }

    // Batch update account balances
    const batchAdjustments = Array.from(adjustments.entries()).map(([accountId, adjustment]) => ({
      accountId,
      adjustment,
    }))

    await this.ledgerService.batchAdjustBalances(batchAdjustments)

    // Mark as posted
    await this.supabase.from('journal_entries').update({ status: 'posted' }).eq('id', journalId)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  private async createJournalLines(
    journalId: string,
    lines: { accountId: string; debit: number; credit: number; description?: string }[]
  ): Promise<JournalLine[]> {
    const createdLines: JournalLine[] = []

    for (const line of lines) {
      const { data: lineData } = await this.supabase
        .from('journal_lines')
        .insert({
          journal_id: journalId,
          account_id: line.accountId,
          debit: line.debit,
          credit: line.credit,
          description: line.description,
        })
        .select('*, accounts(code, name)')
        .single()

      if (lineData) {
        createdLines.push({
          id: lineData.id,
          journalId,
          accountId: lineData.account_id,
          accountCode: lineData.accounts?.code || '',
          accountName: lineData.accounts?.name || '',
          debit: lineData.debit,
          credit: lineData.credit,
          description: lineData.description,
        })
      }
    }

    return createdLines
  }
}

export function getJournalService() {
  return new JournalService()
}
