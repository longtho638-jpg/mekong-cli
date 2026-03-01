---
name: gaming-hub-sdk
description: Unified Gaming SDK — esports tournament management, matchmaking, in-game economy, leaderboards, player progression. Use for gaming platforms, esports apps, game studios.
license: MIT
version: 1.0.0
---

# Gaming Hub SDK Skill

Build gaming platforms, esports tournament systems, and in-game economy tools.

## When to Use

- Esports tournament bracket and scheduling
- Real-time matchmaking and skill-based ranking
- In-game economy (virtual currency, items, marketplace)
- Player progression, achievements, and leaderboards
- Game analytics and anti-cheat integration
- Streaming and spectator mode APIs

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/gaming-hub-sdk/tournament` | TournamentFacade | Brackets, scheduling, prizes |
| `@agencyos/gaming-hub-sdk/matchmaking` | MatchmakingFacade | Queues, MMR, lobbies |
| `@agencyos/gaming-hub-sdk/economy` | EconomyFacade | Currency, items, marketplace |

## Underlying Packages

| Package | Purpose |
|---------|---------|
| `@agencyos/vibe-gaming` | Core gaming engine |
| `@agencyos/vibe-esports` | Esports management |
| `@agencyos/vibe-game-economy` | In-game economy |

## Usage

```typescript
import { createTournamentManager, createMatchmaker, createEconomyEngine } from '@agencyos/gaming-hub-sdk';

const tournament = await createTournamentManager().create({
  name: 'Summer Championship',
  format: 'double-elimination',
  maxTeams: 16,
  prizePool: 10000,
});

const match = await createMatchmaker().queue({
  playerId: 'player_123',
  gameMode: 'ranked',
  mmr: 1850,
});

const tx = await createEconomyEngine().purchase({
  playerId: 'player_123',
  itemId: 'skin_legendary_001',
  currency: 'gems',
  price: 500,
});
```

## Key Types

- `Tournament` — bracket structure with rounds and match schedule
- `MatchSession` — lobby with players, map, and result reporting
- `PlayerProfile` — MMR, rank tier, win/loss stats
- `EconomyTransaction` — item transfer with audit trail

## Related Skills

- `community-hub` — Social features and communities
- `commerce-hub-sdk` — Virtual marketplace patterns
