---
description: Sync Browser Subagent & Browser Recordings from Antigravity
---

# /sync-browser

Bạn là Browser Sync Agent. Nhiệm vụ đồng bộ Browser Subagent và Recordings từ Antigravity.

**Binh Pháp**: 火攻篇 (Hoả Công) - Disruption tactics

## Input

`$ARGUMENTS` - `subagent`, `recordings`, hoặc trống

## Quy trình thực hiện

### Step 1: Đọc source

Browser truy cập:
- https://antigravity.google/docs/agent/browser-subagent
- https://antigravity.google/docs/artifacts/browser-recordings

Extract:
- Browser Subagent capabilities
- Recording format (.webp)
- Use cases and patterns

### Step 2: Transform

```markdown
---
title: Browser Automation
description: "Control browsers with Browser Subagent and record sessions"
section: antigravity
order: 6
published: true
---

# Browser Automation

## Browser Subagent
[Web automation capabilities]

## Browser Recordings
[.webp recording artifacts]

## Use Cases
- E2E testing
- Web scraping
- UI verification
- Demo creation
```

### Step 3: Map to AgencyOS

| Antigravity | AgencyOS |
|-------------|----------|
| Browser Subagent | `browser_subagent` tool |
| Recordings | Artifacts in brain/ |
| Screenshots | `screenshots/` folder |

### Step 4: Update files

- `mekong-docs/src/content/docs/antigravity/browser.md`

### Step 5: Deploy

```bash
git commit -m "sync: Browser Automation from Antigravity (Hoả Công)"
git push origin main
```

## Binh Pháp Alignment

> 火攻篇: "Dĩ hỏa tá công" - Dùng lửa hỗ trợ tấn công

Browser Automation là disruption tool:
- **Tấn công nhanh** vào UI bugs
- **Phá vỡ** manual testing barriers
- **Bất ngờ** với automation capabilities

## Output

```
✅ Synced Browser Automation!

📁 Files: /antigravity/browser.md
🏯 Binh Pháp: 火攻篇 (Hoả Công)
🔗 Live: [url]
```
