---
title: MCP Manager Agent
description: Manage MCP tools and servers
section: docs
category: agents
order: 15
published: true
ai_executable: true
---

# 🔌 MCP Manager Agent

> **Manage MCP tools and servers**

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/agents/mcp-manager
```

---

## ⚡ Step-by-Step

### Step 1: List MCP Servers
```bash
mekong mcp:list

# Output: Available servers and status
```

### Step 2: Add MCP Server
```bash
mekong mcp:add "memory"

# With config
mekong mcp:add "brave-search" --key $BRAVE_API_KEY
```

### Step 3: Use MCP Tool
```bash
mekong mcp:call "memory" "list_entities"
```

---

## ✅ Success Criteria

- [ ] MCP servers listed
- [ ] Servers connected
- [ ] Tools callable
- [ ] Config valid

---

## 🔧 Commands

| Command | Purpose |
|---------|---------|
| `mekong mcp:list` | List servers |
| `mekong mcp:add` | Add server |
| `mekong mcp:call` | Call tool |
| `mekong mcp:status` | Check status |

---

**🏯 "Họ WIN → Mình WIN"**
