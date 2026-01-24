import { logger } from '@/lib/utils/logger'

const AGENTOPS_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface WorkflowNode {
  id: string
  type: string
  config: Record<string, unknown>
  next_nodes: string[]
  position: { x: number; y: number }
  data?: { label: string } // For React Flow
}

export interface Workflow {
  id: string
  name: string
  trigger: string
  trigger_config: Record<string, unknown>
  nodes: WorkflowNode[]
  active: boolean
}

export interface WorkflowSummary {
  id: string
  name: string
  active: boolean
  trigger: string
}

export async function listWorkflows(): Promise<WorkflowSummary[]> {
  try {
    const response = await fetch(`${AGENTOPS_API}/workflow/list`)
    if (!response.ok) throw new Error('Failed to fetch workflows')
    return await response.json()
  } catch (error) {
    logger.error('Workflow API error', error)
    return []
  }
}

export async function saveWorkflow(workflow: Workflow): Promise<unknown> {
  try {
    const response = await fetch(`${AGENTOPS_API}/workflow/${workflow.id}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workflow),
    })
    if (!response.ok) throw new Error('Failed to save workflow')
    return await response.json()
  } catch (error) {
    logger.error('Workflow API error', error)
    return null
  }
}

export async function executeWorkflow(id: string): Promise<unknown> {
  try {
    const response = await fetch(`${AGENTOPS_API}/workflow/${id}/execute`, {
      method: 'POST',
    })
    if (!response.ok) throw new Error('Failed to execute workflow')
    return await response.json()
  } catch (error) {
    logger.error('Workflow API error', error)
    return null
  }
}
