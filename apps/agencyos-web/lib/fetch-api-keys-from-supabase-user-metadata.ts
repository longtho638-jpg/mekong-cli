import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'

export type KeyStatus = 'active' | 'revoked'

export interface ApiKeyRecord {
  id: string
  name: string
  maskedKey: string
  createdAt: string
  status: KeyStatus
}

/**
 * Derive a deterministic masked API key from userId + seed.
 * Produces a stable display value without storing a real secret.
 */
function deriveMaskedKey(userId: string, seed: string): string {
  const hash = createHash('sha256').update(`${userId}:${seed}`).digest('hex')
  const prefix = seed.slice(0, 4).toLowerCase().replace(/[^a-z0-9]/g, 'x')
  const tail = hash.slice(-4)
  return `sk-${prefix}-****-****-${tail}`
}

/**
 * Read API keys stored in Supabase user metadata (key: `api_keys`).
 * Falls back to a single deterministic key derived from the user ID
 * if no keys are stored yet — avoids empty state on first load.
 */
export async function fetchApiKeysForCurrentUser(): Promise<ApiKeyRecord[]> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return []
    }

    // Check if user metadata has stored api_keys array
    const stored = user.user_metadata?.api_keys as ApiKeyRecord[] | undefined
    if (Array.isArray(stored) && stored.length > 0) {
      return stored
    }

    // No stored keys — derive a single default key from user ID
    const createdAt = user.created_at
      ? new Date(user.created_at).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]

    return [
      {
        id: `dk-${user.id.slice(0, 8)}`,
        name: 'Default',
        maskedKey: deriveMaskedKey(user.id, 'default'),
        createdAt,
        status: 'active',
      },
    ]
  } catch {
    return []
  }
}
