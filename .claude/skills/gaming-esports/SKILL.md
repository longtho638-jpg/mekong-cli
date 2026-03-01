---
name: gaming-esports
description: Game engines, BaaS, multiplayer networking, monetization, esports tournaments, analytics, anti-cheat, cloud gaming. Use for game dev, esports platforms, gaming infrastructure.
license: MIT
version: 1.0.0
---

# Gaming & Esports Skill

Build games, esports platforms, game backend services, and gaming infrastructure with modern engines and LiveOps tools.

## When to Use

- Game development with Unity, Unreal, Godot, Bevy
- Game Backend-as-a-Service (BaaS) setup
- Multiplayer networking and matchmaking
- Game monetization (IAP, battle pass, ads)
- Esports tournament management
- Game analytics and player behavior tracking
- Anti-cheat implementation
- Cloud gaming infrastructure
- LiveOps (remote config, A/B testing, events)
- Game audio middleware integration

## Tool Selection

| Need | Choose |
|------|--------|
| Game engine (versatile) | Unity 6.3 (LTS, C#), Unreal 5.7 (C++/Blueprints) |
| Game engine (open-source) | Godot 4.x (GDScript/C#), Bevy 0.18 (Rust ECS) |
| Game BaaS | PlayFab (MS, full-stack), Nakama (open-source, social) |
| BaaS (enterprise) | AccelByte (cross-platform), Pragma (modern arch) |
| Multiplayer networking | Photon Fusion (state-sync), Mirror (free, P2P) |
| Server orchestration | Agones (Kubernetes game servers) |
| Monetization | StoreKit/Google Play (IAP), Unity Mediation (ads) |
| Esports/tournaments | Battlefy, Toornament, FACEIT (matchmaking) |
| Analytics | GameAnalytics (indie), Amplitude (behavioral) |
| Anti-cheat | EasyAntiCheat (hybrid), BattlEye (kernel-level) |
| Cloud gaming | GeForce NOW, Xbox Cloud Gaming |
| LiveOps | PlayFab LiveOps, Beamable, ByteBrew |
| Audio middleware | Wwise (AAA), FMOD (indie-friendly) |

## Game Architecture

```
Game Client (Unity/Unreal/Godot)
    ↓ (UDP/TCP/WebSocket)
┌────────────────────────────────────────────┐
│  Game Server Layer                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Match-   │  │ Game     │  │ Anti-    │ │
│  │ making   │  │ Logic    │  │ Cheat    │ │
│  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────┬──────────────────────┘
                      ↓
┌────────────────────────────────────────────┐
│  Backend Services (BaaS)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Player   │  │ Economy  │  │ LiveOps  │ │
│  │ Profile  │  │ & Store  │  │ Config   │ │
│  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────┬──────────────────────┘
                      ↓
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Analytics│  │ Leader-  │  │ Social   │
│ Events   │  │ boards   │  │ Features │
└──────────┘  └──────────┘  └──────────┘
```

## PlayFab Integration

```csharp
// Unity C# — PlayFab login + leaderboard
using PlayFab;
using PlayFab.ClientModels;

PlayFabClientAPI.LoginWithCustomID(new LoginWithCustomIDRequest {
    CustomId = SystemInfo.deviceUniqueIdentifier,
    CreateAccount = true
}, result => {
    Debug.Log($"Logged in: {result.PlayFabId}");

    // Submit score to leaderboard
    PlayFabClientAPI.UpdatePlayerStatistics(
        new UpdatePlayerStatisticsRequest {
            Statistics = new List<StatisticUpdate> {
                new StatisticUpdate { StatisticName = "HighScore", Value = 9500 }
            }
        },
        _ => Debug.Log("Score submitted"),
        error => Debug.LogError(error.GenerateErrorReport())
    );
}, error => Debug.LogError(error.GenerateErrorReport()));
```

## Monetization Models

| Model | Conversion Rate | Best For |
|-------|----------------|----------|
| Free-to-Play + IAP | 2-5% paying users | Mobile, casual |
| Battle Pass | 12-18% conversion | Live service games |
| Premium ($) | N/A | AAA, indie story |
| Subscription | 5-10% of MAU | Cloud gaming, MMO |
| Ad-supported | $5-20 eCPM | Casual, hyper-casual |

## Key Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| DAU/MAU | Daily active / Monthly active | > 20% |
| ARPDAU | Revenue / DAU | Per genre benchmark |
| Retention D1/D7/D30 | Return users / New users | D1>40%, D7>15%, D30>5% |
| Session Length | Avg play time per session | Genre-dependent |
| CCU Peak | Max concurrent users | Infrastructure planning |
| Server Tick Rate | Updates per second | 20-128 Hz (genre) |
| Matchmaking Time | Queue → Match found | < 60s |
| Cheat Detection Rate | Detected / Total cheaters | > 95% |

## References

- Unity: https://docs.unity3d.com
- Unreal Engine: https://dev.epicgames.com
- Godot: https://docs.godotengine.org
- PlayFab: https://docs.microsoft.com/gaming/playfab
- Nakama: https://heroiclabs.com/docs
- Photon: https://doc.photonengine.com
- Agones: https://agones.dev
- GameAnalytics: https://gameanalytics.com/docs
- Wwise: https://www.audiokinetic.com/library
- FMOD: https://www.fmod.com/docs
