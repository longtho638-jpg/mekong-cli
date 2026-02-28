/**
 * Vibe Payment SDK — Provider-Agnostic Payment Types
 *
 * Reusable interfaces for any Vietnamese payment gateway (PayOS, VNPay, MoMo).
 * Designed for RaaS (Retail-as-a-Service) multi-project reuse.
 */

// ─── Provider Identity ──────────────────────────────────────────

export type PaymentProviderName = 'payos' | 'vnpay' | 'momo' | 'stripe';

// ─── Payment Request/Response ───────────────────────────────────

export interface VibePaymentRequest {
  orderCode: number;
  amount: number;
  description: string;
  items: VibePaymentItem[];
  returnUrl: string;
  cancelUrl: string;
  metadata?: Record<string, unknown>;
}

export interface VibePaymentItem {
  name: string;
  quantity: number;
  price: number;
}

export interface VibePaymentResponse {
  checkoutUrl: string;
  orderCode: number;
  qrCode?: string;
  paymentLinkId?: string;
  raw?: Record<string, unknown>;
}

// ─── Payment Status ─────────────────────────────────────────────

export type VibePaymentStatusCode = 'PENDING' | 'PAID' | 'CANCELLED' | 'FAILED';

export interface VibePaymentStatus {
  orderCode: number;
  amount: number;
  amountPaid: number;
  amountRemaining: number;
  status: VibePaymentStatusCode;
  createdAt: string;
  transactions: Record<string, unknown>[];
  cancellationReason?: string;
  canceledAt?: string;
}

// ─── Webhook Events ─────────────────────────────────────────────

export type WebhookEventType = 'payment.paid' | 'payment.cancelled' | 'payment.pending';

export interface VibeWebhookEvent {
  type: WebhookEventType;
  orderCode: number;
  amount: number;
  description: string;
  reference: string;
  transactionDateTime: string;
  currency: string;
  paymentLinkId: string;
  rawCode: string;
  rawDescription: string;
  counterAccount?: {
    bankId?: string;
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
  };
  raw: Record<string, unknown>;
}

// ─── Subscription Intent ────────────────────────────────────────

export interface VibeSubscriptionIntent {
  id: string;
  userId: string;
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  status: 'pending' | 'paid' | 'canceled';
}

// ─── Webhook Handler Config ─────────────────────────────────────

export interface VibeWebhookConfig {
  webhookSecret: string;
  checksumKey: string;
  onOrderPaid?: (event: VibeWebhookEvent, orderId: string) => Promise<void>;
  onOrderCancelled?: (event: VibeWebhookEvent, orderId: string) => Promise<void>;
  onSubscriptionPaid?: (event: VibeWebhookEvent, intent: VibeSubscriptionIntent) => Promise<void>;
  onSubscriptionCancelled?: (event: VibeWebhookEvent, intent: VibeSubscriptionIntent) => Promise<void>;
}

// ─── Provider Interface ─────────────────────────────────────────

export interface VibePaymentProvider {
  readonly name: PaymentProviderName;

  createPayment(request: VibePaymentRequest): Promise<VibePaymentResponse>;
  getPaymentStatus(orderCode: number): Promise<VibePaymentStatus>;
  cancelPayment(orderCode: number, reason?: string): Promise<VibePaymentStatus>;
  isConfigured(): boolean;

  /** Verify webhook signature and parse into normalized event */
  parseWebhookEvent(payload: unknown, signature: string, checksumKey: string): Promise<VibeWebhookEvent | null>;
}

// ─── Webhook Processing Pipeline ────────────────────────────────

export type WebhookProcessingResult =
  | { status: 'processed'; orderCode: number; newStatus: VibePaymentStatusCode }
  | { status: 'ignored'; orderCode: number; reason: string }
  | { status: 'error'; message: string };

export interface WebhookIdempotencyGuard {
  isAlreadyProcessed(orderCode: number): Promise<boolean>;
  markProcessed(orderCode: number, status: VibePaymentStatusCode): Promise<void>;
}
