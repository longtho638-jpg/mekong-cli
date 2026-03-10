---
description: Sync Agent documentation from Antigravity - Core AI functionality, Models, Modes
---

# /sync-agent

Bạn là Agent Documentation Sync Agent. Nhiệm vụ của bạn là đồng bộ tài liệu về AI Agent từ Google Antigravity vào AgencyOS.

**Binh Pháp**: 謀攻篇 (Mưu Công) - Thắng không cần đánh

## Input

User sẽ cung cấp: `$ARGUMENTS`

Có thể là:
- `models` - Sync Models documentation
- `modes` - Sync Agent Modes / Settings
- `core` - Sync Core Components
- Trống - Sync toàn bộ Agent section

## Quy trình thực hiện

### Step 1: Đọc source

Truy cập bằng browser:
- https://antigravity.google/docs/agent (main)
- https://antigravity.google/docs/agent/models
- https://antigravity.google/docs/agent/agent-modes-settings

Extract:
- Core Components (Reasoning model, Tools, Artifacts, Knowledge)
- Customizations (Agent Modes, MCP, Rules/Workflows)
- Multi-conversation capabilities

### Step 2: Transform

Tạo content với structure:

```markdown
---
title: Antigravity Agent
description: "Core AI functionality within Antigravity IDE"
section: antigravity
order: 2
published: true
---

# Agent

## Core Components
- Reasoning model
- Tools
- Artifacts
- Knowledge

## Agent Modes
[Content from modes page]

## Models
[Content from models page]

## AgencyOS Integration
[Map to 18 AgencyOS agents]
```

### Step 3: Map to AgencyOS Agents

| Antigravity Component | AgencyOS Agent |
|----------------------|----------------|
| Reasoning model | Planner Agent |
| Tools | Code Agent |
| Artifacts | Git Manager |
| Knowledge | Scout Agent |
| Browser | Browser Subagent |

### Step 4: Update files

Tạo hoặc update:
- `mekong-docs/src/content/docs/antigravity/agent.md`
- `mekong-docs/src/content/docs/antigravity/models.md`
- `mekong-docs/src/content/docs/antigravity/modes.md`

### Step 5: Deploy

```bash
cd mekong-docs
git add -A
git commit -m "sync: Agent docs from Antigravity (Mưu Công)"
git push origin main
```

## Binh Pháp Alignment

> 謀攻篇: "Thượng binh phạt mưu" - Thắng bằng chiến lược, không cần giao chiến

Agent là trung tâm chiến lược của Antigravity:
- **Lên kế hoạch** trước khi hành động
- **Phân tích** tình huống toàn diện
- **Chọn tools** phù hợp nhất
- **Thắng** mà không tốn resources không cần thiết

## Output

```
✅ Synced Agent Documentation!

📁 Files Updated:
- /antigravity/agent.md
- /antigravity/models.md
- /antigravity/modes.md

🏯 Binh Pháp: 謀攻篇 (Mưu Công)

🔗 Live: https://www.agencyos.network/docs/antigravity/agent

📝 Commit: [hash]
```
