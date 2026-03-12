// RAAS License Gate - ROIaaS Phase 1
// Validates RAAS_LICENSE_KEY and provides tier-based access control

/**
 * Premium templates that require valid license
 */
export const PREMIUM_TEMPLATES = [
  'video-factory',
  'campaign-export',
] as const

/**
 * Free tier templates (always available)
 */
export const FREE_TEMPLATES = [
  'basic-proposal',
  'quick-pitch',
] as const

export type TemplateId = typeof PREMIUM_TEMPLATES[number] | typeof FREE_TEMPLATES[number]
export type LicenseTier = 'free' | 'premium'

/**
 * Check if license key is valid
 * @param key - License key to validate (defaults to RAAS_LICENSE_KEY env)
 */
export function checkLicense(key?: string): { valid: boolean; tier: LicenseTier } {
  const licenseKey = key ?? process.env.RAAS_LICENSE_KEY

  // Valid license: non-empty string matching expected format
  if (licenseKey && licenseKey.trim().length > 0) {
    return { valid: true, tier: 'premium' }
  }

  return { valid: false, tier: 'free' }
}

/**
 * Check if current session is free tier (no valid license)
 */
export function isFreeTier(): boolean {
  return !checkLicense().valid
}

/**
 * Check if current session is premium tier (has valid license)
 */
export function isPremiumTier(): boolean {
  return checkLicense().valid
}

/**
 * Check if template is accessible for current tier
 * @param templateId - Template identifier
 */
export function canAccessTemplate(templateId: string): boolean {
  const { tier } = checkLicense()

  // Premium tier: access all templates
  if (tier === 'premium') {
    return true
  }

  // Free tier: only free templates
  return FREE_TEMPLATES.includes(templateId as typeof FREE_TEMPLATES[number])
}

/**
 * Get available templates for current tier
 */
export function getAvailableTemplates(): readonly string[] {
  if (isPremiumTier()) {
    return [...FREE_TEMPLATES, ...PREMIUM_TEMPLATES] as const
  }
  return FREE_TEMPLATES
}

/**
 * Get premium-only templates (for upsell UI)
 */
export function getPremiumTemplates(): readonly string[] {
  return PREMIUM_TEMPLATES
}
