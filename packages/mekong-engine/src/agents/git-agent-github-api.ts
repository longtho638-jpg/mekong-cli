/**
 * Git Agent — performs git operations via GitHub REST API.
 * Mirrors Python: src/agents/git_agent.py
 * CF Workers: no subprocess/git binary, uses fetch() to GitHub API.
 */

import type { AgentBase, Result, Task } from '../types/agent'

type GitCommand = 'status' | 'log' | 'diff'

function parseGitCommand(input: string): { command: GitCommand; args: string } {
  const parts = input.trim().split(/\s+/)
  const cmd = (parts[0] ?? 'status') as GitCommand
  const args = parts.slice(1).join(' ')
  return { command: cmd, args }
}

export class GitAgent implements AgentBase {
  name = 'git-agent'
  description = 'Performs git status/log/diff via GitHub REST API'

  private owner: string
  private repo: string
  private token: string
  private baseUrl = 'https://api.github.com'

  constructor(opts: { owner: string; repo: string; token: string }) {
    this.owner = opts.owner
    this.repo = opts.repo
    this.token = opts.token
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    }
  }

  async plan(input: string): Promise<Task[]> {
    const { command, args } = parseGitCommand(input)
    return [
      {
        id: `git_${command}`,
        description: `git ${command} ${args}`.trim(),
        status: 'pending',
        params: { command, args },
      },
    ]
  }

  async execute(tasks: Task[]): Promise<Result[]> {
    const results: Result[] = []

    for (const task of tasks) {
      try {
        const command = task.params['command'] as GitCommand
        const repoBase = `${this.baseUrl}/repos/${this.owner}/${this.repo}`

        if (command === 'status') {
          const resp = await fetch(`${repoBase}`, { headers: this.headers })
          const data = await resp.json() as Record<string, unknown>
          results.push({ task_id: task.id, success: resp.ok, output: { default_branch: data['default_branch'], private: data['private'] } })
        } else if (command === 'log') {
          const resp = await fetch(`${repoBase}/commits?per_page=10`, { headers: this.headers })
          const data = await resp.json() as Array<Record<string, unknown>>
          const commits = Array.isArray(data) ? data.map((c) => ({
            sha: (c['sha'] as string | undefined)?.slice(0, 7),
            message: ((c['commit'] as Record<string, unknown> | undefined)?.['message'] as string | undefined)?.split('\n')[0],
          })) : []
          results.push({ task_id: task.id, success: resp.ok, output: { commits } })
        } else {
          const resp = await fetch(`${repoBase}/compare/HEAD~1...HEAD`, { headers: this.headers })
          const data = await resp.json() as Record<string, unknown>
          results.push({ task_id: task.id, success: resp.ok, output: { files: data['files'], status: data['status'] } })
        }
      } catch (err) {
        results.push({ task_id: task.id, success: false, error: String(err) })
      }
    }

    return results
  }

  async verify(results: Result[]): Promise<boolean> {
    return results.every((r) => r.success)
  }
}
