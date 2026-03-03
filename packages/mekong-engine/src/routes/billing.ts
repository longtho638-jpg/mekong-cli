import { Hono } from 'hono'
import type { Bindings } from '../index'
import type { Tenant } from '../types/raas'
import { authMiddleware } from '../raas/auth-middleware'
import { getBalance, getHistory, addCredits } from '../raas/credits'
import { createTenant, regenerateApiKey } from '../raas/tenant'

type Variables = { tenant: Tenant }

const billingRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Create tenant — returns API key (one-time display)
billingRoutes.post('/tenants', async (c) => {
  if (!c.env.DB) return c.json({ error: 'D1 not configured' }, 503)
  const body = await c.req.json<{ name?: string }>()
  if (!body.name?.trim()) return c.json({ error: 'Missing name' }, 400)
  const { tenant, apiKey } = await createTenant(c.env.DB, body.name)
  // Grant 10 free welcome credits so user can start immediately
  await addCredits(c.env.DB, tenant.id, 10, 'welcome: free tier bonus')
  return c.json({
    tenant_id: tenant.id, name: tenant.name, api_key: apiKey, tier: tenant.tier,
    credits: 10, message: 'Save your API key — it cannot be recovered if lost!',
  }, 201)
})

// Regenerate API key — requires tenant_id + name as ownership proof
billingRoutes.post('/tenants/regenerate-key', async (c) => {
  if (!c.env.DB) return c.json({ error: 'D1 not configured' }, 503)
  const body = await c.req.json<{ tenant_id?: string; name?: string }>()
  if (!body.tenant_id?.trim() || !body.name?.trim()) {
    return c.json({ error: 'Both tenant_id and name are required' }, 400)
  }
  const result = await regenerateApiKey(c.env.DB, body.tenant_id, body.name)
  if (!result) return c.json({ error: 'Tenant not found or name mismatch' }, 404)
  return c.json({
    api_key: result.apiKey,
    message: 'New API key generated. Old key is now invalid. Save this key!',
  })
})

billingRoutes.post('/webhook', async (c) => {
  if (!c.env.DB) return c.json({ error: 'D1 not configured' }, 503)
  const db = c.env.DB
  const secret = c.env.POLAR_WEBHOOK_SECRET ?? ''
  const signature = c.req.header('webhook-signature') ?? ''
  const rawBody = await c.req.text()

  if (secret) {
    const keyData = new TextEncoder().encode(secret)
    const msgData = new TextEncoder().encode(rawBody)
    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    )
    const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData)
    const expectedSig = Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    if (signature !== expectedSig) {
      return c.json({ error: 'Invalid webhook signature' }, 401)
    }
  }

  const event = JSON.parse(rawBody) as { type: string; data?: { tenant_id?: string; credits?: number; reason?: string } }

  if (event.type === 'order.paid' && event.data?.tenant_id) {
    const { tenant_id, credits = 0, reason = 'Polar.sh purchase' } = event.data
    await addCredits(db, tenant_id, credits, reason)
  }

  return c.json({ received: true })
})

billingRoutes.get('/credits', authMiddleware, async (c) => {
  if (!c.env.DB) return c.json({ error: 'D1 not configured' }, 503)
  const tenant = c.get('tenant')
  const balance = await getBalance(c.env.DB, tenant.id)
  return c.json({ tenant_id: tenant.id, balance, tier: tenant.tier })
})

billingRoutes.get('/credits/history', authMiddleware, async (c) => {
  if (!c.env.DB) return c.json({ error: 'D1 not configured' }, 503)
  const tenant = c.get('tenant')
  const limit = Math.min(Math.max(parseInt(c.req.query('limit') ?? '50', 10) || 50, 1), 200)
  const history = await getHistory(c.env.DB, tenant.id, limit)
  return c.json({ tenant_id: tenant.id, history, limit })
})

export { billingRoutes }
