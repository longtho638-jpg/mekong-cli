import type { Mission, MissionStatus } from '@/components/mission-feed-table'
import { readJson, missionIdShort, projectToAgent } from './dashboard-data-helpers'
import type { RawMissionHistory, DispatchedTasksFile, DashboardStats } from './dashboard-data-types'

export type { DashboardStats }

export async function getMissions(limit?: number): Promise<Mission[]> {
  const history = await readJson<RawMissionHistory[]>('mission-history.json', [])

  const missions: Mission[] = history
    .slice()
    .reverse()
    .map((h) => ({
      id: missionIdShort(h.missionId),
      goal: h.missionId.replace(/_/g, ' ').replace(/^(CRITICAL|HIGH|MEDIUM|LOW) mission /, ''),
      status: (h.success ? 'success' : 'failed') as MissionStatus,
      agent: projectToAgent(h.project),
      mcuCost: h.tokensUsed,
      durationSec: Math.round(h.duration / 1000),
      createdAt: h.timestamp,
    }))

  return limit ? missions.slice(0, limit) : missions
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const history = await readJson<RawMissionHistory[]>('mission-history.json', [])
  const dispatched = await readJson<DispatchedTasksFile>('dispatched-tasks.json', { tasks: [] })

  const total = history.length
  const successCount = history.filter((h) => h.success).length
  const successRate = total > 0 ? `${Math.round((successCount / total) * 100)}%` : '0%'

  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
  const activeMissions = dispatched.tasks.filter((t) => t.dispatchedAt > oneDayAgo).length

  const activeProjects = new Set(
    dispatched.tasks.filter((t) => t.dispatchedAt > oneDayAgo).map((t) => t.project)
  )
  const activeAgentsCount = Math.min(activeProjects.size + 1, 3)

  return { totalMissions: total, successRate, activeAgentsCount, activeMissions }
}
