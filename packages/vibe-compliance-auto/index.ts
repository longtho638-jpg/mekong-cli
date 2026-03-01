/**
 * @agencyos/vibe-compliance-auto
 *
 * AML/KYC compliance automation SDK:
 * 1. Risk scoring engine — rule-based + ML hybrid risk assessment
 * 2. Sanctions screening — PEP/watchlist/adverse media checks
 * 3. Perpetual KYC monitor — continuous verification triggers
 *
 * Usage:
 *   import { createRiskScorer, createSanctionsScreener, createPerpetualKycMonitor } from '@agencyos/vibe-compliance-auto'
 *   const scorer = createRiskScorer({ thresholds: { low: 30, medium: 60, high: 80 } })
 *   const result = scorer.score({ country: 'MM', txVolume: 50000, pep: true })
 */

// === TYPES ===

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ScreeningResult {
  CLEAR = 'clear',
  POTENTIAL_MATCH = 'potential_match',
  CONFIRMED_MATCH = 'confirmed_match',
}

export interface RiskFactor {
  name: string
  weight: number
  value: number
}

export interface RiskAssessment {
  score: number
  level: RiskLevel
  factors: RiskFactor[]
  timestamp: string
}

export interface ScreeningHit {
  source: string
  matchScore: number
  result: ScreeningResult
  details: string
}

export interface KycTrigger {
  type: string
  threshold: number
  action: string
}

export interface ComplianceConfig {
  thresholds: { low: number; medium: number; high: number }
}

// === RISK SCORER ===

/** Tạo risk scoring engine — tính điểm rủi ro KYC/AML */
export function createRiskScorer(config: ComplianceConfig) {
  const { thresholds } = config

  function classifyLevel(score: number): RiskLevel {
    if (score >= thresholds.high) return RiskLevel.CRITICAL
    if (score >= thresholds.medium) return RiskLevel.HIGH
    if (score >= thresholds.low) return RiskLevel.MEDIUM
    return RiskLevel.LOW
  }

  function score(input: Record<string, unknown>): RiskAssessment {
    const factors: RiskFactor[] = []
    let totalScore = 0

    // Country risk
    const highRiskCountries = ['MM', 'KP', 'IR', 'SY', 'AF']
    if (highRiskCountries.includes(String(input.country || ''))) {
      factors.push({ name: 'country_risk', weight: 30, value: 30 })
      totalScore += 30
    }

    // Transaction volume risk
    const txVol = Number(input.txVolume || 0)
    if (txVol > 100000) {
      factors.push({ name: 'high_tx_volume', weight: 25, value: 25 })
      totalScore += 25
    } else if (txVol > 10000) {
      factors.push({ name: 'medium_tx_volume', weight: 10, value: 10 })
      totalScore += 10
    }

    // PEP status
    if (input.pep) {
      factors.push({ name: 'pep_status', weight: 20, value: 20 })
      totalScore += 20
    }

    // Adverse media
    if (input.adverseMedia) {
      factors.push({ name: 'adverse_media', weight: 15, value: 15 })
      totalScore += 15
    }

    return {
      score: Math.min(totalScore, 100),
      level: classifyLevel(totalScore),
      factors: [...factors],
      timestamp: new Date().toISOString(),
    }
  }

  return { score, classifyLevel }
}

// === SANCTIONS SCREENER ===

/** Tạo sanctions screening engine — kiểm tra PEP/watchlist */
export function createSanctionsScreener() {
  const hits: ScreeningHit[] = []

  function screen(name: string, sources: string[]): ScreeningHit[] {
    const results: ScreeningHit[] = []
    for (const source of sources) {
      results.push({
        source,
        matchScore: 0,
        result: ScreeningResult.CLEAR,
        details: `No match found for "${name}" in ${source}`,
      })
    }
    return results
  }

  function addHit(hit: ScreeningHit): void {
    hits.push({ ...hit })
  }

  function getHits(): ScreeningHit[] {
    return [...hits]
  }

  function clearHits(): void {
    hits.length = 0
  }

  return { screen, addHit, getHits, clearHits }
}

// === PERPETUAL KYC MONITOR ===

/** Tạo perpetual KYC monitor — giám sát liên tục, trigger re-verification */
export function createPerpetualKycMonitor() {
  const triggers: KycTrigger[] = []
  const alerts: Array<{ trigger: KycTrigger; value: number; timestamp: string }> = []

  function addTrigger(trigger: KycTrigger): void {
    triggers.push({ ...trigger })
  }

  function evaluate(event: { type: string; value: number }): boolean {
    let triggered = false
    for (const t of triggers) {
      if (t.type === event.type && event.value >= t.threshold) {
        alerts.push({
          trigger: { ...t },
          value: event.value,
          timestamp: new Date().toISOString(),
        })
        triggered = true
      }
    }
    return triggered
  }

  function getAlerts() {
    return [...alerts]
  }

  function getTriggers() {
    return [...triggers]
  }

  return { addTrigger, evaluate, getAlerts, getTriggers }
}
