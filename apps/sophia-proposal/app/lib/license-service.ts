// License Service for Sophia ROIaaS Phase 2
// Provides CRUD operations for license management

import type {
  License,
  LicenseTier,
  LicenseStats,
  CreateLicenseInput,
} from './license-types.js'

/**
 * Generate unique license key
 */
function generateLicenseKey(): string {
  const prefix = 'SOPHIA'
  const random = Math.random().toString(36).substring(2, 10).toUpperCase()
  const timestamp = Date.now().toString(36).toUpperCase()
  return `${prefix}-${random}-${timestamp}`
}

/**
 * Get default features by tier
 */
function getDefaultFeatures(tier: LicenseTier): string[] {
  const features: Record<LicenseTier, string[]> = {
    FREE: ['basic-video', 'watermark'],
    PRO: ['hd-video', 'no-watermark', 'custom-branding', 'api-access'],
    ENTERPRISE: [
      '4k-video',
      'no-watermark',
      'custom-branding',
      'api-access',
      'priority-support',
      'sla',
      'dedicated-account',
    ],
  }
  return features[tier]
}

/**
 * License Service - Singleton pattern for license management
 */
class LicenseServiceClass {
  private licenses: Map<string, License> = new Map()

  constructor() {
    this.initializeMockData()
  }

  /**
   * Initialize with mock data for development
   */
  private initializeMockData(): void {
    const now = new Date()
    const mockLicenses: License[] = [
      {
        id: 'lic_001',
        tier: 'FREE',
        status: 'active',
        customerId: 'cust_001',
        customerName: 'Demo User',
        createdAt: now,
        features: ['basic-video', 'watermark'],
      },
      {
        id: 'lic_002',
        tier: 'PRO',
        status: 'active',
        customerId: 'cust_002',
        customerName: 'Startup Inc',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000),
        features: ['hd-video', 'no-watermark', 'custom-branding', 'api-access'],
      },
      {
        id: 'lic_003',
        tier: 'ENTERPRISE',
        status: 'active',
        customerId: 'cust_003',
        customerName: 'Enterprise Corp',
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 275 * 24 * 60 * 60 * 1000),
        features: ['4k-video', 'no-watermark', 'custom-branding', 'api-access', 'priority-support', 'sla', 'dedicated-account'],
      },
    ]
    mockLicenses.forEach((license) => this.licenses.set(license.id, license))
  }

  /**
   * Get all licenses
   */
  getAll(): License[] {
    return Array.from(this.licenses.values())
  }

  /**
   * Get license by ID
   */
  getById(id: string): License | undefined {
    return this.licenses.get(id)
  }

  /**
   * Get license by customer ID
   */
  getByCustomerId(customerId: string): License | undefined {
    const allLicenses = Array.from(this.licenses.values())
    return allLicenses.find((license) => license.customerId === customerId)
  }

  /**
   * Create new license
   */
  create(input: CreateLicenseInput): License {
    const id = `lic_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const licenseKey = generateLicenseKey()
    const now = new Date()

    const license: License = {
      id,
      tier: input.tier,
      status: 'active',
      customerId: input.customerId,
      customerName: input.customerName,
      createdAt: now,
      expiresAt: input.expiresInDays
        ? new Date(now.getTime() + input.expiresInDays * 24 * 60 * 60 * 1000)
        : undefined,
      features: input.features || getDefaultFeatures(input.tier),
      metadata: {
        licenseKey,
      },
    }

    this.licenses.set(id, license)
    return license
  }

  /**
   * Revoke license
   */
  revoke(id: string): License | undefined {
    const license = this.licenses.get(id)
    if (!license) {
      return undefined
    }

    license.status = 'revoked'
    this.licenses.set(id, license)
    return license
  }

  /**
   * Delete license
   */
  delete(id: string): boolean {
    return this.licenses.delete(id)
  }

  /**
   * Get license statistics
   */
  getStats(): LicenseStats {
    const licenses = this.getAll()

    const stats: LicenseStats = {
      total: licenses.length,
      byTier: { FREE: 0, PRO: 0, ENTERPRISE: 0 },
      byStatus: { active: 0, revoked: 0, expired: 0 },
    }

    licenses.forEach((license) => {
      stats.byTier[license.tier]++
      stats.byStatus[license.status]++
    })

    return stats
  }

  /**
   * Update subscription info (ROIaaS Phase 3)
   */
  updateSubscription(
    id: string,
    subscriptionId: string,
    subscriptionStatus: 'active' | 'cancelled' | 'uncancelled'
  ): License | undefined {
    const license = this.licenses.get(id)
    if (!license) {
      return undefined
    }

    license.subscriptionId = subscriptionId
    license.subscriptionStatus = subscriptionStatus
    this.licenses.set(id, license)
    return license
  }

  /**
   * Clear all licenses (for testing)
   */
  clear(): void {
    this.licenses.clear()
  }
}

// Singleton instance
export const LicenseService = new LicenseServiceClass()
