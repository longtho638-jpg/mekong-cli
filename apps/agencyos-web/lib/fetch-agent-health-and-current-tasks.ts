import { readJson } from './dashboard-data-helpers'
import type { DispatchedTasksFile, AgentHealth, HealthApiResponse } from './dashboard-data-types'

export type { AgentHealth }

export async function getAgentHealthStatus(): Promise<Record<string, AgentHealth>> {
  const defaults: Record<string, AgentHealth> = {
    'tom-hum':     { status: 'online', uptime: 'N/A' },
    'cc-cli':      { status: 'busy',   uptime: 'N/A' },
    'antigravity': { status: 'online', uptime: 'N/A' },
  }

  try {
    const res = await fetch('http://localhost:9090/health', {
      signal: AbortSignal.timeout(2000),
      cache: 'no-store',
    })
    if (res.ok) {
      const health = (await res.json()) as HealthApiResponse
      if (health.brainAlive !== undefined) {
        defaults['cc-cli'].status = health.brainAlive ? 'online' : 'offline'
      }
      if (health.uptime !== undefined) {
        const hrs = Math.round(health.uptime / 3600)
        defaults['tom-hum'].uptime = `${hrs}h uptime`
      }
    }
  } catch {
    // Health endpoint not available — use defaults
  }

  return defaults
}

export async function getAgentCurrentTasks(): Promise<Record<string, string>> {
  const dispatched = await readJson<DispatchedTasksFile>('dispatched-tasks.json', { tasks: [] })

  const result: Record<string, string> = {
    'tom-hum':     'Watching tasks/ directory for new missions',
    'cc-cli':      'Idle — waiting for next mission',
    'antigravity': 'Monitoring mission queue',
  }

  if (dispatched.tasks.length === 0) return result

  const sorted = [...dispatched.tasks].sort((a, b) => b.dispatchedAt - a.dispatchedAt)
  const latest = sorted[0]
  if (latest) {
    const preview = latest.preview.slice(0, 80) + (latest.preview.length > 80 ? '…' : '')
    result['cc-cli']  = `[${latest.project}] ${preview}`
    result['tom-hum'] = `Dispatched ${sorted.length} tasks — last: ${latest.chapter}`
  }

  return result
}
