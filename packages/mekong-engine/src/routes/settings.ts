import { Hono } from 'hono'
import type { Bindings } from '../index'
import type { Tenant } from '../types/raas'
import { authMiddleware } from '../raas/auth-middleware'
import { saveLLMSettings, getLLMSettings, deleteLLMSettings, maskApiKey, PROVIDER_PRESETS } from '../raas/tenant-settings'

type Variables = { tenant: Tenant }

const settingsRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>()

settingsRoutes.use('*', async (c, next) => {
  if (!c.env.DB) return c.json({ error: 'D1 database not configured' }, 503)
  if (!c.env.SERVICE_TOKEN) return c.json({ error: 'SERVICE_TOKEN not configured' }, 503)
  await next()
})
settingsRoutes.use('*', authMiddleware)

const VALID_PROVIDERS = ['openai', 'google', 'anthropic', 'custom']

// POST /v1/settings/llm — save LLM config
settingsRoutes.post('/llm', async (c) => {
  const body = await c.req.json<{ provider?: string; api_key?: string; base_url?: string; model?: string }>()

  if (!body.provider || !VALID_PROVIDERS.includes(body.provider)) {
    return c.json({ error: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(', ')}` }, 400)
  }
  if (!body.api_key?.trim()) {
    return c.json({ error: 'Missing api_key' }, 400)
  }
  if (body.provider === 'custom' && !body.base_url?.trim()) {
    return c.json({ error: 'base_url required for custom provider' }, 400)
  }

  const tenant = c.get('tenant')
  await saveLLMSettings(c.env.DB!, tenant.id, {
    provider: body.provider,
    apiKey: body.api_key,
    baseUrl: body.base_url,
    model: body.model,
  }, c.env.SERVICE_TOKEN!)

  return c.json({ ok: true, provider: body.provider, message: 'LLM settings saved' })
})

// GET /v1/settings/llm — get current config (masked key)
settingsRoutes.get('/llm', async (c) => {
  const tenant = c.get('tenant')
  const settings = await getLLMSettings(c.env.DB!, tenant.id, c.env.SERVICE_TOKEN!)

  if (!settings) {
    return c.json({ provider: 'workers-ai', api_key: null, base_url: null, model: null, message: 'Using default Workers AI' })
  }

  return c.json({
    provider: settings.provider,
    api_key: settings.apiKey ? maskApiKey(settings.apiKey) : null,
    base_url: settings.baseUrl || null,
    model: settings.model || null,
    available_providers: Object.keys(PROVIDER_PRESETS),
  })
})

// DELETE /v1/settings/llm — remove custom config, fallback to Workers AI
settingsRoutes.delete('/llm', async (c) => {
  const tenant = c.get('tenant')
  const deleted = await deleteLLMSettings(c.env.DB!, tenant.id)
  return c.json({ ok: true, deleted, message: deleted ? 'LLM settings removed, falling back to Workers AI' : 'No custom settings found' })
})

export { settingsRoutes }
