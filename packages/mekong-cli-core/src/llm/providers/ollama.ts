/**
 * Ollama provider — local LLM inference.
 * Wraps the Ollama API (OpenAI-compatible at /v1/).
 */
import { OpenAICompatProvider } from './openai-compatible.js';
import type { LlmProvider, ChatRequest, ChatResponse } from '../types.js';

export class OllamaProvider implements LlmProvider {
  readonly name = 'ollama';
  private inner: OpenAICompatProvider;
  private baseUrl: string;

  constructor(baseUrl?: string, defaultModel?: string) {
    this.baseUrl = baseUrl ?? 'http://localhost:11434';
    this.inner = new OpenAICompatProvider({
      name: 'ollama',
      baseUrl: `${this.baseUrl}/v1`,
      apiKey: 'ollama', // Ollama doesn't require a key
      defaultModel: defaultModel ?? 'llama3.2',
    });
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await this.inner.chat(request);
    return { ...response, cost: 0, provider: 'ollama' }; // Local = free
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, { signal: AbortSignal.timeout(2000) });
      return response.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return [];
      const data = await response.json() as { models?: Array<{ name: string }> };
      return data.models?.map(m => m.name) ?? [];
    } catch {
      return [];
    }
  }
}
