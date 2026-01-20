---
description: Sync Artifacts documentation from Antigravity (Task List, Plans, Walkthroughs, etc.)
---

# /sync-artifacts

Bạn là Artifacts Sync Agent. Nhiệm vụ đồng bộ tất cả Artifacts documentation từ Antigravity.

**Binh Pháp**: 計篇 (Kế Hoạch) - Strategic Planning

## Input

`$ARGUMENTS`:
- `task-list` - Task List artifact
- `plan` - Implementation Plan
- `walkthrough` - Walkthrough artifact
- `screenshots` - Screenshots
- `recordings` - Browser Recordings
- `knowledge` - Knowledge items
- Trống - Sync all artifacts

## Quy trình thực hiện

### Step 1: Đọc source

Browser truy cập:
- https://antigravity.google/docs/artifacts/task-list
- https://antigravity.google/docs/artifacts/implementation-plan
- https://antigravity.google/docs/artifacts/walkthrough
- https://antigravity.google/docs/artifacts/screenshots
- https://antigravity.google/docs/artifacts/browser-recordings
- https://antigravity.google/docs/artifacts/knowledge

### Step 2: Transform

```markdown
---
title: Artifacts
description: "Structured outputs that agents can create and manage"
section: antigravity
order: 8
published: true
---

# Artifacts

## Overview
Artifacts are structured files in brain/[conversation-id]/

## Artifact Types

### Task List (task.md)
[Checklist format]

### Implementation Plan (implementation_plan.md)
[Planning format]

### Walkthrough (walkthrough.md)
[Documentation format]

### Screenshots
[Image capture]

### Browser Recordings
[.webp animations]

### Knowledge Items
[Persistent knowledge]
```

### Step 3: Map to AgencyOS

| Artifact | Location |
|----------|----------|
| task.md | `brain/[id]/task.md` |
| implementation_plan.md | `brain/[id]/implementation_plan.md` |
| walkthrough.md | `brain/[id]/walkthrough.md` |
| Screenshots | `brain/[id]/screenshots/` |
| Recordings | `brain/[id]/*.webp` |
| Knowledge | `knowledge/[topic]/` |

### Step 4: Update files

- `mekong-docs/src/content/docs/antigravity/artifacts.md`
- Có thể tạo sub-pages cho mỗi artifact type

### Step 5: Deploy

```bash
git commit -m "sync: Artifacts from Antigravity (Kế Hoạch)"
git push origin main
```

## Binh Pháp Alignment

> 計篇: "Đa toán thắng" - Tính toán nhiều thì thắng

Artifacts là công cụ lập kế hoạch:
- **Task List** = Checklist chiến thuật
- **Implementation Plan** = Kế hoạch tác chiến
- **Walkthrough** = Báo cáo chiến dịch
- **Knowledge** = Intelligence archive

## Output

```
✅ Synced All Artifacts!

📁 Files: 
- /antigravity/artifacts.md
- /antigravity/artifacts/task-list.md
- /antigravity/artifacts/implementation-plan.md
- /antigravity/artifacts/walkthrough.md
- /antigravity/artifacts/knowledge.md

🏯 Binh Pháp: 計篇 (Kế Hoạch)
🔗 Live: [url]
```
