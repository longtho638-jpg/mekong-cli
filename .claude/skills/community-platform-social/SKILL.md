---
name: community-platform-social
description: "Community building platforms, forums, member management, content moderation, gamification — activate when building online communities, membership sites, discussion forums, or social features within SaaS products"
source: research-driven-2026
license: MIT
version: 1.0.0
---

# Community Platform & Social — Skill

> Creator-led communities surpassed $3B in platform revenue in 2025 as creators migrated from ad-dependent social media to owned subscription communities; AI-assisted moderation became mandatory for platforms at scale.

## When to Activate
- Building a community platform, forum, or membership site from scratch
- Adding social features (comments, reactions, groups, DMs) to an existing SaaS
- Implementing content moderation at scale (AI + human review queues)
- Designing gamification systems (points, badges, leaderboards, streaks)
- Creating member onboarding flows and engagement automation
- Integrating community with payment/subscription systems (gating by tier)
- Building analytics for community health (DAU, retention, churn signals)

## Core Capabilities
| Area | Description | Key APIs/Tools |
|------|-------------|----------------|
| Forum & Discussions | Threaded posts, categories, tags, search, rich text | Discourse API, Bettermode, vanilla forums |
| Member Management | Profiles, roles, permissions, member directory, SSO | Circle API, Mighty Networks, Auth0 |
| Content Moderation | Spam detection, toxicity scoring, human review queue | Perspective API, OpenAI moderation, Sightengine |
| Gamification | Points engine, badge awards, leaderboard, streak tracking | Custom or Badgr, Open Badges standard |
| Real-Time Engagement | Live chat, presence indicators, notifications, DMs | Stream Chat API, Sendbird, Ably |
| Access Gating | Subscription-tier content access, course/event locking | Circle Spaces gating, Memberful, Stripe billing |

## Architecture Patterns
```
[Member Auth] — SSO (Auth0/Clerk) + role assignment
      │
      ▼
[Content Layer]
      ├── Posts/Threads → PostgreSQL + full-text search
      ├── Rich Media → S3 + CDN (images, video embeds)
      └── Real-Time → WebSocket (Ably/Pusher) for live feed
      │
      ▼
[Moderation Pipeline]
      ├── Pre-publish: Perspective API toxicity score
      ├── Spam filter: regex + ML classifier
      └── Human queue: flagged content → mod dashboard
      │
      ▼
[Engagement Engine]
      ├── Points: awarded on post, reply, reaction, login streak
      ├── Badges: event-triggered (first post, 30-day streak)
      └── Notifications: digest email + push (FCM/APNs)
      │
      ▼
[Analytics] — MAU, content health, member churn risk scoring
```

```typescript
// Stream Chat: create community channel and send message
import { StreamChat } from "stream-chat";

const serverClient = StreamChat.getInstance(API_KEY, API_SECRET);

// Create a topic channel
const channel = serverClient.channel("messaging", "general-discussion", {
  name: "General Discussion",
  members: ["user_123", "user_456"],
  created_by_id: "admin_001",
});
await channel.create();

// Send message with moderation metadata
await channel.sendMessage({
  text: "Welcome to the community!",
  user_id: "admin_001",
  mentioned_users: [],
});
```

## Key Providers & APIs
| Provider | Use Case | Pricing Model |
|----------|----------|---------------|
| Circle | All-in-one community SaaS (spaces, events, courses, DMs) | From $89/mo (Basic) |
| Discourse | Open-source forum, self-hosted or managed | Free OSS; hosted from $100/mo |
| Mighty Networks | Creator communities with courses and native mobile | From $41/mo (Community plan) |
| Bettermode | Embeddable community widgets, white-label, API-first | From $49/mo; API access on Growth |
| Tribe (now Bettermode) | API-first community platform for SaaS embedding | Usage-based on cloud plan |

## Related Skills
- `backend-development` — Real-time WebSocket APIs, notification systems, role-based access
- `ai-safety-alignment-governance` — Content moderation pipelines, toxicity classification
- `databases` — Social graph storage, full-text search (PostgreSQL/Elasticsearch)
