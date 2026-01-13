# 🌐 @agencyos/vibe

> **8 Planets, 1 Package**

## Install

```bash
pnpm add @agencyos/vibe
```

## Usage

```typescript
import { 
  vibeUI, vibeAnalytics, vibeAgents, vibeCRM,
  vibeOps, vibeDev, vibeMarketing, vibeRevenue,
  treasury, tracker
} from '@agencyos/vibe';

// UI
vibeUI.colors.primary

// Agents
vibeAgents.orchestrator.register(agent)

// CRM
vibeCRM.crm.createDeal(deal)

// Treasury
treasury.collect('saturn', 'agent_call', 100)

// Workflow
tracker.complete('user1', 'activate')
```

## Planets

| Planet | Module | Purpose |
|--------|--------|---------|
| 🔵 Venus | `vibeUI` | Design |
| ⚪ Uranus | `vibeAnalytics` | Data |
| 🟣 Saturn | `vibeAgents` | AI |
| 🟠 Jupiter | `vibeCRM` | Sales |
| 🔴 Mars | `vibeOps` | Deploy |
| 🟢 Earth | `vibeDev` | Code |
| 🟡 Mercury | `vibeMarketing` | Growth |
| 🟤 Neptune | `vibeRevenue` | Finance |

---

*☀️ AgencyOS Solar System*
