/**
 * Polar.sh Payment Gateway Configuration
 */

export interface PolarConfig {
  apiKey: string;
  webhookSecret: string;
  baseUrl: string;
  checkoutSuccessUrl: string;
}

export const polarConfig: PolarConfig = {
  apiKey: process.env.POLAR_API_KEY || '',
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET || '',
  baseUrl: 'https://api.polar.sh',
  checkoutSuccessUrl: process.env.POLAR_SUCCESS_URL || 'https://algo-trader.local/upgrade/success',
};

export function validatePolarConfig(): void {
  if (!polarConfig.apiKey) {
    console.warn('[Polar] POLAR_API_KEY not configured - payment features disabled');
  }
  if (!polarConfig.webhookSecret) {
    console.warn('[Polar] POLAR_WEBHOOK_SECRET not configured - webhook verification disabled');
  }
}
