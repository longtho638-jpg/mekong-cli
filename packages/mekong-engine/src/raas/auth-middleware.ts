import { createMiddleware } from 'hono/factory'
import type { Bindings } from '../index'
import type { Tenant } from '../types/raas'
import { getByApiKey } from './tenant'

type Variables = { tenant: Tenant }

export const authMiddleware = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(
  async (c, next) => {
    const authHeader = c.req.header('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid Authorization header' }, 401)
    }

    const apiKey = authHeader.slice(7).trim()
    if (!apiKey) {
      return c.json({ error: 'Empty API key' }, 401)
    }

    if (!c.env.DB) return c.json({ error: 'D1 not configured' }, 503)
    const tenant = await getByApiKey(c.env.DB, apiKey)
    if (!tenant) {
      return c.json({ error: 'Invalid API key' }, 401)
    }

    c.set('tenant', tenant)
    await next()
  },
)
