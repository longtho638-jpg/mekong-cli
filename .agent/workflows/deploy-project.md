---
description: How to deploy AgencyOS projects to production
---

# Deploy Project

## Overview
Deploy your AgencyOS project to production (Vercel, Cloud Run, or Docker).

## Prerequisites
- Project built and tested locally
- Git repository initialized
- Deployment credentials configured

## Step 1: Build for Production
```bash
# Frontend (Next.js)
npm run build

# Backend (Python)
python -m pytest tests/ -v
```

## Step 2: Choose Deployment Target

### Option A: Vercel (Frontend)
// turbo
```bash
vercel deploy --prod --force
```

### Option B: Google Cloud Run (Backend)
// turbo
```bash
python main.py deploy
```

### Option C: Docker
// turbo
```bash
docker build -t my-project .
docker run -p 8000:8000 my-project
```

## Step 3: Verify Deployment
// turbo
```bash
curl -sS -o /dev/null -w "%{http_code}" https://your-domain.com/health
```

## Step 4: Monitor
- Check Vercel Functions logs
- Monitor Cloud Run logs
- Set up alerts for errors

## Rollback (if needed)
```bash
# Vercel rollback
vercel rollback

# Git rollback
git revert HEAD
git push
```

## 🏯 Binh Pháp Alignment
"兵法" (Military Strategy) - Deploy with precision, retreat with grace.
