/**
 * @agencyos/vibe-embedded-finance — KYC/KYB Verification
 *
 * Identity verification flows for embedded finance.
 * Supports Alloy, Persona, and custom providers.
 */

import type {
  KYCVerification,
  KYCSubmission,
} from './types';

// ─── KYC Provider Config ────────────────────────────────────────

export interface KYCProviderConfig {
  provider: 'alloy' | 'persona' | 'plaid-identity' | 'custom';
  apiKey: string;
  webhookUrl?: string;
  baseUrl?: string;
}

// ─── KYC Manager ────────────────────────────────────────────────

export function createKYCManager(config: KYCProviderConfig) {
  const { apiKey, provider } = config;
  const baseUrl = config.baseUrl ?? resolveKYCProviderUrl(provider);

  async function apiRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`KYC API error: ${(error as Record<string, string>).message ?? response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  return {
    /** Submit KYC application */
    async submit(submission: KYCSubmission): Promise<KYCVerification> {
      return apiRequest<KYCVerification>('POST', '/verifications', submission);
    },

    /** Get verification status */
    async getStatus(verificationId: string): Promise<KYCVerification> {
      return apiRequest<KYCVerification>('GET', `/verifications/${verificationId}`);
    },

    /** List verifications for a customer */
    async listForCustomer(customerId: string): Promise<KYCVerification[]> {
      return apiRequest<KYCVerification[]>('GET', `/customers/${customerId}/verifications`);
    },

    /** Manually approve (for sandbox/testing) */
    async manualApprove(verificationId: string): Promise<KYCVerification> {
      return apiRequest<KYCVerification>('POST', `/verifications/${verificationId}/approve`, {});
    },

    /** Check if customer is verified */
    async isVerified(customerId: string): Promise<boolean> {
      const verifications = await apiRequest<KYCVerification[]>('GET', `/customers/${customerId}/verifications`);
      return verifications.some(v => v.status === 'approved');
    },
  };
}

// ─── Provider URL Resolution ────────────────────────────────────

function resolveKYCProviderUrl(provider: string): string {
  const urls: Record<string, string> = {
    'alloy': 'https://api.alloy.co/v1',
    'persona': 'https://api.withpersona.com/api/v1',
    'plaid-identity': 'https://production.plaid.com',
  };
  return urls[provider] ?? `https://api.${provider}.com/v1`;
}
