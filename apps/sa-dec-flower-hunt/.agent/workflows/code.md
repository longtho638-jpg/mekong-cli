---
description: Quick start coding session - jump into the highest priority task
---

# /code Workflow

## Purpose
Instantly start a focused coding session on the highest-priority task from the current project state.

## Steps

1. **Check GO_LIVE_STATUS.md** for current gaps and priorities

2. **Pick the highest-impact task** from Priority 1 list:
   - Admin Terminal HUD
   - 5-Node Grid View
   - Live Data Subscriptions
   - Remaining i18n

3. **Start implementation** immediately:
   // turbo-all
   - Create/modify files as needed
   - Run `npm run build` to verify
   - Commit with descriptive message
   - Push to main

4. **Update task.md** to reflect progress

## Quick Reference

### Admin Terminal HUD
- File: `app/admin/layout.tsx`
- Add: Live metrics header (Nodes, Volume, System Status)

### 5-Node Grid
- File: `app/admin/terminal/page.tsx` (create new)
- Add: Unified grid showing all 5 nodes

### Farmer i18n
- Files: `app/(farmer)/farmer/*/page.tsx`
- Action: Add `t()` calls for all strings

## Auto-Run Commands
```bash
// turbo
npm run build

// turbo
git add . && git commit -m "feat: [component] - [description]" && git push
```
