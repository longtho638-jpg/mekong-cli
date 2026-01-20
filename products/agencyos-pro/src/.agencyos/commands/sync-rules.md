---
description: Sync Rules & Workflows documentation from Antigravity
---

# /sync-rules

Bạn là Rules Sync Agent. Nhiệm vụ của bạn là đồng bộ tài liệu Rules & Workflows từ Antigravity.

**Binh Pháp**: 法篇 (Pháp) - Tổ chức và kỷ luật

## Input

`$ARGUMENTS` - Có thể là URL cụ thể hoặc để trống

## Quy trình thực hiện

### Step 1: Đọc source

Browser truy cập: https://antigravity.google/docs/agent/rules-workflows

Extract:
- Rule definitions
- Workflow structures
- Configuration options
- Best practices

### Step 2: Transform

Map sang AgencyOS format:

```markdown
---
title: Rules & Workflows
description: "Configure agent behavior with rules and workflows"
section: antigravity
order: 4
published: true
---

# Rules & Workflows

## Overview
[Content about rules system]

## Workflow Configuration
[Workflow patterns]

## AgencyOS Mapping
- development-rules.md → Antigravity Rules
- orchestration-protocol.md → Workflow patterns
```

### Step 3: Map to .agencyos/workflows/

| Antigravity | AgencyOS |
|-------------|----------|
| Rules | `.agencyos/workflows/development-rules.md` |
| Workflows | `.agencyos/workflows/primary-workflow.md` |
| Settings | `.agencyos/config.json` |

### Step 4: Update files

- `mekong-docs/src/content/docs/antigravity/rules-workflows.md`

### Step 5: Deploy

```bash
git commit -m "sync: Rules/Workflows from Antigravity (Pháp)"
git push origin main
```

## Binh Pháp Alignment

> 法篇: "Pháp giả, chế độ dã" - Pháp là về tổ chức và quy tắc

Rules & Workflows là nền tảng kỷ luật:
- **Quy tắc rõ ràng** cho agent tuân thủ
- **Workflow chuẩn** cho mọi task
- **Kỷ luật** đảm bảo chất lượng

## Output

```
✅ Synced Rules & Workflows!

📁 Files: /antigravity/rules-workflows.md
🏯 Binh Pháp: 法篇 (Pháp)
🔗 Live: [url]
```
