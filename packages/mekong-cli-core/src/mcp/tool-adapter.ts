/**
 * MCP Tool Adapter — adapts McpTool definitions to mekong ToolDefinition format.
 * ROI: Engineering ROI — seamless integration of any MCP tool into mekong's tool registry.
 * Prefixes tool names: mcp.{serverName}.{toolName}
 */
import type { McpTool } from './types.js';
import type { ToolDefinition, ToolParam } from '../types/tool.js';
import type { McpClient } from './client.js';

/** Map JSON Schema types to ToolParam types */
function mapSchemaType(schemaType: string): ToolParam['type'] {
  const typeMap: Record<string, ToolParam['type']> = {
    string: 'string',
    number: 'number',
    integer: 'number',
    boolean: 'boolean',
    object: 'object',
    array: 'array',
  };
  return typeMap[schemaType] ?? 'string';
}

/** Convert McpTool inputSchema properties to ToolParam[] */
function convertParams(tool: McpTool): ToolParam[] {
  const props = tool.inputSchema.properties;
  const required = new Set(tool.inputSchema.required ?? []);
  const params: ToolParam[] = [];

  for (const [name, prop] of Object.entries(props)) {
    params.push({
      name,
      type: mapSchemaType(prop.type),
      required: required.has(name),
      description: prop.description ?? `Parameter: ${name}`,
      ...(prop.default !== undefined ? { default: prop.default } : {}),
      ...(prop.enum ? { enum: prop.enum } : {}),
    });
  }
  return params;
}

/** Adapt a single MCP tool to a mekong ToolDefinition */
export function adaptMcpTool(
  serverName: string,
  tool: McpTool,
  client: McpClient,
): ToolDefinition {
  return {
    name: `mcp.${serverName}.${tool.name}`,
    description: `[MCP:${serverName}] ${tool.description}`,
    category: 'custom',
    securityLevel: 2, // MCP tools run external code — require approval
    params: convertParams(tool),
    execute: async (params: Record<string, unknown>) => {
      const result = await client.callTool(tool.name, params);
      if (!result.ok) {
        return { success: false, output: null, error: result.error.message };
      }
      const val = result.value;
      const text = val.content
        .filter(c => c.type === 'text')
        .map(c => c.text)
        .join('\n');
      return {
        success: !val.isError,
        output: text || val.content,
        error: val.isError ? text : undefined,
        metadata: { serverName, toolName: tool.name },
      };
    },
  };
}

/** Adapt all tools from a server */
export function adaptAllMcpTools(
  serverName: string,
  tools: McpTool[],
  client: McpClient,
): ToolDefinition[] {
  return tools.map(tool => adaptMcpTool(serverName, tool, client));
}
