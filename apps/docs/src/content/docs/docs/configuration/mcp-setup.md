---
title: "MCP Setup"
description: "Documentation for MCP Setup"
section: docs
category: configuration
order: 8
published: true
lastUpdated: 2025-11-17
ai_executable: true
---

# MCP Setup

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/configuration/mcp-setup
```



## TL;DR

AgencyOS delegates MCP (Model Context Protocol) servers to the dedicated **mcp-manager** subagent. This isolates heavy tool manifests away from the primary agent, keeping its context window lean while still enabling deep integrations.

---

## Setup Checklist

1. **Copy the template config**
   ```bash
   cp .agencyos/.mcp.json.example .agencyos/.mcp.json
   ```
2. **Customize the MCP roster**
   - Remove the default sample servers: `context7`, `human-mcp`, `chrome-devtools`, `sequential-thinking`.
   - Add only the MCP servers you truly need to avoid unnecessary token use.
3. **Save the configuration** so the subagent can bootstrap clients from `.agencyos/.mcp.json` on demand.

> 💡 Keep `.agencyos/.mcp.json` outside your main prompts so the core agent never loads server manifests unless explicitly requested.

---

## Using MCP Tools

Trigger the subagent-managed tools via the `/use-mcp` command:

```bash
/use-mcp <instruction>
```

**Example**

```bash
/use-mcp Use chrome-devtools mcp to capture a screenshot of google.com
```

AgencyOS will summon the **mcp-manager** subagent, load the configured MCP clients, analyze available tools, execute the best fit, and return the results to your primary chat.

---

## Technical Deep Dive

![MCP proxy architecture](/assets/mcp-proxy.jpeg)

### Why This Architecture?

Anthropic's “Code Execution with MCP” pattern inspired a lightweight approach: subagents have their own context windows. Loading MCP manifests directly into the main agent quickly bloats its context—especially with tool-heavy servers like Chrome DevTools or Playwright. By shifting those manifests into a subagent, the primary conversation stays clean even if dozens of MCP servers are configured.

![Context isolation](/assets/05-mcp-context.jpg)

### How It Works

1. The **mcp-management** skill bundle stores script snippets that instantiate MCP clients from `.agencyos/.mcp.json`.
2. The **mcp-manager** subagent is granted these skills and remains dormant until a `/use-mcp` command fires.
3. When invoked, the subagent:
   - Loads `.agencyos/.mcp.json`.
   - Connects to the declared MCP servers.
   - Enumerates available tools and selects the best option for the prompt.
   - Executes the tool invocation and streams the response back to the main agent.

The result: your main context stays pristine, yet you can still tap into specialized MCP capabilities. (Yes, the joke still stands—you *could* register 80 MCP servers, but please add only what you really need.)

### Further Optimization

Even with subagent isolation, processing massive MCP catalogs still burns tokens. To mitigate that, AgencyOS can hand off heavy MCP orchestration to **gemini-cli**, shifting the most expensive reasoning to a cheaper, external runtime while keeping the main conversation focused.

---

## Next Steps

- Keep refining `.agencyos/.mcp.json` as your toolset evolves.
- Version-control the file privately if it includes API endpoints or sensitive details.
- Pair `/use-mcp` with automation commands (e.g., `/cook`, `/fix`, `/plan`) to mix bespoke tools with AgencyOS’s native agents.

With this workflow, you get the power of MCP without the usual context penalty.

---

## 🏯 Binh Pháp Alignment

> **用間篇** (Dụng Gián) - Intelligence - Tool integration

### Zero-Effort Commands

| Gõ lệnh | Auto-execute |
|---------|--------------|
| `/init` | Tự setup AgencyOS |
| `/setup-mcp` | Tự cấu hình MCP |

📖 [Xem tất cả Commands](/docs/commands)
