---
description: Check UI package version and integration status
---

# /ui-check - UI Version Checker

> **Verify @agencyos/ui package and app integration**

## Quick Check

// turbo

```bash
python3 scripts/vibeos/ui_checker.py
```

## What It Shows

- **@agencyos/ui version** and components list
- **Dashboard integration** status
- **Recent commits** to UI package

## Example Output

```
🎨 UI VERSION CHECKER
==================================================

📦 @agencyos/ui
   Version: 1.0.0
   Components: 3
      → button
      → card
      → stat-card

📊 Dashboard Integration
   ✅ @agencyos/ui: workspace:*
```

## Install in App

```bash
# Dashboard
cd apps/dashboard && pnpm add @agencyos/ui@workspace:*

# Newsletter
cd newsletter-saas && pnpm add @agencyos/ui@workspace:*
```

## 🏯 Binh Pháp

> "Thống nhất là sức mạnh" - Unified UI = consistent UX.
