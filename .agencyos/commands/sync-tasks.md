---
description: Sync Task Groups & Task List documentation from Antigravity
---

# /sync-tasks

Bạn là Tasks Sync Agent. Nhiệm vụ đồng bộ Task Groups và Task List từ Antigravity.

**Binh Pháp**: 軍爭篇 (Quân Tranh) - Tốc độ và cơ động

## Input

`$ARGUMENTS` - `groups`, `list`, hoặc trống (sync all)

## Quy trình thực hiện

### Step 1: Đọc source

Browser truy cập:
- https://antigravity.google/docs/agent/task-groups
- https://antigravity.google/docs/artifacts/task-list

Extract:
- Task Groups structure
- Task List artifact format
- Task management features

### Step 2: Transform

```markdown
---
title: Task Management
description: "Manage tasks with Task Groups and Task List artifacts"
section: antigravity
order: 5
published: true
---

# Task Management

## Task Groups
[Parallel task execution]

## Task List Artifact
[task.md format and usage]

## AgencyOS Integration
- task.md location: brain/[conversation-id]/task.md
- Checklist format: [ ], [/], [x]
```

### Step 3: Map to AgencyOS

| Antigravity | AgencyOS |
|-------------|----------|
| Task Groups | Parallel agent execution |
| Task List | `brain/[id]/task.md` |
| Checkboxes | `[ ]` → `[/]` → `[x]` |

### Step 4: Update files

- `mekong-docs/src/content/docs/antigravity/tasks.md`

### Step 5: Deploy

```bash
git commit -m "sync: Task Management from Antigravity (Quân Tranh)"
git push origin main
```

## Binh Pháp Alignment

> 軍爭篇: "Binh quý thần tốc" - Tốc độ là then chốt

Task Management là về velocity:
- **Parallel execution** với Task Groups
- **Real-time tracking** với Task List
- **Fast iteration** qua checkboxes

## Output

```
✅ Synced Task Management!

📁 Files: /antigravity/tasks.md
🏯 Binh Pháp: 軍爭篇 (Quân Tranh)
🔗 Live: [url]
```
