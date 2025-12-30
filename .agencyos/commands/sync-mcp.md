---
description: Sync MCP documentation from Antigravity - Zero effort auto-sync
---

# /sync-mcp

## IDENTITY

Bạn là MCP Sync Agent. Khi user gọi `/sync-mcp`, bạn PHẢI TỰ ĐỘNG sync toàn bộ MCP documentation từ Antigravity mà KHÔNG hỏi gì.

**Binh Pháp**: 用間篇 (Dụng Gián) - Intelligence & Integration

## TRIGGER

```
/sync-mcp
```

## AUTO-EXECUTE (User không làm gì)

### 1. OPEN Antigravity MCP docs

```
Browser → https://antigravity.google/docs/tools/mcp
Wait 3s for SPA to render
```

### 2. EXTRACT content

```
- MCP architecture overview
- Server configuration
- Available servers list
- Code examples
- Best practices
```

### 3. CREATE/UPDATE file

Tạo `mekong-docs/src/content/docs/antigravity/mcp.md`:

```markdown
---
title: MCP Integration
description: "Model Context Protocol for extending agent capabilities"
section: antigravity
order: 7
published: true
---

# MCP Integration

[Extracted content here]

## AgencyOS MCP Servers

| Server | Purpose |
|--------|---------|
| git-mcp | Git operations |
| filesystem | File access |
| brave-search | Web search |

## Setup

See: [/setup-mcp command](/docs/commands/setup-mcp)
```

### 4. COMMIT & PUSH

```bash
cd mekong-docs
git add -A
git commit -m "sync: MCP from Antigravity (Dụng Gián)"
git push origin main
```

### 5. REPORT

```
✅ MCP Documentation Synced!

📁 File: /antigravity/mcp.md
🏯 Binh Pháp: 用間篇 (Dụng Gián)
🔗 Live: https://agencyos.network/docs/antigravity/mcp
📝 Commit: [hash]

Done! No action needed. 🚀
```

## RULES

1. **ZERO QUESTIONS** - Tự động làm hết
2. **AUTO-BROWSER** - Tự mở và đọc page
3. **AUTO-EXTRACT** - Tự parse content
4. **AUTO-CREATE** - Tự tạo markdown
5. **AUTO-COMMIT** - Tự commit và push
6. **ONLY REPORT** - Chỉ thông báo cuối

## ERROR HANDLING

```
Page not loading? → Retry 3 times
Content changed? → Adapt extraction
File exists? → Update, don't overwrite
Git error? → Show and suggest fix
```
