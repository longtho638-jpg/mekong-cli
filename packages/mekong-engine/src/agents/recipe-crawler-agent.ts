/**
 * Recipe Crawler Agent — lists and parses recipe files from R2 bucket.
 * Mirrors Python: src/agents/recipe_crawler.py
 * CF Workers: no filesystem, uses R2Bucket for storage operations.
 */

import type { AgentBase, Result, Task } from '../types/agent'

export class RecipeCrawlerAgent implements AgentBase {
  name = 'recipe-crawler'
  description = 'Discovers and parses recipe files stored in Cloudflare R2 bucket'

  private r2: R2Bucket

  constructor(r2: R2Bucket) {
    this.r2 = r2
  }

  async plan(input: string): Promise<Task[]> {
    return [
      { id: 'list_recipes', description: 'List all recipes from R2', status: 'pending', params: { prefix: input } },
      { id: 'filter_results', description: `Filter recipes matching: ${input}`, status: 'pending', params: { query: input } },
      { id: 'parse_selected', description: 'Parse selected recipe content', status: 'pending', params: { query: input } },
    ]
  }

  async execute(tasks: Task[]): Promise<Result[]> {
    const results: Result[] = []
    let allKeys: string[] = []
    let filteredKeys: string[] = []

    for (const task of tasks) {
      try {
        if (task.id === 'list_recipes') {
          const listed = await this.r2.list({ prefix: 'recipes/' })
          allKeys = listed.objects.map((o) => o.key)
          results.push({ task_id: task.id, success: true, output: { keys: allKeys, count: allKeys.length } })
        } else if (task.id === 'filter_results') {
          const query = typeof task.params['query'] === 'string' ? task.params['query'].toLowerCase() : ''
          filteredKeys = query ? allKeys.filter((k) => k.toLowerCase().includes(query)) : allKeys
          results.push({ task_id: task.id, success: true, output: { keys: filteredKeys, count: filteredKeys.length } })
        } else {
          const selected = filteredKeys[0]
          if (!selected) {
            results.push({ task_id: task.id, success: true, output: { content: null, key: null } })
            continue
          }
          const obj = await this.r2.get(selected)
          const content = obj ? await obj.text() : null
          results.push({ task_id: task.id, success: true, output: { key: selected, content } })
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
