import { readJson } from './dashboard-data-helpers'
import type { RawMissionHistory, BillingData, UsageRow } from './dashboard-data-types'

export type { BillingData, UsageRow }

export async function getBillingData(): Promise<BillingData> {
  const history = await readJson<RawMissionHistory[]>('mission-history.json', [])

  const totalMcu = history.reduce((sum, h) => sum + (h.tokensUsed || 0), 0)

  const usageHistory: UsageRow[] = history
    .slice()
    .reverse()
    .slice(0, 10)
    .map((h, i) => ({
      id: `u${i + 1}`,
      date: h.timestamp ? new Date(h.timestamp).toISOString().split('T')[0] : 'N/A',
      description: h.missionId.replace(/_/g, ' ').slice(0, 80) || 'Mission execution',
      mcu: h.tokensUsed || 0,
    }))

  return { totalMcu, usageHistory }
}
