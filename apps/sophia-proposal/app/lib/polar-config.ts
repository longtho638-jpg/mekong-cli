/**
 * Polar.sh Configuration for Sophia AI Video Engine
 *
 * Provides configuration for Polar.sh payment webhooks and API integration.
 * Polar.sh is the exclusive payment provider for AgencyOS projects.
 *
 * @see https://docs.polar.sh
 */

/**
 * Polar configuration loaded from environment variables
 */
export const PolarConfig = {
  /**
   * Webhook secret for signature verification
   * Format: whsec_xxx (provided by Polar.sh dashboard)
   */
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET,

  /**
   * Polar product ID for Sophia AI Video Engine
   * Format: prod_xxx (from Polar.sh product catalog)
   */
  productId: process.env.POLAR_PRODUCT_ID,

  /**
   * Polar API base URL
   */
  baseUrl: 'https://api.polar.sh',

  /**
   * API version
   */
  apiVersion: 'v1',
} as const

/**
 * Validate Polar configuration is complete
 *
 * @throws Error if required configuration is missing
 */
export function validatePolarConfig(): void {
  const missing: string[] = []

  if (!PolarConfig.webhookSecret) {
    missing.push('POLAR_WEBHOOK_SECRET')
  }

  if (!PolarConfig.productId) {
    missing.push('POLAR_PRODUCT_ID')
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing Polar.sh configuration: ${missing.join(', ')}. ` +
      'Please add these environment variables to .env.local'
    )
  }
}

/**
 * Check if Polar configuration is valid (without throwing)
 *
 * @returns true if configuration is complete
 */
export function isPolarConfigured(): boolean {
  return !!(PolarConfig.webhookSecret && PolarConfig.productId)
}
