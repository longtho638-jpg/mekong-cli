---
description: description: Check FE-BE API synchronization status
---

# Claudekit Command: /sync

> Imported from claudekit-engineer

# /sync - Sync Command

> **MCP Integration**: Routes to `sync_server`

## Usage

```bash
/sync
```

## Features

- Verifies API contract alignment
- Checks Type definitions
- Validates Endpoints

## MCP Tools

- `sync_server.check_sync_status`
- `sync_server.sync_bridge`

## Architecture

Ensures `agentops-api.ts` (Frontend) matches `FastAPI` (Backend).

> 🏯 **"Thượng hạ đồng dục"** - Top-down alignment wins.
