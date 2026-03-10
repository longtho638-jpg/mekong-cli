type TierLimits = { daily: number; monthly: number }

const TIER_LIMITS: Record<string, TierLimits> = {
  free:       { daily: 10,  monthly: 100 },
  starter:    { daily: 50,  monthly: 500 },
  growth:     { daily: 200, monthly: 2000 },
  pro:        { daily: 500, monthly: 5000 },
  enterprise: { daily: 0,   monthly: 0 },
}

function todayKey(tenantId: string): string {
  const d = new Date().toISOString().slice(0, 10)
  return `rl:${tenantId}:${d}`
}

function monthKey(tenantId: string): string {
  const m = new Date().toISOString().slice(0, 7)
  return `rl:${tenantId}:m:${m}`
}

async function getCount(kv: KVNamespace, key: string): Promise<number> {
  const val = await kv.get(key)
  return val ? parseInt(val, 10) : 0
}

export async function checkRateLimit(
  kv: KVNamespace,
  tenantId: string,
  tier: string,
): Promise<{ allowed: boolean; dailyUsed: number; monthlyUsed: number; retryAfter?: number }> {
  const limits = TIER_LIMITS[tier] ?? TIER_LIMITS['free']!
  const [dailyUsed, monthlyUsed] = await Promise.all([
    getCount(kv, todayKey(tenantId)),
    getCount(kv, monthKey(tenantId)),
  ])

  // 0 = unlimited (enterprise)
  if (limits.daily !== 0 && dailyUsed >= limits.daily) {
    const secondsUntilMidnight = 86400 - (Date.now() / 1000 % 86400)
    return { allowed: false, dailyUsed, monthlyUsed, retryAfter: Math.ceil(secondsUntilMidnight) }
  }
  if (limits.monthly !== 0 && monthlyUsed >= limits.monthly) {
    return { allowed: false, dailyUsed, monthlyUsed, retryAfter: 86400 }
  }

  return { allowed: true, dailyUsed, monthlyUsed }
}

export async function recordUsage(
  kv: KVNamespace,
  tenantId: string,
  creditsUsed: number,
): Promise<void> {
  const dKey = todayKey(tenantId)
  const mKey = monthKey(tenantId)
  const [daily, monthly] = await Promise.all([
    getCount(kv, dKey),
    getCount(kv, mKey),
  ])
  // TTL: daily key expires in 2 days, monthly in 35 days
  await Promise.all([
    kv.put(dKey, String(daily + creditsUsed), { expirationTtl: 172800 }),
    kv.put(mKey, String(monthly + creditsUsed), { expirationTtl: 3024000 }),
  ])
}
