/**
 * OpenAI-compatible provider — works with any API that follows the
 * OpenAI chat completions format (OpenAI, DeepSeek, OpenRouter, Ollama, etc.)
 */
import type { ChatRequest, ChatResponse, LlmProvider } from '../types.js';

export interface OpenAICompatConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
}

export class OpenAICompatProvider implements LlmProvider {
  readonly name: string;
  private baseUrl: string;
  private apiKey: string;
  private defaultModel: string;

  constructor(config: OpenAICompatConfig) {
    this.name = config.name;
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.apiKey = config.apiKey;
    this.defaultModel = config.defaultModel;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const model = request.model ?? this.defaultModel;
    const startTime = Date.now();

    const body: Record<string, unknown> = {
      model,
      messages: this.formatMessages(request),
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.7,
    };

    if (request.tools?.length) {
      body.tools = request.tools.map(t => ({
        type: 'function',
        function: { name: t.name, description: t.description, parameters: t.parameters },
      }));
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${this.name} API error (${response.status}): ${errorText}`);
    }

    const data = await response.json() as OpenAIResponse;
    const latencyMs = Date.now() - startTime;
    const choice = data.choices?.[0];

    return {
      content: choice?.message?.content ?? '',
      toolCalls: choice?.message?.tool_calls?.map(tc => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments) as Record<string, unknown>,
      })),
      usage: {
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
      },
      cost: 0, // calculated by CostTracker
      model,
      provider: this.name,
      latencyMs,
      finishReason: mapFinishReason(choice?.finish_reason),
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });
      if (!response.ok) return [];
      const data = await response.json() as { data?: Array<{ id: string }> };
      return data.data?.map(m => m.id) ?? [];
    } catch {
      return [];
    }
  }

  private formatMessages(request: ChatRequest): Array<Record<string, unknown>> {
    const messages: Array<Record<string, unknown>> = [];
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    for (const msg of request.messages) {
      messages.push({
        role: msg.role,
        content: msg.content,
        ...(msg.name && { name: msg.name }),
        ...(msg.tool_call_id && { tool_call_id: msg.tool_call_id }),
      });
    }
    return messages;
  }
}

/** Map provider finish reasons to our standard */
function mapFinishReason(reason?: string): ChatResponse['finishReason'] {
  switch (reason) {
    case 'stop': return 'stop';
    case 'tool_calls':
    case 'function_call': return 'tool_calls';
    case 'length': return 'length';
    default: return 'stop';
  }
}

/** OpenAI API response shape */
interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string;
      tool_calls?: Array<{
        id: string;
        function: { name: string; arguments: string };
      }>;
    };
    finish_reason?: string;
  }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}
