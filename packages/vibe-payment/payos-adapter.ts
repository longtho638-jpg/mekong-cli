/**
 * PayOS Adapter — Implements VibePaymentProvider for PayOS Vietnamese QR gateway
 *
 * All operations proxied through Supabase Edge Functions (credentials server-side only).
 * Generic SupabaseClient interface — works with any @supabase/supabase-js version.
 */

import type {
  VibePaymentProvider,
  VibePaymentRequest,
  VibePaymentResponse,
  VibePaymentStatus,
  VibePaymentStatusCode,
  VibeWebhookEvent,
  WebhookEventType,
} from './types';

// ─── Generic Supabase interface (avoids hard peer dep) ──────────

interface SupabaseFunctionsClient {
  invoke: (name: string, options: { body: Record<string, unknown> }) => Promise<{ data: Record<string, unknown>; error: { message: string } | null }>;
}

interface SupabaseLike {
  functions: SupabaseFunctionsClient;
}

// ─── PayOS-specific raw webhook data ────────────────────────────

interface PayOSWebhookData {
  orderCode: number;
  amount: number;
  description: string;
  accountNumber: string;
  reference: string;
  transactionDateTime: string;
  currency: string;
  paymentLinkId: string;
  code: string;
  desc: string;
  counterAccountBankId?: string;
  counterAccountBankName?: string;
  counterAccountName?: string;
  counterAccountNumber?: string;
  virtualAccountName?: string;
  virtualAccountNumber?: string;
}

// ─── HMAC-SHA256 Signature Helpers ──────────────────────────────

async function computeHmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function payosCodeToStatus(code: string): VibePaymentStatusCode {
  if (code === '00') return 'PAID';
  if (code === '01') return 'CANCELLED';
  return 'PENDING';
}

function payosCodeToEventType(code: string): WebhookEventType {
  if (code === '00') return 'payment.paid';
  if (code === '01') return 'payment.cancelled';
  return 'payment.pending';
}

// ─── PayOS Provider ─────────────────────────────────────────────

export class PayOSAdapter implements VibePaymentProvider {
  readonly name = 'payos' as const;
  private readonly supabase: SupabaseLike;

  constructor(supabase: SupabaseLike) {
    this.supabase = supabase;
  }

  async createPayment(request: VibePaymentRequest): Promise<VibePaymentResponse> {
    const { data, error } = await this.supabase.functions.invoke('payos-create-payment', {
      body: {
        orderCode: request.orderCode,
        amount: request.amount,
        description: request.description,
        items: request.items,
        returnUrl: request.returnUrl,
        cancelUrl: request.cancelUrl,
      },
    });

    if (error) {
      throw new Error(`PayOS create payment failed: ${error.message}`);
    }

    return {
      checkoutUrl: data.checkoutUrl as string,
      orderCode: data.orderCode as number,
    };
  }

  async getPaymentStatus(orderCode: number): Promise<VibePaymentStatus> {
    const { data, error } = await this.supabase.functions.invoke('payos-get-payment', {
      body: { orderCode },
    });

    if (error) {
      throw new Error(`PayOS get payment failed: ${error.message}`);
    }

    return {
      orderCode: (data.orderCode as number) ?? orderCode,
      amount: (data.amount as number) ?? 0,
      amountPaid: (data.amountPaid as number) ?? 0,
      amountRemaining: (data.amountRemaining as number) ?? 0,
      status: (data.status as VibePaymentStatusCode) ?? 'PENDING',
      createdAt: (data.createdAt as string) ?? '',
      transactions: (data.transactions as Record<string, unknown>[]) ?? [],
      cancellationReason: data.cancellationReason as string | undefined,
      canceledAt: data.canceledAt as string | undefined,
    };
  }

  async cancelPayment(orderCode: number, reason?: string): Promise<VibePaymentStatus> {
    const { data, error } = await this.supabase.functions.invoke('payos-cancel-payment', {
      body: { orderCode, cancellationReason: reason ?? 'User cancelled' },
    });

    if (error) {
      throw new Error(`PayOS cancel payment failed: ${error.message}`);
    }

    return data as unknown as VibePaymentStatus;
  }

  isConfigured(): boolean {
    return true; // Credentials are server-side in Edge Functions
  }

  async parseWebhookEvent(
    payload: unknown,
    signature: string,
    checksumKey: string,
  ): Promise<VibeWebhookEvent | null> {
    const webhookPayload = payload as { data: PayOSWebhookData; signature: string };
    const data = webhookPayload.data;

    if (!data || !signature) return null;

    const sortedKeys = Object.keys(data).sort();
    const signatureData = sortedKeys
      .map((key) => `${key}=${data[key as keyof PayOSWebhookData]}`)
      .join('&');
    const computed = await computeHmacSha256(checksumKey, signatureData);

    if (!secureCompare(signature, computed)) return null;

    return {
      type: payosCodeToEventType(data.code),
      orderCode: data.orderCode,
      amount: data.amount,
      description: data.description,
      reference: data.reference,
      transactionDateTime: data.transactionDateTime,
      currency: data.currency,
      paymentLinkId: data.paymentLinkId,
      rawCode: data.code,
      rawDescription: data.desc,
      counterAccount: {
        bankId: data.counterAccountBankId,
        bankName: data.counterAccountBankName,
        accountName: data.counterAccountName,
        accountNumber: data.counterAccountNumber,
      },
      raw: data as unknown as Record<string, unknown>,
    };
  }
}

export { computeHmacSha256, secureCompare, payosCodeToStatus, payosCodeToEventType };
