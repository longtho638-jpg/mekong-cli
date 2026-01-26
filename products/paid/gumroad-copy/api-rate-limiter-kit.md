# API Rate Limiter Kit - Gumroad Product Page

## Headline

**⚡ API Rate Limiter Kit - Redis-Powered Rate Limiting in 5 Minutes**

## Price: $37

## Short Description

Production-grade rate limiting for APIs. Sliding window, token bucket, IP-based and user-based limits. Protect your API from abuse with battle-tested algorithms.

## Bullet Features

- 🪟 **Sliding Window** - Smooth rate limiting without thundering herd
- 🪣 **Token Bucket** - Burst-friendly with configurable refill
- 🌍 **IP + User Limiting** - Layer protection strategies
- 📊 **Rate Limit Headers** - Standard X-RateLimit headers
- 🔴 **Redis Powered** - Distributed, fast, production-ready

## Tech Stack

`TypeScript` `Redis` `Next.js API Routes` `Express` `Fastify`

## What's Included

```
📁 api-rate-limiter-kit/
├── lib/
│   ├── sliding-window.ts
│   ├── token-bucket.ts
│   ├── fixed-window.ts
│   └── rate-limiter.ts
├── middleware/
│   ├── nextjs-middleware.ts
│   ├── express-middleware.ts
│   └── fastify-plugin.ts
├── utils/
│   └── headers.ts
└── README.md
```

## Usage

```typescript
import { rateLimit } from "./lib/rate-limiter";

export const config = rateLimit({
    limit: 100,
    window: "15m",
    keyPrefix: "api",
});
```

## Perfect For

- Public APIs needing protection
- SaaS apps with usage tiers
- Any API facing the internet

## Money-Back Guarantee

30-day no-questions-asked refund.

---

**🏯 Built with Antigravity • Ship faster, earn more**
</Parameter>
<parameter name="Complexity">3
