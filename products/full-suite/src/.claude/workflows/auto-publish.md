---
description: Auto-publish products to Gumroad from IDE - NO MANUAL WORK
---

# 🚀 Auto-Publish Workflow

> **PERMANENT RULE:** Publishing happens from IDE, not manually

## Quick Command

```bash
# turbo
python3 scripts/gumroad_publisher.py --batch
```

## Full Workflow

1. Package product in `products/` folder
2. Create zip: `zip -r products/name-v1.0.0.zip products/name/`
3. Run: `python3 scripts/gumroad_publisher.py --batch`
4. Done! Product is LIVE on Gumroad

## Requirements

Set `GUMROAD_ACCESS_TOKEN` in environment.

## Other Commands

```bash
python3 scripts/gumroad_publisher.py --list     # View all products
python3 scripts/gumroad_publisher.py --setup    # Setup token
python3 scripts/payment_hub.py products         # View from both platforms
```
