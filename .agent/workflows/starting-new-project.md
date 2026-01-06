---
description: How to start a new project using AgencyOS bootstrap
---

# Starting a New Project

## Overview
Build a production-ready project in under 1 hour using AgencyOS bootstrap.

## Prerequisites
- Python 3.10+ installed
- Node.js 18+ (for frontend projects)
- AgencyOS CLI: `git clone https://github.com/longtho638-jpg/mekong-cli.git`

## Step 1: Initialize Project

### Option A: Using bootstrap command (Recommended)
```bash
# Navigate to mekong-cli
cd mekong-cli

# Run bootstrap
python main.py bootstrap

# Answer interactive questions about:
# - Project name
# - Tech stack (Node.js/Python/Next.js)
# - Database (PostgreSQL/MySQL/SQLite)
# - Authentication (JWT/OAuth2/Session)
```

### Option B: Using init command
```bash
python main.py init my-project
cd my-project
```

## Step 2: Review Generated Code
```bash
# Check project structure
ls -la

# Review key files
cat README.md
cat .env.example
```

## Step 3: Setup Environment
```bash
# Copy environment template
cp .env.example .env

# Edit with your credentials
# For Supabase projects:
# SUPABASE_URL=your-url
# SUPABASE_ANON_KEY=your-key
```

## Step 4: Run Tests
```bash
# Run test suite
python -m pytest tests/ -v

# Or for Node.js projects
npm test
```

## Step 5: Start Development Server
```bash
# Python projects
python main.py

# Node.js projects
npm run dev

# Next.js projects
npm run dev
```

## Step 6: Add Custom Features
Use AgencyOS CLI to generate new features:
```bash
python main.py generate-feature user-profiles
```

## Step 7: Documentation
```bash
# Generate docs
python main.py docs:init

# Update docs after changes
python main.py docs:update
```

## Step 8: Commit Changes
```bash
git add -A
git commit -m "feat: initial project setup with AgencyOS"
git push
```

## Step 9: CI/CD Setup
GitHub Actions workflow is auto-generated in `.github/workflows/`

## Step 10: Deploy
// turbo
```bash
# Deploy to Vercel (frontend)
vercel deploy --prod

# Deploy to Cloud Run (backend)
python main.py deploy
```

## 🏯 Binh Pháp Alignment
"始計篇" (Initial Assessment) - Complete strategy before action.

## Key Takeaways
1. Use bootstrap for new projects - saves hours
2. Review generated code before modifying
3. Test immediately - catch issues early
4. Document as you go
5. Deploy early - find production issues sooner
