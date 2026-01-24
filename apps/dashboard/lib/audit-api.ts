import { logger } from '@/lib/utils/logger'

const AGENTOPS_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface AuditLog {
  timestamp: string
  event_type: string
  user: string
  action: string
  resource: string
  status: string
  details: Record<string, unknown>
}

export async function getAuditLogs(token: string): Promise<AuditLog[]> {
  try {
    const response = await fetch(`${AGENTOPS_API}/audit/logs`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (!response.ok) throw new Error('Failed to fetch audit logs')
    return await response.json()
  } catch (error) {
    logger.error('Audit API error', error)
    return []
  }
}
