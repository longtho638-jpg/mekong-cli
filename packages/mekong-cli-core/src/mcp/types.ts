/**
 * Model Context Protocol (MCP) types.
 * Based on: https://modelcontextprotocol.io/specification
 */

/** MCP Server connection config */
export interface McpServerConfig {
  name: string;
  transport: 'stdio' | 'sse';
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
}

/** MCP Tool (from server's tools/list response) */
export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
      default?: unknown;
    }>;
    required?: string[];
  };
}

/** MCP Resource (from server's resources/list response) */
export interface McpResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

/** MCP Prompt (from server's prompts/list response) */
export interface McpPrompt {
  name: string;
  description?: string;
  arguments?: Array<{ name: string; description?: string; required?: boolean }>;
}

/** MCP call result */
export interface McpCallResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
    resource?: McpResource;
  }>;
  isError?: boolean;
}

/** Connected MCP server state */
export interface McpServerState {
  config: McpServerConfig;
  connected: boolean;
  tools: McpTool[];
  resources: McpResource[];
  prompts: McpPrompt[];
  lastPing?: string;
  error?: string;
}
