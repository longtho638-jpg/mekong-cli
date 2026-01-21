---
description: Check FE-BE API synchronization status
---

# /sync - FE-BE Sync Checker

> **Verify Frontend-Backend API connection**

## Quick Check

// turbo

```bash
# Use MCP tool: sync/check_sync
mekong check-sync
```

## What It Shows

- **FE API Calls**: Endpoints called from agentops-api.ts
- **BE Endpoints**: All FastAPI routes
- **Sync Status**: Connection verification

## Architecture

```
┌──────────────────┐     ┌──────────────────┐
│   FRONTEND       │     │   BACKEND        │
│   localhost:3000 │────▶│   localhost:8000 │
├──────────────────┤     ├──────────────────┤
│ agentops-api.ts  │     │ FastAPI routers  │
│ useAgentsAPI.ts  │     │ 58 endpoints     │
└──────────────────┘     └──────────────────┘
```

## Run Backend

// turbo

```bash
python3 server.py
```

## Run Frontend

// turbo

```bash
cd apps/dashboard && pnpm dev
```

## 🏯 Binh Pháp

> "Thượng hạ đồng dục" - Top-down alignment wins.
