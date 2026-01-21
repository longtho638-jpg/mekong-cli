import { logger } from '@/lib/utils/logger'

const AGENTOPS_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface SystemStatus {
  status: 'healthy' | 'warning' | 'error' | 'unknown'
  message: string
  last_check: string
  details: Record<string, any>
}

export interface Anomaly {
  system: string
  type: string
  message: string
  severity: string
  recovery_action: string | null
}

export interface DashboardResponse {
  timestamp: string
  systems: Record<string, SystemStatus>
  anomalies: Anomaly[]
  summary: string
}

export async function getSystemStatus(): Promise<DashboardResponse | null> {
  try {
    const response = await fetch(`${AGENTOPS_API}/monitor/status`)
    if (!response.ok) throw new Error('Failed to fetch system status')
    return await response.json()
  } catch (error) {
    logger.error('Monitor API error', error)
    return null
  }
}
