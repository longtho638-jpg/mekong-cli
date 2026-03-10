/**
 * Content Writer Agent — generates SEO-optimized content via LLM.
 * Mirrors Python: src/agents/content_writer.py
 * CF Workers: no subprocess, uses LLMClient for all steps.
 */

import { LLMClient } from '../core/llm-client'
import type { AgentBase, Result, Task } from '../types/agent'

export class ContentWriterAgent implements AgentBase {
  name = 'content-writer'
  description = 'Generates keyword-researched, SEO-optimized content drafts via LLM'

  private llm: LLMClient

  constructor(llm: LLMClient) {
    this.llm = llm
  }

  async plan(input: string): Promise<Task[]> {
    return [
      { id: 'keyword_research', description: `Research keywords for: ${input}`, status: 'pending', params: { topic: input } },
      { id: 'generate_outline', description: `Create content outline for: ${input}`, status: 'pending', params: { topic: input } },
      { id: 'write_draft', description: `Write draft for: ${input}`, status: 'pending', params: { topic: input } },
      { id: 'seo_optimize', description: `SEO-optimize draft for: ${input}`, status: 'pending', params: { topic: input } },
    ]
  }

  async execute(tasks: Task[]): Promise<Result[]> {
    const results: Result[] = []
    let context = ''

    for (const task of tasks) {
      try {
        const topic = typeof task.params['topic'] === 'string' ? task.params['topic'] : ''
        let prompt = ''

        if (task.id === 'keyword_research') {
          prompt = `Return JSON with "keywords" array (top 10 SEO keywords) for topic: ${topic}`
        } else if (task.id === 'generate_outline') {
          prompt = `Return JSON with "outline" array of section headings for topic: ${topic}. Context: ${context}`
        } else if (task.id === 'write_draft') {
          prompt = `Write a 300-word draft article for topic: ${topic}. Return JSON with "draft" string. Outline: ${context}`
        } else {
          prompt = `Optimize this content for SEO. Return JSON with "optimized" string and "meta_description" string. Draft: ${context}`
        }

        const output = await this.llm.generateJson(prompt)
        context = JSON.stringify(output)
        results.push({ task_id: task.id, success: true, output })
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
