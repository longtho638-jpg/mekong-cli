---
description: Automate Gumroad SEO and Image updates
---

# Gumroad Automation Workflow

This workflow automates the process of updating product details (SEO titles, descriptions, tags, prices) and thumbnails on Gumroad.

## Prerequisites

1.  **Dependencies**: `pip install playwright`
2.  **Environment**: `.env` with `GUMROAD_EMAIL` and `GUMROAD_PASSWORD`
3.  **Cookies**: Valid `.antigravity/gumroad_cookies.json` (Generated via headed session)

## Usage

### 1. One-Time Setup (CAPTCHA Bypass)

Run this once to save session cookies:

```bash
python3 scripts/gumroad_automator.py --product vibe-starter --headed
```

_Action_: Login manually, solve CAPTCHA, and press ENTER in terminal.

### 2. Dry-Run Verification

Test mapping without changes:

```bash
python3 scripts/gumroad_automator.py --all --dry-run
```

### 3. Full Automation

Update all products:

```bash
python3 scripts/gumroad_automator.py --all
```

## Architecture

- **Script**: `scripts/gumroad_automator.py`
- **Data**: `products/gumroad_products.json`
- **Assets**: `products/thumbnails/*.png`
