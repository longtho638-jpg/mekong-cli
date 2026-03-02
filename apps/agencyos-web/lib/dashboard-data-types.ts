import type { Mission } from '@/components/mission-feed-table'

// Re-export Mission type for convenience
export type { Mission }

// --- Raw data shapes from openclaw-worker JSON files ---

export interface RawMissionHistory {
  timestamp: string
  project: string
  missionId: string
  duration: number
  success: boolean
  tokensUsed: number
}

export interface RawDispatchedTask {
  hash: string
  project: string
  pane: number
  chapter: string
  preview: string
  dispatchedAt: number
}

export interface DispatchedTasksFile {
  tasks: RawDispatchedTask[]
}

export interface MissionOutcome {
  taskId: string
  project: string
  result: string
  success: boolean
  elapsedSec: number
  summary: string
  filesChanged: number
  timestamp: string
}

// --- Exported domain types ---

export interface DashboardStats {
  totalMissions: number
  successRate: string
  activeAgentsCount: number
  activeMissions: number
}

export interface UsageRow {
  id: string
  date: string
  description: string
  mcu: number
}

export interface BillingData {
  totalMcu: number
  usageHistory: UsageRow[]
}

export interface Transaction {
  id: number
  date: string
  product: string
  amount: string
  status: string
}

export interface RevenueData {
  totalRevenue: number
  mrr: number
  activeSubscriptions: number
  transactions: Transaction[]
}

export interface AgentHealth {
  status: string
  uptime: string
}

export interface HealthApiResponse {
  brainAlive?: boolean
  uptime?: number
}
