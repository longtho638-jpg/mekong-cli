---
name: sports-analytics-platform
description: "Sports data analytics, player performance tracking, betting odds, fantasy sports, computer vision for sports — activate when building sports data applications, betting platforms, fantasy sports engines, or athlete monitoring systems"
source: research-driven-2026
license: MIT
version: 1.0.0
---

# Sports Analytics Platform — Skill

> Real-time sports data APIs and computer-vision-based player tracking became table stakes in 2025; US sports betting legalization in 38 states created a $12B addressable market for data-driven odds and DFS platforms.

## When to Activate
- Building a sports betting platform requiring live odds and event data
- Developing fantasy sports draft tools with player performance analytics
- Implementing computer vision player tracking or event detection in video
- Creating athlete performance dashboards for coaches and sports scientists
- Integrating real-time scores, standings, and statistics into an application
- Building sports media products (live blogs, data widgets, game recaps)
- Designing wearable sensor data pipelines for athlete load management

## Core Capabilities
| Area | Description | Key APIs/Tools |
|------|-------------|----------------|
| Live Sports Data | Real-time scores, play-by-play, lineups, standings | Sportradar, Stats Perform, ESPN API |
| Betting Odds | Pre-game/in-play odds, markets, settlement | Sportradar Odds, Kambi, Pinnacle API |
| Fantasy Sports | DFS scoring, player projections, lineup optimizer | FantasyData, Sleeper API, DraftKings |
| Computer Vision | Player tracking, action recognition, highlight extraction | Second Spectrum, Catapult, Pixellot |
| Athlete Monitoring | GPS load, heart rate, sprint data from wearables | Catapult Vector, STATSports, Polar Team |
| Video Analysis | Automated tagging, clip search, tactical drawing | Hudl API, Veo, Dartfish |

## Architecture Patterns
```
[Data Sources]
      ├── Sportradar Push API (WebSocket/webhook) — live events
      ├── Wearable GPS sensors (BLE → edge device → cloud)
      └── Computer Vision pipeline (video → inference → events)
      │
      ▼
[Ingestion Layer] — Kafka / event streaming
      │ normalized SportEvent schema
      ▼
[Analytics Engine]
      ├── Real-time: player stats aggregation, live odds calc
      ├── Batch: xG models, VAEP, player ratings (Elo/TrueSkill)
      └── ML: injury risk, fatigue index, tactical clustering
      │
      ▼
[API Layer] — REST + GraphQL + WebSocket subscriptions
      │
      ├── [Fan App] — live scores, stats widgets
      ├── [Betting Platform] — live odds, cash-out
      ├── [Fantasy App] — DFS lineup optimizer
      └── [Coaching Dashboard] — player load, tactical analysis
```

```python
# Sportradar real-time push subscription
import websockets, json, asyncio

async def stream_live_events(sport: str, match_id: str):
    uri = f"wss://api.sportradar.com/soccer/trial/v4/stream/events?api_key={SR_API_KEY}"
    async with websockets.connect(uri) as ws:
        await ws.send(json.dumps({"event": "subscribe", "channel": f"match:{match_id}"}))
        async for message in ws:
            event = json.loads(message)
            if event.get("type") == "score_change":
                await handle_goal_event(event)
            elif event.get("type") == "odds_change":
                await update_live_odds(event)
```

## Key Providers & APIs
| Provider | Use Case | Pricing Model |
|----------|----------|---------------|
| Sportradar | Global sports data, live odds, betting feeds | Tiered licensing (sport + region) |
| Stats Perform (Opta) | Deep football/basketball stats, AI coaching tools | Enterprise licensing |
| Second Spectrum | NBA/MLS official tracking, player movement data | League partnership + licensing |
| Catapult | Wearable GPS for athlete load and performance | Hardware + cloud subscription |
| Hudl | Video analysis platform, API for team performance | Per-seat SaaS; API add-on |

## Related Skills
- `backend-development` — Real-time WebSocket event streaming and API design
- `databases` — Time-series athlete metrics, geospatial tracking (PostGIS)
- `vector-database-engineering` — Semantic search over play libraries and video embeddings
