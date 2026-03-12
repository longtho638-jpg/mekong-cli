/**
 * Usage Metering Tests for Sophia ROIaaS Phase 4
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { UsageMetering } from '../app/lib/usage-metering'
import { OverageAlertEngine } from '../app/lib/overage-alert-engine'
import { USAGE_LIMITS, getLimit, getAlertLevel, isUnlimited } from '../app/lib/usage-limits'
import { LicenseService } from '../app/lib/license-service'

describe('Usage Limits', () => {
  it('should have correct limits for each tier', () => {
    expect(USAGE_LIMITS.FREE.apiCalls).toBe(10)
    expect(USAGE_LIMITS.FREE.transferMb).toBe(100)

    expect(USAGE_LIMITS.PRO.apiCalls).toBe(1000)
    expect(USAGE_LIMITS.PRO.transferMb).toBe(10240) // 10 GB

    expect(USAGE_LIMITS.ENTERPRISE.apiCalls).toBe(10000)
    expect(USAGE_LIMITS.ENTERPRISE.transferMb).toBe(102400) // 100 GB

    expect(USAGE_LIMITS.MASTER.apiCalls).toBe(Number.MAX_SAFE_INTEGER)
    expect(USAGE_LIMITS.MASTER.transferMb).toBe(Number.MAX_SAFE_INTEGER)
  })

  it('should get limit for specific metric', () => {
    expect(getLimit('FREE', 'api_calls')).toBe(10)
    expect(getLimit('FREE', 'transfer_mb')).toBe(100)
    expect(getLimit('PRO', 'api_calls')).toBe(1000)
  })

  it('should identify unlimited tier', () => {
    expect(isUnlimited('MASTER')).toBe(true)
    expect(isUnlimited('FREE')).toBe(false)
    expect(isUnlimited('PRO')).toBe(false)
  })

  it('should get alert levels correctly', () => {
    expect(getAlertLevel(50)).toBe(null)
    expect(getAlertLevel(80)).toBe('warning')
    expect(getAlertLevel(85)).toBe('warning')
    expect(getAlertLevel(90)).toBe('critical')
    expect(getAlertLevel(95)).toBe('critical')
    expect(getAlertLevel(100)).toBe('exceeded')
  })
})

describe('Usage Metering', () => {
  beforeEach(() => {
    UsageMetering.clear()
    LicenseService.clear()
  })

  it('should record usage', () => {
    const license = LicenseService.create({
      tier: 'PRO',
      customerId: 'test-customer',
      customerName: 'Test Customer',
    })

    UsageMetering.recordUsage(license.id, 'api_calls', 1)
    UsageMetering.recordUsage(license.id, 'api_calls', 5)

    const usage = UsageMetering.getUsage(license.id, 'day')
    expect(usage.apiCalls).toBe(6)
  })

  it('should get usage stats', () => {
    const license = LicenseService.create({
      tier: 'FREE',
      customerId: 'test-customer-2',
      customerName: 'Test Customer 2',
    })

    // Record 8 API calls (80% of FREE tier)
    for (let i = 0; i < 8; i++) {
      UsageMetering.recordUsage(license.id, 'api_calls', 1)
    }

    const stats = UsageMetering.getUsageStats(license.id)
    expect(stats.tier).toBe('FREE')
    expect(stats.apiCalls.used).toBe(8)
    expect(stats.apiCalls.percent).toBe(80)
    expect(stats.status).toBe('warning')
  })

  it('should check limits', () => {
    const license = LicenseService.create({
      tier: 'FREE',
      customerId: 'test-customer-3',
      customerName: 'Test Customer 3',
    })

    // Record 10 API calls (100% of FREE tier)
    for (let i = 0; i < 10; i++) {
      UsageMetering.recordUsage(license.id, 'api_calls', 1)
    }

    const limitCheck = UsageMetering.checkLimit(license.id)
    expect(limitCheck.exceeded).toBe(true)
    expect(limitCheck.apiCallsPercent).toBe(100)
  })
})

describe('Overage Alert Engine', () => {
  beforeEach(() => {
    OverageAlertEngine.clear()
    LicenseService.clear()
    UsageMetering.clear()
  })

  it('should trigger alerts at thresholds', () => {
    const license = LicenseService.create({
      tier: 'FREE',
      customerId: 'test-customer-4',
      customerName: 'Test Customer 4',
    })

    // Configure alerts
    OverageAlertEngine.setConfig({
      licenseId: license.id,
      enabled: true,
      dashboardEnabled: true,
    })

    // Record 8 API calls (80% - warning threshold)
    for (let i = 0; i < 8; i++) {
      UsageMetering.recordUsage(license.id, 'api_calls', 1)
    }

    const alerts = OverageAlertEngine.checkAndAlert(license.id)
    expect(alerts.length).toBeGreaterThan(0)
    expect(alerts[0].level).toBe('warning')
  })

  it('should track alert history', () => {
    const license = LicenseService.create({
      tier: 'FREE',
      customerId: 'test-customer-5',
      customerName: 'Test Customer 5',
    })

    OverageAlertEngine.setConfig({
      licenseId: license.id,
      enabled: true,
      dashboardEnabled: true,
    })

    // Record 10 API calls (100% - exceeded)
    for (let i = 0; i < 10; i++) {
      UsageMetering.recordUsage(license.id, 'api_calls', 1)
    }

    OverageAlertEngine.checkAndAlert(license.id)

    const history = OverageAlertEngine.getAlertHistory(license.id)
    expect(history.length).toBeGreaterThan(0)
  })
})
