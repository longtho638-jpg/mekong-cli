import type { Mission, MissionStatus } from '../types/raas'
import { MissionSchema, CREDIT_TIERS } from '../types/raas'

const MAX_GOAL_LENGTH = 2000

function sanitizeGoal(goal: string): string {
  return goal.slice(0, MAX_GOAL_LENGTH).trim()
}

function detectComplexity(goal: string): keyof typeof CREDIT_TIERS {
  if (goal.length < 50) return 'simple'
  if (goal.length < 150) return 'standard'
  return 'complex'
}

export function estimateCredits(goal: string): number {
  return CREDIT_TIERS[detectComplexity(goal)]
}

export async function createMission(
  db: D1Database,
  tenantId: string,
  goal: string,
  creditsUsed: number,
): Promise<Mission> {
  const id = crypto.randomUUID()
  const safeGoal = sanitizeGoal(goal)
  const now = new Date().toISOString()

  await db
    .prepare(
      'INSERT INTO missions (id, tenant_id, goal, status, credits_used, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    )
    .bind(id, tenantId, safeGoal, 'pending', creditsUsed, now)
    .run()

  return MissionSchema.parse({
    id, tenant_id: tenantId, goal: safeGoal,
    status: 'pending', credits_used: creditsUsed,
    total_steps: 0, completed_steps: 0, created_at: now,
  })
}

export async function getMission(
  db: D1Database,
  missionId: string,
  tenantId: string,
): Promise<Mission | null> {
  const row = await db
    .prepare('SELECT * FROM missions WHERE id = ? AND tenant_id = ?')
    .bind(missionId, tenantId)
    .first()
  if (!row) return null
  return MissionSchema.parse({ total_steps: 0, completed_steps: 0, ...row })
}

export async function listMissions(
  db: D1Database,
  tenantId: string,
  limit = 20,
  offset = 0,
): Promise<Mission[]> {
  const { results } = await db
    .prepare('SELECT * FROM missions WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .bind(tenantId, limit, offset)
    .all()
  return results.map((row) => MissionSchema.parse({ total_steps: 0, completed_steps: 0, ...row }))
}

export async function updateMissionStatus(
  db: D1Database,
  missionId: string,
  status: MissionStatus,
  result?: string,
): Promise<void> {
  const completedAt = (status === 'completed' || status === 'failed')
    ? new Date().toISOString()
    : null

  if (result !== undefined) {
    await db
      .prepare('UPDATE missions SET status = ?, result = ?, completed_at = ? WHERE id = ?')
      .bind(status, result, completedAt, missionId)
      .run()
  } else {
    await db
      .prepare('UPDATE missions SET status = ?, completed_at = ? WHERE id = ?')
      .bind(status, completedAt, missionId)
      .run()
  }
}
