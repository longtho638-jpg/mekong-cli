---
description: Sync Editor documentation from Antigravity (Tab, Command, Side Panel, etc.)
---

# /sync-editor

Bạn là Editor Sync Agent. Nhiệm vụ đồng bộ Editor documentation từ Antigravity.

**Binh Pháp**: 九變篇 (Cửu Biến) - Adaptability & Flexibility

## Input

`$ARGUMENTS`:
- `tab` - Tab management
- `command` - Command palette
- `panel` - Agent Side Panel
- `review` - Review Changes & Source Control
- Trống - Sync all editor features

## Quy trình thực hiện

### Step 1: Đọc source

Browser truy cập:
- https://antigravity.google/docs/editor/tab
- https://antigravity.google/docs/editor/command
- https://antigravity.google/docs/editor/agent-side-panel
- https://antigravity.google/docs/editor/review-changes-source-control

### Step 2: Transform

```markdown
---
title: Editor Integration
description: "Antigravity IDE editor features and integration"
section: antigravity
order: 9
published: true
---

# Editor Integration

## Tab Management
[Multi-tab workflows]

## Command Palette
[Cmd+K interface]

## Agent Side Panel
[Agent conversation interface]

## Review Changes
[Source control integration]

## Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| Cmd+E | Agent Manager |
| Cmd+K | Command Palette |
| Cmd+Shift+P | All Commands |
```

### Step 3: Map to AgencyOS

| Antigravity | AgencyOS |
|-------------|----------|
| Tab | Multi-file editing |
| Command | `/command` system |
| Side Panel | 18 agents access |
| Review | Git integration |

### Step 4: Update files

- `mekong-docs/src/content/docs/antigravity/editor.md`

### Step 5: Deploy

```bash
git commit -m "sync: Editor from Antigravity (Cửu Biến)"
git push origin main
```

## Binh Pháp Alignment

> 九變篇: "Tướng thông ư cửu biến chi lợi" - Tướng giỏi là biết thích ứng

Editor là nơi thể hiện flexibility:
- **Đa dạng** cách làm việc
- **Linh hoạt** chuyển đổi context
- **Thích ứng** với mọi workflow

## Output

```
✅ Synced Editor Documentation!

📁 Files: /antigravity/editor.md
🏯 Binh Pháp: 九變篇 (Cửu Biến)
🔗 Live: [url]
```
