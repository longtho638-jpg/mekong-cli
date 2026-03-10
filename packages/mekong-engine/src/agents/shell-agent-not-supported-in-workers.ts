/**
 * Shell Agent — shell command execution stub for Cloudflare Workers.
 * Mirrors Python: src/agents/shell_agent.py
 * CF Workers: subprocess NOT available. Returns a not-supported error
 * unless an external runner API URL is configured (optional delegation).
 */

import type { AgentBase, Result, Task } from '../types/agent'

export class ShellAgent implements AgentBase {
  name = 'shell-agent'
  description = 'Proxies shell commands to an external runner API (subprocess unavailable in CF Workers)'

  private runnerUrl: string | undefined

  constructor(opts: { runnerUrl?: string } = {}) {
    this.runnerUrl = opts.runnerUrl
  }

  async plan(input: string): Promise<Task[]> {
    return [
      {
        id: 'shell_exec',
        description: `Execute shell command: ${input}`,
        status: 'pending',
        params: { command: input },
      },
    ]
  }

  async execute(tasks: Task[]): Promise<Result[]> {
    const results: Result[] = []

    for (const task of tasks) {
      const command = typeof task.params['command'] === 'string' ? task.params['command'] : ''

      if (!this.runnerUrl) {
        results.push({
          task_id: task.id,
          success: false,
          error: 'Shell execution is not supported in Cloudflare Workers. Configure runnerUrl to delegate to an external runner.',
        })
        continue
      }

      try {
        const resp = await fetch(this.runnerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command }),
        })
        const data = await resp.json() as Record<string, unknown>
        results.push({ task_id: task.id, success: resp.ok, output: data })
      } catch (err) {
        results.push({ task_id: task.id, success: false, error: String(err) })
      }
    }

    return results
  }

  async verify(_results: Result[]): Promise<boolean> {
    return true
  }
}
