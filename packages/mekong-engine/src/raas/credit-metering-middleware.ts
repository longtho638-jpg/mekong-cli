import { createMiddleware } from 'hono/factory'
import type { Bindings } from '../index'
import type { Tenant } from '../types/raas'
import { checkRateLimit, recordUsage } from './rate-limiter'

type Variables = { tenant: Tenant; creditsUsed: number }

export const creditMeteringMiddleware = createMiddleware<{
  Bindings: Bindings
  Variables: Variables
}>(async (c, next) => {
  const tenant = c.get('tenant')
  if (!tenant) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Skip rate limiting if KV not configured
  if (!c.env.RATE_LIMIT_KV) {
    await next()
    return
  }

  const kv = c.env.RATE_LIMIT_KV
  const { allowed, dailyUsed, monthlyUsed, retryAfter } = await checkRateLimit(
    kv,
    tenant.id,
    tenant.tier,
  )

  if (!allowed) {
    if (retryAfter !== undefined) {
      c.header('Retry-After', String(retryAfter))
    }
    return c.json(
      { error: 'Rate limit exceeded', dailyUsed, monthlyUsed },
      429,
    )
  }

  await next()

  const creditsUsed = c.get('creditsUsed') ?? 1
  await recordUsage(kv, tenant.id, creditsUsed)
})
