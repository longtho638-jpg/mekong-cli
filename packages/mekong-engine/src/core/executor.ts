/**
 * Recipe Executor — runs recipe steps (LLM + API modes).
 * Mirrors Python: src/core/executor.py
 *
 * NOTE: Shell mode not available in CF Workers (no subprocess).
 * Shell steps are delegated to an external runner API or skipped.
 */

import type { RecipeStep } from '../types/recipe'
import type { ExecutionResult } from '../types/execution'
import type { LLMClient } from './llm-client'

export class RecipeExecutor {
  constructor(private llm: LLMClient) {}

  async executeStep(step: RecipeStep): Promise<ExecutionResult> {
    const mode = step.mode ?? 'shell'

    switch (mode) {
      case 'llm':
        return this.executeLlmStep(step)
      case 'api':
        return this.executeApiStep(step)
      case 'shell':
        return this.executeShellStep(step)
      default:
        return {
          exit_code: 1,
          stdout: '',
          stderr: `Unknown mode: ${mode}`,
          metadata: { mode },
        }
    }
  }

  private async executeLlmStep(step: RecipeStep): Promise<ExecutionResult> {
    if (!this.llm.isAvailable) {
      return {
        exit_code: 0,
        stdout: '[SKIPPED] LLM offline',
        stderr: '',
        metadata: { mode: 'llm', skipped: true },
      }
    }

    try {
      const messages: Array<{ role: 'system' | 'user'; content: string }> = []
      const systemPrompt = (step.params as Record<string, string>)?.system
      if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
      messages.push({ role: 'user', content: step.description })

      const resp = await this.llm.chat(messages)
      return {
        exit_code: 0,
        stdout: resp.content,
        stderr: '',
        metadata: { mode: 'llm', model: resp.model },
      }
    } catch (err) {
      return {
        exit_code: 1,
        stdout: '',
        stderr: err instanceof Error ? err.message : String(err),
        metadata: { mode: 'llm' },
      }
    }
  }

  private async executeApiStep(step: RecipeStep): Promise<ExecutionResult> {
    const params = (step.params ?? {}) as Record<string, unknown>
    const url = (params.url as string) ?? ''
    const method = ((params.method as string) ?? 'GET').toUpperCase()
    const body = params.body as Record<string, unknown> | undefined
    const headers = (params.headers as Record<string, string>) ?? {}

    if (!url) {
      return {
        exit_code: 0,
        stdout: '[SKIPPED] No URL',
        stderr: '',
        metadata: { mode: 'api', skipped: true },
      }
    }

    try {
      const fetchOpts: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
      }
      if (body && method !== 'GET') {
        fetchOpts.body = JSON.stringify(body)
      }

      const resp = await fetch(url, fetchOpts)
      const text = await resp.text()

      return {
        exit_code: resp.ok ? 0 : 1,
        stdout: text,
        stderr: resp.ok ? '' : `HTTP ${resp.status}`,
        metadata: { mode: 'api', status_code: resp.status, url },
      }
    } catch (err) {
      return {
        exit_code: 1,
        stdout: '',
        stderr: err instanceof Error ? err.message : String(err),
        metadata: { mode: 'api', url },
      }
    }
  }

  private async executeShellStep(_step: RecipeStep): Promise<ExecutionResult> {
    // CF Workers cannot run shell commands.
    // In production, this would delegate to an external runner API.
    return {
      exit_code: 0,
      stdout: '[SKIPPED] Shell mode not available in Workers runtime',
      stderr: '',
      metadata: { mode: 'shell', skipped: true },
    }
  }
}
