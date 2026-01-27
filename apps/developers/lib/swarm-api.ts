import { logger } from '@/lib/utils/logger'

const AGENTOPS_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface AgentMessage {
  id: string
  timestamp: string
  sender: string
  recipient: string
  type: 'task' | 'result' | 'query' | 'response' | 'handoff' | 'error'
  content: unknown
  context_id?: string
  metadata: Record<string, unknown>
}

export interface SwarmDispatchResponse {
  status: string
  target: string
  message?: string
}

export async function dispatchSwarmTask(content: string, type: 'dev' | 'growth' = 'dev'): Promise<SwarmDispatchResponse | null> {
  try {
    const response = await fetch(`${AGENTOPS_API}/swarm/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, swarm_type: type }),
    })
    if (!response.ok) throw new Error('Failed to dispatch task')
    return await response.json()
  } catch (error) {
    logger.error('Swarm API error', error)
    return null
  }
}

export async function getSwarmHistory(): Promise<AgentMessage[]> {
  try {
    const response = await fetch(`${AGENTOPS_API}/swarm/history`)
    if (!response.ok) throw new Error('Failed to fetch history')
    return await response.json()
  } catch (error) {
    logger.error('Swarm API error', error)
    return []
  }
}
