import type { CreditEntry } from '../types/raas'
import { CreditEntrySchema } from '../types/raas'

export async function getBalance(db: D1Database, tenantId: string): Promise<number> {
  const result = await db
    .prepare('SELECT COALESCE(SUM(amount), 0) as balance FROM credits WHERE tenant_id = ?')
    .bind(tenantId)
    .first<{ balance: number }>()
  return result?.balance ?? 0
}

export async function addCredits(
  db: D1Database,
  tenantId: string,
  amount: number,
  reason: string,
): Promise<number> {
  await db
    .prepare('INSERT INTO credits (tenant_id, amount, reason) VALUES (?, ?, ?)')
    .bind(tenantId, amount, reason)
    .run()
  return getBalance(db, tenantId)
}

export async function deductCredits(
  db: D1Database,
  tenantId: string,
  amount: number,
  reason: string,
): Promise<boolean> {
  const balance = await getBalance(db, tenantId)
  if (balance < amount) return false
  await db
    .prepare('INSERT INTO credits (tenant_id, amount, reason) VALUES (?, ?, ?)')
    .bind(tenantId, -amount, reason)
    .run()
  return true
}

export async function getHistory(
  db: D1Database,
  tenantId: string,
  limit = 50,
): Promise<CreditEntry[]> {
  const { results } = await db
    .prepare(
      'SELECT id, tenant_id, amount, COALESCE(reason, \'\') as reason, created_at FROM credits WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ?',
    )
    .bind(tenantId, limit)
    .all()
  return results.map((row) => CreditEntrySchema.parse(row))
}
