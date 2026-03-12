/**
 * MCP module tests — discovery, tool-adapter, server-manager
 * Tests use mocks for McpClient since real MCP servers require external processes.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { discoverMcpServers, readConfigServers } from './discovery.js';
import { adaptMcpTool, adaptAllMcpTools } from './tool-adapter.js';
import { McpServerManager } from './server-manager.js';
import type { McpTool, McpServerConfig } from './types.js';
import { ok, err } from '../types/common.js';

const TEST_DIR = '/tmp/mekong-mcp-test';

// --- Discovery Tests ---
describe('MCP Discovery', () => {
  beforeEach(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  describe('readConfigServers', () => {
    it('parses Claude Desktop format (mcpServers object)', () => {
      const config = {
        mcpServers: {
          filesystem: {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem'],
            env: { HOME: '/tmp' },
          },
          github: {
            command: 'gh-mcp',
            transport: 'stdio',
          },
        },
      };
      const servers = readConfigServers(config);
      expect(servers).toHaveLength(2);
      expect(servers[0].name).toBe('filesystem');
      expect(servers[0].transport).toBe('stdio');
      expect(servers[0].command).toBe('npx');
      expect(servers[0].args).toEqual(['-y', '@modelcontextprotocol/server-filesystem']);
      expect(servers[0].env).toEqual({ HOME: '/tmp' });
      expect(servers[1].name).toBe('github');
    });

    it('parses array format (servers array)', () => {
      const config = {
        servers: [
          { name: 'db', transport: 'stdio', command: 'db-mcp' },
          { name: 'web', transport: 'sse', url: 'http://localhost:3001/sse' },
        ],
      };
      const servers = readConfigServers(config);
      expect(servers).toHaveLength(2);
      expect(servers[0].name).toBe('db');
      expect(servers[1].transport).toBe('sse');
      expect(servers[1].url).toBe('http://localhost:3001/sse');
    });

    it('returns empty array for null/undefined input', () => {
      expect(readConfigServers(null)).toEqual([]);
      expect(readConfigServers(undefined)).toEqual([]);
      expect(readConfigServers(42)).toEqual([]);
    });

    it('skips invalid entries in servers array', () => {
      const config = {
        servers: [null, 'invalid', { noName: true }, { name: 'valid', command: 'x' }],
      };
      const servers = readConfigServers(config);
      expect(servers).toHaveLength(1);
      expect(servers[0].name).toBe('valid');
    });

    it('defaults transport to stdio when omitted', () => {
      const config = { mcpServers: { test: { command: 'test-cmd' } } };
      const servers = readConfigServers(config);
      expect(servers[0].transport).toBe('stdio');
    });
  });

  describe('discoverMcpServers', () => {
    it('discovers servers from mcp-servers.json', async () => {
      const config = {
        mcpServers: { myserver: { command: 'my-mcp', args: ['--flag'] } },
      };
      await fs.writeFile(join(TEST_DIR, 'mcp-servers.json'), JSON.stringify(config));

      const result = await discoverMcpServers(TEST_DIR);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0].name).toBe('myserver');
      }
    });

    it('discovers servers from mcp.json', async () => {
      const config = {
        servers: [{ name: 'alt', command: 'alt-mcp' }],
      };
      await fs.writeFile(join(TEST_DIR, 'mcp.json'), JSON.stringify(config));

      const result = await discoverMcpServers(TEST_DIR);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0].name).toBe('alt');
      }
    });

    it('merges servers from multiple config files', async () => {
      await fs.writeFile(
        join(TEST_DIR, 'mcp-servers.json'),
        JSON.stringify({ mcpServers: { a: { command: 'a' } } })
      );
      await fs.writeFile(
        join(TEST_DIR, 'mcp.json'),
        JSON.stringify({ servers: [{ name: 'b', command: 'b' }] })
      );

      const result = await discoverMcpServers(TEST_DIR);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
      }
    });

    it('returns ok with empty array when no config files exist', async () => {
      const result = await discoverMcpServers(TEST_DIR);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([]);
      }
    });

    it('returns error when config file has invalid JSON', async () => {
      await fs.writeFile(join(TEST_DIR, 'mcp-servers.json'), 'not json{{{');
      const result = await discoverMcpServers(TEST_DIR);
      // Returns error since the only config file is malformed
      expect(result.ok).toBe(false);
    });
  });
});

// --- Tool Adapter Tests ---
describe('MCP Tool Adapter', () => {
  const sampleTool: McpTool = {
    name: 'read_file',
    description: 'Read a file from the filesystem',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to read' },
        encoding: { type: 'string', description: 'Encoding', default: 'utf-8', enum: ['utf-8', 'ascii'] },
        maxLines: { type: 'integer', description: 'Max lines to read' },
      },
      required: ['path'],
    },
  };

  const mockClient = {
    callTool: vi.fn(),
    isConnected: vi.fn().mockReturnValue(true),
  } as any;

  it('creates ToolDefinition with correct name prefix', () => {
    const def = adaptMcpTool('filesystem', sampleTool, mockClient);
    expect(def.name).toBe('mcp.filesystem.read_file');
  });

  it('sets description with server name prefix', () => {
    const def = adaptMcpTool('filesystem', sampleTool, mockClient);
    expect(def.description).toContain('[MCP:filesystem]');
    expect(def.description).toContain('Read a file');
  });

  it('sets category to custom and securityLevel to 2', () => {
    const def = adaptMcpTool('fs', sampleTool, mockClient);
    expect(def.category).toBe('custom');
    expect(def.securityLevel).toBe(2);
  });

  it('converts inputSchema properties to ToolParam array', () => {
    const def = adaptMcpTool('fs', sampleTool, mockClient);
    expect(def.params).toHaveLength(3);

    const pathParam = def.params.find(p => p.name === 'path');
    expect(pathParam).toBeDefined();
    expect(pathParam!.type).toBe('string');
    expect(pathParam!.required).toBe(true);

    const encodingParam = def.params.find(p => p.name === 'encoding');
    expect(encodingParam).toBeDefined();
    expect(encodingParam!.required).toBe(false);
    expect(encodingParam!.enum).toEqual(['utf-8', 'ascii']);
  });

  it('maps integer schema type to number', () => {
    const def = adaptMcpTool('fs', sampleTool, mockClient);
    const maxLines = def.params.find(p => p.name === 'maxLines');
    expect(maxLines!.type).toBe('number');
  });

  it('execute calls client.callTool and returns success result', async () => {
    mockClient.callTool.mockResolvedValueOnce(ok({
      content: [{ type: 'text', text: 'file content here' }],
      isError: false,
    }));

    const def = adaptMcpTool('fs', sampleTool, mockClient);
    const result = await def.execute({ path: '/tmp/test.txt' });
    expect(result.success).toBe(true);
    expect(result.output).toBe('file content here');
    expect(result.metadata).toEqual({ serverName: 'fs', toolName: 'read_file' });
  });

  it('execute returns error when client fails', async () => {
    mockClient.callTool.mockResolvedValueOnce(err(new Error('Connection lost')));

    const def = adaptMcpTool('fs', sampleTool, mockClient);
    const result = await def.execute({ path: '/nope' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Connection lost');
  });

  it('execute handles isError response from tool', async () => {
    mockClient.callTool.mockResolvedValueOnce(ok({
      content: [{ type: 'text', text: 'Permission denied' }],
      isError: true,
    }));

    const def = adaptMcpTool('fs', sampleTool, mockClient);
    const result = await def.execute({ path: '/etc/shadow' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Permission denied');
  });

  it('adaptAllMcpTools converts array of tools', () => {
    const tools: McpTool[] = [
      sampleTool,
      { name: 'write_file', description: 'Write file', inputSchema: { type: 'object', properties: {}, required: [] } },
    ];
    const defs = adaptAllMcpTools('fs', tools, mockClient);
    expect(defs).toHaveLength(2);
    expect(defs[0].name).toBe('mcp.fs.read_file');
    expect(defs[1].name).toBe('mcp.fs.write_file');
  });
});

// --- Server Manager Tests (unit, no real MCP servers) ---
describe('McpServerManager', () => {
  it('getStates returns empty array initially', () => {
    const mgr = new McpServerManager();
    expect(mgr.getStates()).toEqual([]);
  });

  it('getAllTools returns empty array when no servers connected', () => {
    const mgr = new McpServerManager();
    expect(mgr.getAllTools()).toEqual([]);
  });

  it('toToolDefinitions returns empty array when no servers connected', () => {
    const mgr = new McpServerManager();
    expect(mgr.toToolDefinitions()).toEqual([]);
  });

  it('getClient returns undefined for unknown server', () => {
    const mgr = new McpServerManager();
    expect(mgr.getClient('nonexistent')).toBeUndefined();
  });

  it('connect handles connection failure gracefully', async () => {
    const mgr = new McpServerManager();
    const config: McpServerConfig = {
      name: 'bad-server',
      transport: 'sse', // SSE not implemented → will error
    };
    const result = await mgr.connect(config);
    expect(result.ok).toBe(false);
    // State should record the error
    const states = mgr.getStates();
    expect(states).toHaveLength(1);
    expect(states[0].connected).toBe(false);
    expect(states[0].error).toBeDefined();
  });

  it('disconnectAll clears all state', async () => {
    const mgr = new McpServerManager();
    // Connect will fail but state is recorded
    await mgr.connect({ name: 'a', transport: 'sse' });
    await mgr.connect({ name: 'b', transport: 'sse' });
    expect(mgr.getStates()).toHaveLength(2);
    await mgr.disconnectAll();
    expect(mgr.getStates()).toHaveLength(0);
  });

  it('healthCheckAll returns empty object when no clients', async () => {
    const mgr = new McpServerManager();
    const result = await mgr.healthCheckAll();
    expect(result).toEqual({});
  });
});
