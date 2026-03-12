// Overage Alert Engine for Sophia ROIaaS Phase 4
// Triggers alerts at 80%, 90%, 100% usage thresholds

import { UsageMetering } from './usage-metering'

/**
 * Alert types supported by the system
 */
export type AlertType = 'email' | 'webhook' | 'dashboard'

/**
 * Alert level types
 */
export type AlertLevel = 'warning' | 'critical' | 'exceeded'

/**
 * Alert record structure
 */
export interface AlertRecord {
  id: string
  licenseId: string
  level: AlertLevel
  type: AlertType
  metric: 'api_calls' | 'transfer_mb'
  percent: number
  message: string
  createdAt: Date
  delivered: boolean
}

/**
 * Alert configuration per license
 */
export interface AlertConfig {
  licenseId: string
  enabled: boolean
  email?: string
  webhookUrl?: string
  dashboardEnabled: boolean
}

/**
 * Overage Alert Engine - Manages alert triggers and history
 */
class OverageAlertEngineClass {
  private alerts: Map<string, AlertRecord[]> = new Map()
  private configs: Map<string, AlertConfig> = new Map()
  private lastTriggered: Map<string, number> = new Map() // licenseId -> threshold

  /**
   * Check and trigger alerts for a license
   */
  checkAndAlert(licenseId: string): AlertRecord[] {
    const stats = UsageMetering.getUsageStats(licenseId)
    const triggeredAlerts: AlertRecord[] = []

    // Check API calls (daily)
    if (stats.apiCalls.percent > 0) {
      const apiAlerts = this.evaluateThresholds(
        licenseId,
        'api_calls',
        stats.apiCalls.percent,
        stats.status
      )
      triggeredAlerts.push(...apiAlerts)
    }

    // Check transfer (monthly)
    if (stats.transferMb.percent > 0) {
      const transferAlerts = this.evaluateThresholds(
        licenseId,
        'transfer_mb',
        stats.transferMb.percent,
        stats.status
      )
      triggeredAlerts.push(...transferAlerts)
    }

    // Deliver alerts
    triggeredAlerts.forEach(alert => this.deliverAlert(alert))

    return triggeredAlerts
  }

  /**
   * Get alert history for a license
   */
  getAlertHistory(licenseId: string, limit = 10): AlertRecord[] {
    const alerts = this.alerts.get(licenseId) || []
    return alerts
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
  }

  /**
   * Get alert configuration for a license
   */
  getConfig(licenseId: string): AlertConfig | undefined {
    return this.configs.get(licenseId)
  }

  /**
   * Set alert configuration for a license
   */
  setConfig(config: AlertConfig): void {
    this.configs.set(config.licenseId, config)
  }

  /**
   * Clear all alerts (for testing)
   */
  clear(): void {
    this.alerts.clear()
    this.lastTriggered.clear()
  }

  /**
   * Evaluate thresholds and create alerts
   */
  private evaluateThresholds(
    licenseId: string,
    metric: 'api_calls' | 'transfer_mb',
    percent: number,
    _status: 'normal' | 'warning' | 'critical' | 'exceeded'
  ): AlertRecord[] {
    const alerts: AlertRecord[] = []
    const config = this.getConfig(licenseId) || this.getDefaultConfig(licenseId)

    if (!config.enabled) return []

    const lastThreshold = this.lastTriggered.get(licenseId) || 0

    // Determine current threshold level
    let currentThreshold = 0
    if (percent >= 100) currentThreshold = 100
    else if (percent >= 90) currentThreshold = 90
    else if (percent >= 80) currentThreshold = 80

    // Only trigger if crossed a new threshold
    if (currentThreshold > lastThreshold && currentThreshold >= 80) {
      const level: AlertLevel =
        currentThreshold >= 100 ? 'exceeded' : currentThreshold >= 90 ? 'critical' : 'warning'

      // Create dashboard alert (always enabled)
      if (config.dashboardEnabled) {
        alerts.push(
          this.createAlert(licenseId, metric, percent, level, 'dashboard', config)
        )
      }

      // Create email alert
      if (config.email && level !== 'warning') {
        alerts.push(
          this.createAlert(licenseId, metric, percent, level, 'email', config)
        )
      }

      // Create webhook alert
      if (config.webhookUrl && level === 'exceeded') {
        alerts.push(
          this.createAlert(licenseId, metric, percent, level, 'webhook', config)
        )
      }

      this.lastTriggered.set(licenseId, currentThreshold)
    }

    return alerts
  }

  /**
   * Create an alert record
   */
  private createAlert(
    licenseId: string,
    metric: 'api_calls' | 'transfer_mb',
    percent: number,
    level: AlertLevel,
    type: AlertType,
    _config: AlertConfig
  ): AlertRecord {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const message = this.getAlertMessage(licenseId, metric, percent, level)

    const alert: AlertRecord = {
      id,
      licenseId,
      level,
      type,
      metric,
      percent,
      message,
      createdAt: new Date(),
      delivered: false,
    }

    // Store alert
    if (!this.alerts.has(licenseId)) {
      this.alerts.set(licenseId, [])
    }
    this.alerts.get(licenseId)!.push(alert)

    return alert
  }

  /**
   * Deliver alert to appropriate channel
   */
  private deliverAlert(alert: AlertRecord): void {
    // Mark as delivered
    alert.delivered = true

    // In production, implement actual delivery:
    // - Email: Send via email service
    // - Webhook: POST to webhookUrl
    // - Dashboard: Already stored, UI polls this

    // For now, log to console for debugging
    console.log(`[ALERT] ${alert.level.toUpperCase()}: ${alert.message}`)
  }

  /**
   * Get default alert configuration
   */
  private getDefaultConfig(licenseId: string): AlertConfig {
    return {
      licenseId,
      enabled: true,
      dashboardEnabled: true,
    }
  }

  /**
   * Generate alert message
   */
  private getAlertMessage(
    licenseId: string,
    metric: 'api_calls' | 'transfer_mb',
    percent: number,
    level: AlertLevel
  ): string {
    const metricName = metric === 'api_calls' ? 'API calls' : 'Data transfer'
    const threshold = level === 'exceeded' ? '100%' : level === 'critical' ? '90%' : '80%'

    return `${metricName} at ${threshold} (${percent}%) for license ${licenseId}`
  }
}

// Singleton instance
export const OverageAlertEngine = new OverageAlertEngineClass()
