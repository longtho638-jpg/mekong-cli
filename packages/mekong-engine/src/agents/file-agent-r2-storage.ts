/**
 * File Agent — list/read/write files via Cloudflare R2 bucket.
 * Mirrors Python: src/agents/file_agent.py
 * CF Workers: no fs/path, all operations go through R2Bucket API.
 */

import type { AgentBase, Result, Task } from '../types/agent'

type FileCommand = 'list' | 'read' | 'write' | 'stats'

function parseCommand(input: string): { command: FileCommand; path: string; content?: string } {
  const parts = input.trim().split(/\s+/)
  const cmd = (parts[0] ?? 'list') as FileCommand
  const path = parts[1] ?? ''
  const content = parts.slice(2).join(' ')
  return { command: cmd, path, content: content || undefined }
}

export class FileAgent implements AgentBase {
  name = 'file-agent'
  description = 'Performs list/read/write/stats operations on files stored in R2 bucket'

  private r2: R2Bucket

  constructor(r2: R2Bucket) {
    this.r2 = r2
  }

  async plan(input: string): Promise<Task[]> {
    const { command, path, content } = parseCommand(input)
    return [
      {
        id: `file_${command}`,
        description: `${command} ${path}`,
        status: 'pending',
        params: { command, path, content: content ?? '' },
      },
    ]
  }

  async execute(tasks: Task[]): Promise<Result[]> {
    const results: Result[] = []

    for (const task of tasks) {
      try {
        const command = task.params['command'] as FileCommand
        const path = typeof task.params['path'] === 'string' ? task.params['path'] : ''
        const content = typeof task.params['content'] === 'string' ? task.params['content'] : ''

        if (command === 'list') {
          const listed = await this.r2.list({ prefix: path || undefined })
          results.push({ task_id: task.id, success: true, output: { files: listed.objects.map((o) => o.key) } })
        } else if (command === 'read') {
          const obj = await this.r2.get(path)
          const text = obj ? await obj.text() : null
          results.push({ task_id: task.id, success: !!obj, output: { content: text }, error: obj ? undefined : `Not found: ${path}` })
        } else if (command === 'write') {
          await this.r2.put(path, content)
          results.push({ task_id: task.id, success: true, output: { path, bytes: content.length } })
        } else {
          const obj = await this.r2.head(path)
          results.push({ task_id: task.id, success: !!obj, output: { path, size: obj?.size ?? 0, etag: obj?.etag ?? '' } })
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
