/**
 * Lead Hunter Agent — discovers company/CEO leads via LLM.
 * Mirrors Python: src/agents/lead_hunter.py
 * CF Workers: no subprocess, uses LLMClient for data generation.
 */

import { LLMClient } from '../core/llm-client'
import type { AgentBase, Result, Task } from '../types/agent'

export class LeadHunterAgent implements AgentBase {
  name = 'lead-hunter'
  description = 'Discovers company and CEO leads using LLM-powered research'

  private llm: LLMClient

  constructor(llm: LLMClient) {
    this.llm = llm
  }

  async plan(input: string): Promise<Task[]> {
    return [
      { id: 'search_company', description: `Search company info for: ${input}`, status: 'pending', params: { query: input } },
      { id: 'identify_ceo', description: `Identify CEO for: ${input}`, status: 'pending', params: { query: input } },
      { id: 'find_email', description: `Find contact email for: ${input}`, status: 'pending', params: { query: input } },
    ]
  }

  async execute(tasks: Task[]): Promise<Result[]> {
    const results: Result[] = []

    for (const task of tasks) {
      try {
        const query = typeof task.params['query'] === 'string' ? task.params['query'] : ''
        let prompt = ''

        if (task.id === 'search_company') {
          prompt = `Research this company and return JSON with fields: name, industry, size, website. Company: ${query}`
        } else if (task.id === 'identify_ceo') {
          prompt = `Find the CEO/founder of this company and return JSON with fields: name, title, linkedin. Company: ${query}`
        } else {
          prompt = `Generate a likely contact email format for this company and return JSON with fields: email, confidence. Company: ${query}`
        }

        const output = await this.llm.generateJson(prompt)
        results.push({ task_id: task.id, success: true, output })
      } catch (err) {
        results.push({ task_id: task.id, success: false, error: String(err) })
      }
    }

    return results
  }

  async verify(results: Result[]): Promise<boolean> {
    const emailResult = results.find((r) => r.task_id === 'find_email')
    if (!emailResult?.success || !emailResult.output) return false

    const output = emailResult.output as Record<string, unknown>
    const email = typeof output['email'] === 'string' ? output['email'] : ''
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
}
