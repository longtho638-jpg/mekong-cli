/**
 * Agent runner — wraps plan→execute→verify with retry.
 * Mirrors Python: src/core/agent_base.py orchestration loop.
 */

import type { AgentBase, Result, Task } from '../types/agent'

export interface RunOptions {
  maxRetries?: number
}

export interface RunResult {
  results: Result[]
  retries: number
  verified: boolean
}

export async function runAgent(
  agent: AgentBase,
  input: string,
  opts: RunOptions = {},
): Promise<RunResult> {
  const maxRetries = opts.maxRetries ?? 3
  const tasks: Task[] = await agent.plan(input)
  let results: Result[] = []
  let retries = 0
  let verified = false

  while (retries < maxRetries) {
    results = await agent.execute(tasks)
    verified = await agent.verify(results)
    if (verified) break
    retries++
  }

  return { results, retries, verified }
}
