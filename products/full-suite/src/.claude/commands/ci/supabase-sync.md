---
description: Supabase debugger - diagnose database and sync issues
---

# /supabase-sync - Database Debugger

Diagnose and sync Supabase database for AgencyOS.

## Usage

```bash
/supabase-sync           # Full diagnostic
/supabase-sync --status  # Quick status check
/supabase-sync --migrate # Run pending migrations
```

## Steps

### Step 1: Check Supabase CLI Status

// turbo

```bash
supabase --version
supabase projects list 2>/dev/null | head -5 || echo "⚠️ Not logged in: run 'supabase login'"
```

### Step 2: Verify Project Link

// turbo

```bash
cd /Users/macbookprom1/mekong-cli
cat supabase/.temp/project-ref 2>/dev/null || echo "⚠️ Not linked: run 'supabase link'"
```

### Step 3: Check Database Connectivity

// turbo

```bash
cd /Users/macbookprom1/mekong-cli
# Check env vars
grep -q "SUPABASE_URL" .env && echo "✅ SUPABASE_URL configured" || echo "❌ Missing SUPABASE_URL"
grep -q "SUPABASE_KEY" .env && echo "✅ SUPABASE_KEY configured" || echo "❌ Missing SUPABASE_KEY"
```

### Step 4: Migration Status

// turbo

```bash
cd /Users/macbookprom1/mekong-cli
supabase db diff 2>/dev/null | head -10 || echo "No pending migrations"
```

### Step 5: Quick Health Check

// turbo

```bash
# Test API connectivity via Python
cd /Users/macbookprom1/mekong-cli
python3 -c "
from dotenv import load_dotenv
import os
load_dotenv()
url = os.getenv('SUPABASE_URL', 'NOT SET')
print(f'✅ Supabase URL: {url[:30]}...' if url != 'NOT SET' else '❌ SUPABASE_URL not set')
" 2>/dev/null || echo "Install: pip install python-dotenv"
```

## Troubleshooting

| Issue                | Fix                                                |
| -------------------- | -------------------------------------------------- |
| "Not logged in"      | `supabase login`                                   |
| "Not linked"         | `supabase link --project-ref jcbahdioqoepvoliplqy` |
| "Connection refused" | Check VPN/network, verify `.env` credentials       |
| "Migration failed"   | `supabase db reset` (⚠️ destroys data)             |

## Core Tables (AgencyOS)

```
contacts    → CRM identity management
deals       → Sales pipeline
invoices    → Billing & finance
invoice_items → Line item details
```

## Quick Commands

```bash
# Link project
supabase link --project-ref jcbahdioqoepvoliplqy

# Run migrations
supabase db push

# Open dashboard
supabase projects list
# Then visit: https://supabase.com/dashboard/project/jcbahdioqoepvoliplqy
```
