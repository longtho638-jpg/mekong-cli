// License Types for Sophia ROIaaS Phase 2

export type LicenseTier = 'FREE' | 'PRO' | 'ENTERPRISE'

export type LicenseStatus = 'active' | 'revoked' | 'expired'

export interface License {
  id: string
  tier: LicenseTier
  status: LicenseStatus
  customerId: string
  customerName: string
  createdAt: Date
  expiresAt?: Date
  features: string[]
  metadata?: Record<string, unknown>
  /**
   * Polar.sh subscription ID (ROIaaS Phase 3)
   */
  subscriptionId?: string
  /**
   * Subscription status from Polar.sh (ROIaaS Phase 3)
   */
  subscriptionStatus?: 'active' | 'cancelled' | 'uncancelled'
}

export interface LicenseStats {
  total: number
  byTier: Record<LicenseTier, number>
  byStatus: Record<LicenseStatus, number>
}

export interface CreateLicenseInput {
  tier: LicenseTier
  customerId: string
  customerName: string
  expiresInDays?: number
  features?: string[]
}
