import { logger } from '@/lib/utils/logger'

const AGENTOPS_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface AgentDefinition {
  name: string
  role: string
  description: string
  skills: string[]
  tools: string[]
  model: string
}

export interface CreateAgentResponse {
  success: boolean
  agent_id?: string
  message?: string
}

export async function getAvailableSkills(): Promise<string[]> {
  try {
    const response = await fetch(`${AGENTOPS_API}/agents-creator/skills`)
    if (!response.ok) throw new Error('Failed to fetch skills')
    return await response.json()
  } catch (error) {
    logger.error('Agent API error', error)
    return []
  }
}

export async function createAgent(agent: AgentDefinition): Promise<CreateAgentResponse | null> {
  try {
    const response = await fetch(`${AGENTOPS_API}/agents-creator/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agent),
    })
    if (!response.ok) throw new Error('Failed to create agent')
    return await response.json()
  } catch (error) {
    logger.error('Agent API error', error)
    return null
  }
}
