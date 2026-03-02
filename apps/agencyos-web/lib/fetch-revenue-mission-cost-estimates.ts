import { readJson } from './dashboard-data-helpers'
import type { RawMissionHistory, MissionOutcome, RevenueData, Transaction } from './dashboard-data-types'

export type { RevenueData, Transaction }

interface RevenueRow {
  timestamp: string
  project: string
  tokensUsed: number
  success: boolean
}

export async function getRevenueData(): Promise<RevenueData> {
  const history = await readJson<RawMissionHistory[]>('mission-history.json', [])
  const outcomes = await readJson<MissionOutcome[]>('mission-outcomes.json', [])

  const totalRevenue = history.length * 15
  const mrr = Math.round(totalRevenue / 3)
  const activeSubscriptions = new Set(history.map((h) => h.project)).size

  // Prefer mission-history (has tokensUsed); fall back to outcomes (no token data)
  const source: RevenueRow[] = history.length > 0
    ? history.map((h) => ({
        timestamp: h.timestamp,
        project: h.project,
        tokensUsed: h.tokensUsed || 0,
        success: h.success,
      }))
    : outcomes.map((o) => ({
        timestamp: o.timestamp,
        project: o.project,
        tokensUsed: 0,
        success: o.success,
      }))

  const transactions: Transaction[] = source
    .slice(-5)
    .reverse()
    .map((item, i) => ({
      id: i + 1,
      date: item.timestamp ? new Date(item.timestamp).toISOString().split('T')[0] : 'N/A',
      product: item.project || 'Mission',
      amount: `${item.tokensUsed.toLocaleString()} MCU`,
      status: item.success ? 'Completed' : 'Failed',
    }))

  return { totalRevenue, mrr, activeSubscriptions, transactions }
}
