/**
 * @agencyos/vibe-embedded-finance — Type Definitions
 *
 * All types for embedded finance: accounts, ledger, KYC, lending.
 */

// ─── Configuration ──────────────────────────────────────────────

export interface EmbeddedFinanceConfig {
  provider: 'unit' | 'stripe-treasury' | 'column' | 'custom';
  environment: 'sandbox' | 'production';
  apiKey: string;
  webhookSecret?: string;
  baseUrl?: string;
}

// ─── Virtual Accounts ───────────────────────────────────────────

export interface VirtualAccount {
  id: string;
  type: 'checking' | 'savings' | 'escrow';
  balance: AccountBalance;
  status: 'active' | 'frozen' | 'closed';
  routingNumber: string;
  accountNumber: string;
  customerId: string;
  metadata: Record<string, string>;
  createdAt: string;
}

export interface AccountBalance {
  available: number;
  pending: number;
  held: number;
  currency: string;
}

export interface CreateAccountRequest {
  customerId: string;
  type: 'checking' | 'savings' | 'escrow';
  initialDeposit?: number;
  metadata?: Record<string, string>;
}

// ─── Ledger ─────────────────────────────────────────────────────

export interface LedgerEntry {
  id: string;
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
  currency: string;
  description: string;
  reference: string;
  status: 'pending' | 'posted' | 'reversed';
  createdAt: string;
}

export interface TransferRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  description: string;
  idempotencyKey: string;
  metadata?: Record<string, string>;
}

// ─── KYC/KYB ────────────────────────────────────────────────────

export interface KYCVerification {
  id: string;
  customerId: string;
  type: 'individual' | 'business';
  status: 'pending' | 'approved' | 'rejected' | 'review';
  checks: KYCCheck[];
  submittedAt: string;
  decidedAt?: string;
}

export interface KYCCheck {
  type: 'identity' | 'address' | 'sanctions' | 'pep' | 'document';
  status: 'pass' | 'fail' | 'pending';
  details?: string;
}

export interface KYCSubmission {
  customerId: string;
  type: 'individual' | 'business';
  firstName?: string;
  lastName?: string;
  businessName?: string;
  taxId?: string;
  dateOfBirth?: string;
  address: { line1: string; city: string; state: string; postalCode: string; country: string };
  documentUrls?: string[];
}

// ─── Lending ────────────────────────────────────────────────────

export interface LoanApplication {
  id: string;
  applicantId: string;
  amount: number;
  termMonths: number;
  interestRate: number;
  purpose: string;
  status: 'draft' | 'submitted' | 'underwriting' | 'approved' | 'declined' | 'funded' | 'closed';
  creditScore?: number;
  monthlyPayment?: number;
}

// ─── Card Issuing ───────────────────────────────────────────────

export interface IssuedCard {
  id: string;
  accountId: string;
  type: 'virtual' | 'physical';
  last4: string;
  brand: 'visa' | 'mastercard';
  status: 'active' | 'frozen' | 'canceled';
  spendingLimit: { amount: number; interval: 'daily' | 'monthly' | 'total' };
  expiresAt: string;
}

// ─── Webhooks ───────────────────────────────────────────────────

export type EmbeddedFinanceEventType =
  | 'account.created' | 'account.updated' | 'account.closed'
  | 'transfer.completed' | 'transfer.failed'
  | 'kyc.approved' | 'kyc.rejected'
  | 'card.activated' | 'card.transaction'
  | 'loan.approved' | 'loan.funded';

export interface EmbeddedFinanceWebhookEvent {
  id: string;
  type: EmbeddedFinanceEventType;
  data: Record<string, unknown>;
  createdAt: string;
}
