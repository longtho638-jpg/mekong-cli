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

// Polar product → credit mapping (match Polar.sh product names)
const POLAR_PRODUCT_CREDITS: Record<string, number> = {
  'agencyos-starter': 50,
  'agencyos-pro': 200,
  'agencyos-agency': 500,
  'agencyos-master': 1000,
  'credits-10': 10,
  'credits-50': 50,
  'credits-100': 100,
}

// Polar tier → tenant tier mapping
const POLAR_TIER_MAP: Record<string, string> = {
  'agencyos-starter': 'pro',
  'agencyos-pro': 'pro',
  'agencyos-agency': 'enterprise',
  'agencyos-master': 'enterprise',
}

billingRoutes.post('/webhook', async (c) => {
  if (!c.env.DB) return c.json({ error: 'D1 not configured' }, 503)
  const db = c.env.DB
  const secret = c.env.POLAR_WEBHOOK_SECRET ?? ''
  const signature = c.req.header('webhook-signature') ?? ''
  const rawBody = await c.req.text()

  // Verify webhook signature if secret configured
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: { type: string; data?: any }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }

  const data = event.data ?? {} as Record<string, any>

  if (event.type === 'order.paid') {
    // Support both: direct tenant_id/credits OR Polar product mapping
    const tenantId: string | undefined =
      data.tenant_id ?? data.metadata?.tenant_id ?? data.customer?.external_id
    if (!tenantId) return c.json({ error: 'No tenant_id in webhook payload' }, 400)

    const productName: string = data.product_name ?? data.product?.name ?? ''
    const productKey = productName.toLowerCase().replace(/\s+/g, '-')
    const mappedCredits = POLAR_PRODUCT_CREDITS[productKey]
    const credits: number = mappedCredits ?? data.credits ?? 0

    if (credits > 0) {
      const reason = mappedCredits
        ? `Polar.sh: ${productName} (${credits} credits)`
        : `Polar.sh purchase: ${credits} credits`
      await addCredits(db, tenantId, credits, reason)
    }

    // Upgrade tenant tier if subscription product
    const newTier = POLAR_TIER_MAP[productKey]
    if (newTier) {
      await db.prepare('UPDATE tenants SET tier = ? WHERE id = ?').bind(newTier, tenantId).run()
    }
  }

  if (event.type === 'subscription.canceled') {
    const tenantId: string | undefined = data.customer?.external_id ?? data.tenant_id
    if (tenantId) {
      await db.prepare('UPDATE tenants SET tier = ? WHERE id = ?').bind('free', tenantId).run()
    }
  }

  return c.json({ received: true })
})

// Public pricing info — landing page + dashboard can fetch this
billingRoutes.get('/pricing', async (c) => {
  return c.json({
    tiers: [
      { id: 'free', name: 'Free', price: 0, credits: 10, description: 'Try it out' },
      { id: 'agencyos-starter', name: 'Starter', price: 29, credits: 50, description: 'Solo non-tech user' },
      { id: 'agencyos-pro', name: 'Pro', price: 99, credits: 200, description: 'Small agency' },
      { id: 'agencyos-agency', name: 'Agency', price: 199, credits: 500, description: 'Growing agency' },
      { id: 'agencyos-master', name: 'Master', price: 399, credits: 1000, description: 'Premium agency' },
    ],
    credit_packs: [
      { id: 'credits-10', credits: 10, price: 5 },
      { id: 'credits-50', credits: 50, price: 20 },
      { id: 'credits-100', credits: 100, price: 35 },
    ],
    credit_costs: { simple: 1, standard: 3, complex: 5 },
  })
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
