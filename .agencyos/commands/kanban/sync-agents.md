---
description: Sync agent status with Kanban board
---

# 🔄 Sync Agents

Updates task status on the Kanban board based on running agents.

## Usage

```bash
/kanban sync-agents
```

## Implementation

```python
import asyncio
from antigravity.vibe_kanban import VibeBoardClient, AgentOrchestrator

async def run():
    client = VibeBoardClient()
    orchestrator = AgentOrchestrator(client)
    
    print("🔄 Syncing agent status...")
    
    # Sync all known agents
    agents = orchestrator.AGENTS.keys()
    for agent in agents:
        await orchestrator.sync_agent_status(agent)
        
    print("✅ Sync complete.")

if __name__ == "__main__":
    asyncio.run(run())
```
