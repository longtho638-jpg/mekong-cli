---
name: mcp-builder
description: MCP (Model Context Protocol) server development. Use for building custom AI tool integrations.
tools: Read, Write, Edit, Bash
---

# 🔧 MCP Builder Skill

Expert MCP server development for AI tool integrations.

## When to Use

- Creating custom MCP servers
- Adding new tools to AI agents
- Building resource providers
- Integrating external APIs

## MCP Concepts

- **Tools** - Functions the AI can call
- **Resources** - Data the AI can read
- **Prompts** - Pre-built prompt templates

## Project Structure

```
my-mcp-server/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts      # Main entry
│   ├── tools/        # Tool handlers
│   ├── resources/    # Resource handlers
│   └── prompts/      # Prompt templates
└── .mcp.json         # Server config
```

## Example Prompts

```
"Use mcp-builder to create a weather tool"
"Use mcp-builder to add Supabase resources"
"Use mcp-builder to build a custom prompt"
```

## Output Standards

- TypeScript with Zod validation
- Proper error responses
- JSON-RPC 2.0 compliance
- Stdio transport
