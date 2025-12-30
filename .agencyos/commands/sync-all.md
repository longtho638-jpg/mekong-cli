---
description: Master command to sync ALL Antigravity documentation at once
---

# /sync-all

Bạn là Master Sync Agent. Nhiệm vụ đồng bộ TOÀN BỘ Antigravity documentation vào AgencyOS.

**Binh Pháp**: 始計篇 (Thủy Kế) - Initial Assessment & Complete Strategy

## Input

`$ARGUMENTS` - Không cần (sync everything)

## Quy trình thực hiện

### Step 1: Survey toàn bộ

Truy cập https://antigravity.google/docs và map:

```
Antigravity Docs Structure:
├── Getting Started ✅
├── Agent/
│   ├── Models
│   ├── Agent Modes / Settings
│   ├── Rules / Workflows
│   ├── Task Groups
│   ├── Browser Subagent
│   └── Secure Mode
├── Tools/
│   └── MCP
├── Artifacts/
│   ├── Task List
│   ├── Implementation Plan
│   ├── Walkthrough
│   ├── Screenshots
│   ├── Browser Recordings
│   └── Knowledge
└── Editor/
    ├── Tab
    ├── Command
    ├── Agent Side Panel
    └── Review Changes
```

### Step 2: Execute sync commands

Chạy tuần tự:

1. `/sync-agent` - Agent documentation
2. `/sync-rules` - Rules & Workflows
3. `/sync-tasks` - Task Groups & Task List
4. `/sync-browser` - Browser Subagent & Recordings
5. `/sync-mcp` - MCP documentation
6. `/sync-artifacts` - All artifacts
7. `/sync-editor` - Editor features

### Step 3: Create index page

```markdown
---
title: Antigravity Integration
description: "Complete guide to using AgencyOS with Antigravity IDE"
section: antigravity
order: 1
published: true
---

# Antigravity Integration

## Documentation Map

| Section | Binh Pháp | Link |
|---------|-----------|------|
| Agent | 謀攻篇 | [Agent](/docs/antigravity/agent) |
| Rules | 法篇 | [Rules](/docs/antigravity/rules-workflows) |
| Tasks | 軍爭篇 | [Tasks](/docs/antigravity/tasks) |
| Browser | 火攻篇 | [Browser](/docs/antigravity/browser) |
| MCP | 用間篇 | [MCP](/docs/antigravity/mcp) |
| Artifacts | 計篇 | [Artifacts](/docs/antigravity/artifacts) |
| Editor | 九變篇 | [Editor](/docs/antigravity/editor) |
```

### Step 4: Update navigation

Update sidebar navigation trong `mekong-docs` để include all new pages.

### Step 5: Deploy

```bash
git add -A
git commit -m "sync: Complete Antigravity documentation (Thủy Kế - Full Strategy)"
git push origin main
```

## Binh Pháp Alignment

> 始計篇: "Phu vị chiến nhi miếu toán thắng giả, đắc toán đa dã"
> Chưa đánh mà miếu đường tính thắng, là do tính toán nhiều

Sync-all là chiến lược toàn diện:
- **Đánh giá** toàn bộ terrain (docs)
- **Lập kế hoạch** đầy đủ
- **Triển khai** có hệ thống
- **Thắng lợi** hoàn toàn

## Output

```
✅ COMPLETE SYNC - All Antigravity Docs!

📊 Summary:
- Total sections: 7
- Total pages created: 15+
- Total commits: Multiple

📁 Files Updated:
- /antigravity/index.md (updated)
- /antigravity/agent.md
- /antigravity/rules-workflows.md
- /antigravity/tasks.md
- /antigravity/browser.md
- /antigravity/mcp.md
- /antigravity/artifacts.md
- /antigravity/editor.md

🏯 Binh Pháp Applied:
- 始計篇 (Thủy Kế) - Master strategy
- 謀攻篇 (Mưu Công) - Agent
- 法篇 (Pháp) - Rules
- 軍爭篇 (Quân Tranh) - Tasks
- 火攻篇 (Hoả Công) - Browser
- 用間篇 (Dụng Gián) - MCP
- 計篇 (Kế Hoạch) - Artifacts
- 九變篇 (Cửu Biến) - Editor

🔗 Live: https://www.agencyos.network/docs/antigravity

📝 Commits: [multiple hashes]
```
