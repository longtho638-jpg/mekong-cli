/**
 * @agencyos/vibe-embedded-finance — Embedded Finance SDK
 *
 * Banking-as-a-Service integration: virtual accounts, double-entry ledger,
 * KYC verification, card issuing, and lending pipeline.
 *
 * Usage:
 *   import { createAccountManager, createLedgerEngine, createKYCManager } from '@agencyos/vibe-embedded-finance';
 *
 *   const accounts = createAccountManager({ provider: 'unit', apiKey: '...', environment: 'sandbox' });
 *   const ledger = createLedgerEngine({ persist: async (entry) => db.insert(entry) });
 *   const kyc = createKYCManager({ provider: 'alloy', apiKey: '...' });
 */

// Account management
export { createAccountManager } from './embedded-finance-account-manager';

// Double-entry ledger
export { createLedgerEngine } from './embedded-finance-ledger-engine';
export type { LedgerEngineConfig } from './embedded-finance-ledger-engine';

// KYC/KYB verification
export { createKYCManager } from './embedded-finance-kyc-verification';
export type { KYCProviderConfig } from './embedded-finance-kyc-verification';

// All types
export type {
  EmbeddedFinanceConfig,
  VirtualAccount,
  AccountBalance,
  CreateAccountRequest,
  LedgerEntry,
  TransferRequest,
  KYCVerification,
  KYCCheck,
  KYCSubmission,
  LoanApplication,
  IssuedCard,
  EmbeddedFinanceEventType,
  EmbeddedFinanceWebhookEvent,
} from './types';
