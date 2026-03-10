import type { Tenant } from '../types/raas'
import { TenantSchema } from '../types/raas'

async function hashApiKey(key: string): Promise<string> {
  const encoded = new TextEncoder().encode(key)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

function generateApiKey(): string {
  return `mk_${crypto.randomUUID().replace(/-/g, '')}`
}

export async function createTenant(
  db: D1Database,
  name: string,
): Promise<{ tenant: Tenant; apiKey: string }> {
  const id = crypto.randomUUID()
  const apiKey = generateApiKey()
  const apiKeyHash = await hashApiKey(apiKey)
  const now = new Date().toISOString()

  await db
    .prepare('INSERT INTO tenants (id, name, api_key_hash, tier, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(id, name, apiKeyHash, 'free', now)
    .run()

  const tenant = TenantSchema.parse({ id, name, api_key_hash: apiKeyHash, tier: 'free', created_at: now })
  return { tenant, apiKey }
}

export async function getByApiKey(db: D1Database, key: string): Promise<Tenant | null> {
  const hash = await hashApiKey(key)
  const row = await db
    .prepare('SELECT id, name, api_key_hash, tier, created_at FROM tenants WHERE api_key_hash = ?')
    .bind(hash)
    .first()
  if (!row) return null
  return TenantSchema.parse(row)
}

export async function listTenants(db: D1Database): Promise<Tenant[]> {
  const { results } = await db
    .prepare('SELECT id, name, api_key_hash, tier, created_at FROM tenants ORDER BY created_at DESC')
    .all()
  return results.map((row) => TenantSchema.parse(row))
}

export async function regenerateApiKey(
  db: D1Database,
  tenantId: string,
  name: string,
): Promise<{ apiKey: string } | null> {
  // Verify tenant exists and name matches (basic ownership proof)
  const row = await db
    .prepare('SELECT id FROM tenants WHERE id = ? AND name = ?')
    .bind(tenantId, name)
    .first()
  if (!row) return null

  const newApiKey = generateApiKey()
  const newHash = await hashApiKey(newApiKey)
  await db
    .prepare('UPDATE tenants SET api_key_hash = ? WHERE id = ?')
    .bind(newHash, tenantId)
    .run()
  return { apiKey: newApiKey }
}

export async function deactivateTenant(db: D1Database, tenantId: string): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM tenants WHERE id = ?')
    .bind(tenantId)
    .run()
  return (result.meta.changes ?? 0) > 0
}
