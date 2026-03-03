/**
 * LLM Client — OpenAI-compatible with circuit breaker failover.
 * Mirrors Python: src/core/llm_client.py
 *
 * Runs natively on CF Workers using fetch() — no SDK deps needed.
 */

import { z } from 'zod'

// --- Types ---

export const LLMResponseSchema = z.object({
  content: z.string(),
  model: z.string(),
  usage: z.record(z.number()).optional(),
})

export type LLMResponse = z.infer<typeof LLMResponseSchema>

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatOptions {
  model?: string
  temperature?: number
  max_tokens?: number
  json_mode?: boolean
}

interface ProviderHealth {
  failures: number
  lastFailure: number
  cooldownMs: number
}

interface LLMProvider {
  name: string
  baseUrl: string
  apiKey: string
  isAvailable(): boolean
}

// --- LLMClient ---

export class LLMClient {
  private providers: LLMProvider[]
  private health: Map<string, ProviderHealth> = new Map()
  private defaultModel: string
  private ai?: Ai

  constructor(opts: {
    ai?: Ai
    llmApiKey?: string
    llmBaseUrl?: string
    model?: string
  }) {
    this.defaultModel = opts.model ?? '@cf/meta/llama-3.1-8b-instruct'
    this.ai = opts.ai
    this.providers = []

    const baseUrl = opts.llmBaseUrl ?? 'https://api.openai.com/v1'
    const apiKey = opts.llmApiKey ?? ''

    if (apiKey) {
      this.providers.push({
        name: 'primary',
        baseUrl,
        apiKey,
        isAvailable: () => true,
      })
    }

    // Offline fallback always last
    this.providers.push({
      name: 'offline',
      baseUrl: '',
      apiKey: '',
      isAvailable: () => true,
    })
  }

  get isAvailable(): boolean {
    if (this.ai && this.defaultModel.startsWith('@cf/')) return true
    return this.providers.some((p) => p.name !== 'offline' && p.isAvailable())
  }

  async chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<LLMResponse> {
    const model = opts.model ?? this.defaultModel
    const temperature = opts.temperature ?? 0.7
    const maxTokens = opts.max_tokens ?? 2048

    // Try Workers AI first (free, no key needed)
    if (this.ai && model.startsWith('@cf/')) {
      try {
        const result = await this.ai.run(model as Parameters<Ai['run']>[0], {
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          max_tokens: maxTokens,
        })

        // Workers AI returns { response: string } for text generation
        const text = (result as { response?: string })?.response ?? ''
        if (text) {
          const usage = (result as { usage?: Record<string, number> })?.usage
          return { content: text, model, usage }
        }
      } catch {
        // Fall through to HTTP providers
      }
    }

    // Fall back to HTTP providers (OpenAI-compatible)
    for (const provider of this.getHealthyProviders()) {
      if (provider.name === 'offline') break

      try {
        const body: Record<string, unknown> = {
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }
        if (opts.json_mode) {
          body.response_format = { type: 'json_object' }
        }

        const resp = await fetch(`${provider.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${provider.apiKey}`,
          },
          body: JSON.stringify(body),
        })

        if (!resp.ok) {
          const errText = await resp.text()
          this.recordFailure(provider.name)
          if (resp.status === 400) {
            return this.offlineResponse(messages, `bad request: ${errText}`)
          }
          continue
        }

        const data = (await resp.json()) as {
          choices: Array<{ message: { content: string } }>
          model: string
          usage?: Record<string, number>
        }

        this.recordSuccess(provider.name)

        return {
          content: data.choices[0]?.message?.content ?? '',
          model: data.model ?? model,
          usage: data.usage,
        }
      } catch {
        this.recordFailure(provider.name)
        continue
      }
    }

    return this.offlineResponse(messages, 'all providers failed')
  }

  async generate(prompt: string, opts: ChatOptions = {}): Promise<string> {
    const resp = await this.chat([{ role: 'user', content: prompt }], opts)
    return resp.content
  }

  async generateJson(prompt: string, opts: ChatOptions = {}): Promise<Record<string, unknown>> {
    const messages: ChatMessage[] = [
      { role: 'system', content: 'Always respond with valid JSON.' },
      { role: 'user', content: prompt },
    ]
    const resp = await this.chat(messages, { ...opts, json_mode: true })
    try {
      return JSON.parse(resp.content) as Record<string, unknown>
    } catch {
      return { raw_content: resp.content }
    }
  }

  // --- Internal ---

  private getHealthyProviders(): LLMProvider[] {
    const now = Date.now()
    return this.providers.filter((p) => {
      if (p.name === 'offline') return true
      const h = this.health.get(p.name)
      if (!h) return true
      if (h.failures < 3) return true
      return now - h.lastFailure > h.cooldownMs
    })
  }

  private recordFailure(name: string): void {
    const h = this.health.get(name) ?? { failures: 0, lastFailure: 0, cooldownMs: 60_000 }
    h.failures++
    h.lastFailure = Date.now()
    this.health.set(name, h)
  }

  private recordSuccess(name: string): void {
    const h = this.health.get(name)
    if (h) h.failures = 0
  }

  private offlineResponse(messages: ChatMessage[], error: string): LLMResponse {
    const userMsg = [...messages].reverse().find((m) => m.role === 'user')?.content ?? ''
    return {
      content: `[OFFLINE] LLM unavailable (${error}). Request: ${userMsg.slice(0, 200)}`,
      model: 'offline',
    }
  }
}
