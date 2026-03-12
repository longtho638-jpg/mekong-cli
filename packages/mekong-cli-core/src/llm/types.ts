/** LLM chat message */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
}

/** Tool definition for function calling */
export interface LlmToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

/** Chat completion request */
export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  provider?: string;
  maxTokens?: number;
  temperature?: number;
  tools?: LlmToolDefinition[];
  systemPrompt?: string;
  stream?: boolean;
}

/** Tool call from LLM response */
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

/** Chat completion response */
export interface ChatResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage: { inputTokens: number; outputTokens: number };
  cost: number;
  model: string;
  provider: string;
  latencyMs: number;
  finishReason: 'stop' | 'tool_calls' | 'length' | 'error';
}

/** LLM Provider interface — all providers implement this */
export interface LlmProvider {
  name: string;
  chat(request: ChatRequest): Promise<ChatResponse>;
  listModels?(): Promise<string[]>;
  isAvailable(): Promise<boolean>;
}
