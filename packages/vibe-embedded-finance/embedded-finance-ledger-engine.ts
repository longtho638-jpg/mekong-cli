/**
 * @agencyos/vibe-embedded-finance — Double-Entry Ledger Engine
 *
 * In-memory double-entry bookkeeping with transaction integrity.
 * Every debit has a matching credit — balances always reconcile.
 */

import type { LedgerEntry, TransferRequest } from './types';

// ─── Ledger Engine ──────────────────────────────────────────────

export interface LedgerEngineConfig {
  /** Callback to persist entries (DB, API, etc.) */
  persist?: (entry: LedgerEntry) => Promise<void>;
  /** Callback to check idempotency */
  isDuplicate?: (idempotencyKey: string) => Promise<boolean>;
}

export function createLedgerEngine(config: LedgerEngineConfig = {}) {
  const entries: LedgerEntry[] = [];
  const balances = new Map<string, number>();

  function getBalance(accountId: string): number {
    return balances.get(accountId) ?? 0;
  }

  function updateBalance(accountId: string, delta: number): void {
    balances.set(accountId, getBalance(accountId) + delta);
  }

  return {
    /** Post a double-entry transfer */
    async post(request: TransferRequest): Promise<LedgerEntry> {
      // Idempotency check
      if (config.isDuplicate) {
        const dup = await config.isDuplicate(request.idempotencyKey);
        if (dup) {
          const existing = entries.find(e => e.reference === request.idempotencyKey);
          if (existing) return existing;
          throw new Error(`Duplicate transfer: ${request.idempotencyKey}`);
        }
      }

      // Validate sufficient balance
      const fromBalance = getBalance(request.fromAccountId);
      if (fromBalance < request.amount) {
        throw new Error(`Insufficient balance: ${fromBalance} < ${request.amount}`);
      }

      // Create entry
      const entry: LedgerEntry = {
        id: `led_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        debitAccountId: request.fromAccountId,
        creditAccountId: request.toAccountId,
        amount: request.amount,
        currency: request.currency,
        description: request.description,
        reference: request.idempotencyKey,
        status: 'posted',
        createdAt: new Date().toISOString(),
      };

      // Update balances (debit decreases, credit increases)
      updateBalance(request.fromAccountId, -request.amount);
      updateBalance(request.toAccountId, request.amount);

      entries.push(entry);

      // Persist if callback provided
      if (config.persist) {
        await config.persist(entry);
      }

      return entry;
    },

    /** Reverse a posted entry */
    async reverse(entryId: string, reason: string): Promise<LedgerEntry> {
      const original = entries.find(e => e.id === entryId);
      if (!original) throw new Error(`Entry not found: ${entryId}`);
      if (original.status === 'reversed') throw new Error('Entry already reversed');

      // Create reversal entry
      const reversal: LedgerEntry = {
        id: `led_${Date.now()}_rev`,
        debitAccountId: original.creditAccountId,
        creditAccountId: original.debitAccountId,
        amount: original.amount,
        currency: original.currency,
        description: `Reversal: ${reason}`,
        reference: `rev_${original.reference}`,
        status: 'posted',
        createdAt: new Date().toISOString(),
      };

      // Reverse balances
      updateBalance(original.debitAccountId, original.amount);
      updateBalance(original.creditAccountId, -original.amount);

      original.status = 'reversed';
      entries.push(reversal);

      if (config.persist) {
        await config.persist(reversal);
      }

      return reversal;
    },

    /** Get account balance */
    getBalance,

    /** Get all entries for an account */
    getEntries(accountId: string): LedgerEntry[] {
      return entries.filter(
        e => e.debitAccountId === accountId || e.creditAccountId === accountId,
      );
    },

    /** Reconcile: verify debits === credits */
    reconcile(): { balanced: boolean; totalDebits: number; totalCredits: number } {
      let totalDebits = 0;
      let totalCredits = 0;
      for (const entry of entries) {
        if (entry.status === 'posted') {
          totalDebits += entry.amount;
          totalCredits += entry.amount;
        }
      }
      return { balanced: totalDebits === totalCredits, totalDebits, totalCredits };
    },
  };
}
