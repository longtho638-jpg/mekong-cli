import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { taskRoutes } from './routes/tasks'
import { agentRoutes } from './routes/agents'
import { billingRoutes } from './routes/billing'

// Cloudflare bindings — all optional until resources created in dashboard
export type Bindings = {
  DB?: D1Database
  RATE_LIMIT_KV?: KVNamespace
  RECIPES?: R2Bucket
  AI?: Ai
  LLM_API_KEY?: string
  LLM_BASE_URL?: string
  SERVICE_TOKEN?: string
  POLAR_WEBHOOK_SECRET?: string
  ENVIRONMENT?: string
  DEFAULT_LLM_MODEL?: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Middleware
app.use('*', cors())

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    version: '3.0.0',
    engine: 'mekong-pev',
    runtime: 'cloudflare-workers',
    bindings: {
      d1: !!c.env.DB,
      kv: !!c.env.RATE_LIMIT_KV,
      r2: !!c.env.RECIPES,
      ai: !!c.env.AI,
      llm: !!c.env.LLM_API_KEY,
    },
  })
})

// PEV Engine routes
app.post('/cmd', async (c) => {
  if (!c.env.AI && !c.env.LLM_API_KEY) return c.json({ error: 'No LLM provider configured (need AI binding or LLM_API_KEY)' }, 503)

  const { RecipeOrchestrator } = await import('./core/recipe-orchestrator')
  const body = await c.req.json<{ goal: string }>()
  if (!body.goal) return c.json({ error: 'Missing goal' }, 400)

  const orchestrator = new RecipeOrchestrator({
    ai: c.env.AI,
    llmApiKey: c.env.LLM_API_KEY,
    llmBaseUrl: c.env.LLM_BASE_URL ?? 'https://api.openai.com/v1',
    model: c.env.DEFAULT_LLM_MODEL ?? '@cf/meta/llama-3.1-8b-instruct',
  })

  const result = await orchestrator.runFromGoal(body.goal)
  return c.json(result)
})

// Direct Workers AI test
app.get('/ai/test', async (c) => {
  if (!c.env.AI) return c.json({ error: 'AI binding not available' }, 503)
  try {
    const result = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'user', content: 'Say hello in Vietnamese in one sentence' }],
      max_tokens: 100,
    })
    return c.json({ ok: true, result })
  } catch (err) {
    return c.json({ ok: false, error: String(err) }, 500)
  }
})

// RaaS routes — Phase 3-5
app.route('/v1/tasks', taskRoutes)
app.route('/v1/agents', agentRoutes)
app.route('/billing', billingRoutes)

export default app
