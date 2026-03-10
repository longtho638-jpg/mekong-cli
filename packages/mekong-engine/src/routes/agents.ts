import { Hono } from 'hono'
import type { Bindings } from '../index'
import type { Tenant } from '../types/raas'
import { authMiddleware } from '../raas/auth-middleware'

type Variables = { tenant: Tenant }

const AVAILABLE_AGENTS = [
  { name: 'git', description: 'Git operations: status, diff, log, commit, branch' },
  { name: 'file', description: 'File operations: find, read, tree, stats, grep' },
  { name: 'shell', description: 'Shell command execution' },
  { name: 'lead-hunter', description: 'Company and CEO lead discovery' },
  { name: 'content-writer', description: 'Content generation' },
  { name: 'recipe-crawler', description: 'Recipe file discovery' },
]

const agentRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>()

agentRoutes.get('/', (c) => c.json({ agents: AVAILABLE_AGENTS }))

agentRoutes.post('/:name/run', authMiddleware, async (c) => {
  const name = c.req.param('name')
  const agent = AVAILABLE_AGENTS.find((a) => a.name === name)
  if (!agent) return c.json({ error: `Agent '${name}' not found` }, 404)

  const body = await c.req.json<{ command: string; params?: Record<string, unknown> }>()
  if (!body.command?.trim()) return c.json({ error: 'Missing command' }, 400)

  // Agents are executed via the PEV orchestrator in the core engine
  return c.json({
    agent: name,
    command: body.command,
    status: 'accepted',
    message: 'Agent execution queued — use /v1/tasks to track progress',
  }, 202)
})

export { agentRoutes }
