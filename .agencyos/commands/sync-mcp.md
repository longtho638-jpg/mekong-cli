---
description: Sync MCP (Model Context Protocol) documentation from Antigravity
---

# /sync-mcp

Bạn là MCP Sync Agent. Nhiệm vụ đồng bộ MCP documentation từ Antigravity.

**Binh Pháp**: 用間篇 (Dụng Gián) - Intelligence & Integration

## Input

`$ARGUMENTS` - URL hoặc để trống

## Quy trình thực hiện

### Step 1: Đọc source

Browser truy cập: https://antigravity.google/docs/tools/mcp

Extract:
- MCP architecture
- Server configuration
- Tool definitions
- Integration patterns

### Step 2: Transform

```markdown
---
title: MCP Integration
description: "Model Context Protocol for extending agent capabilities"
section: antigravity
order: 7
published: true
---

# MCP Integration

## What is MCP?
[Protocol explanation]

## Configuration
[.agencyos/mcp.json structure]

## Available Servers
- git-mcp
- filesystem
- brave-search
- puppeteer
- Custom servers

## AgencyOS MCP Servers
[Link to our MCP setup]
```

### Step 3: Map to AgencyOS

| Antigravity | AgencyOS |
|-------------|----------|
| MCP config | `.agencyos/mcp.json` |
| Tools | `/docs/configuration/mcp-setup` |
| Servers | Custom MCP implementations |

### Step 4: Update files

- `mekong-docs/src/content/docs/antigravity/mcp.md`

### Step 5: Deploy

```bash
git commit -m "sync: MCP from Antigravity (Dụng Gián)"
git push origin main
```

## Binh Pháp Alignment

> 用間篇: "Dụng gián giả, nhân chi cực dã" - Dùng gián điệp là cao nhất

MCP là intelligence network:
- **Thu thập** từ nhiều sources
- **Tích hợp** external tools
- **Mở rộng** agent capabilities
- **Thông tin** là sức mạnh

## Output

```
✅ Synced MCP Documentation!

📁 Files: /antigravity/mcp.md
🏯 Binh Pháp: 用間篇 (Dụng Gián)
🔗 Live: [url]
```
