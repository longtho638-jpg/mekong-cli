---
description: Auto-publish products to Gumroad from IDE
---

# 🚀 Auto-Publish Workflow

> **RULE: NO MANUAL WORK** - Everything from IDE

## Command

```bash
# turbo
python3 scripts/gumroad_publisher.py --batch
```

## What It Does

1. Scans `products/*.zip`
2. Checks existing Gumroad products (skips duplicates)
3. Creates new product if not exists
4. Uploads zip file
5. Returns published URLs

## Requirements

```bash
export GUMROAD_ACCESS_TOKEN=xxx
```

## Usage

```bash
# From IDE terminal or via agencyos command
python3 scripts/gumroad_publisher.py --batch
```

## Catalog (Auto-priced)

| Product                 | Price |
| ----------------------- | ----- |
| vscode-starter-pack     | FREE  |
| auth-starter-supabase   | $27   |
| ai-skills-pack          | $27   |
| landing-page-kit        | $37   |
| api-boilerplate-fastapi | $37   |
| admin-dashboard-lite    | $47   |
| vietnamese-agency-kit   | $67   |
| agencyos-pro            | $197  |
| agencyos-enterprise     | $497  |
