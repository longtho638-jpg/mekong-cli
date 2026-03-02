import fs from 'fs/promises'
import path from 'path'

// Absolute path to openclaw-worker data directory
export const DATA_DIR = path.resolve(process.cwd(), '../../apps/openclaw-worker/data')

/**
 * Read and parse a JSON file from DATA_DIR with a typed fallback on error.
 */
export async function readJson<T>(filename: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, filename), 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/** Return last 8 chars of a missionId as a short display ID. */
export function missionIdShort(missionId: string): string {
  return missionId.slice(-8)
}

/** Map project slug to responsible agent name. */
export function projectToAgent(project: string): string {
  const map: Record<string, string> = {
    '84tea': 'Tôm Hùm',
    'sophia': 'CC CLI',
    'well': 'Tôm Hùm',
    'apex': 'Antigravity',
    'algo-trader': 'CC CLI',
    'anima': 'Tôm Hùm',
  }
  return map[project] ?? 'Tôm Hùm'
}
