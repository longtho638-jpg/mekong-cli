# RaaS License Middleware - Usage Guide

> Framework-agnostic license validation for Express, Next.js, Fastify, Hono

---

## Installation

Middleware đã tích hợp sẵn trong `lib/raas-gate.ts` và `lib/raas-middleware.ts`.

---

## Quick Start

### Express.js

```typescript
import { expressLicenseMiddleware } from './lib/raas-middleware';

// Protect all /api/premium routes
app.use('/api/premium/*', expressLicenseMiddleware('PRO'));

// Or use manually
app.get('/api/premium/data', async (req, res) => {
  const middleware = createLicenseMiddleware('PRO');
  const allowed = await middleware({
    getHeader: (name) => req.headers[name],
    getIP: () => req.ip,
    deny: (code, body) => res.status(code).json(body),
    allow: () => {},
  });
  if (!allowed) return;

  // Protected logic here
});
```

### Next.js Pages Router

```typescript
// pages/api/premium/data.ts
import { withLicenseGuard } from '../../lib/raas-middleware';

export default withLicenseGuard(async (req, res) => {
  // req.license available
  res.json({ data: 'premium content' });
}, 'PRO');
```

### Next.js App Router (Middleware)

```typescript
// middleware.ts
import { nextJsMiddleware } from './lib/raas-middleware';

export default function middleware(request: Request) {
  return nextJsMiddleware(request, 'PRO');
}

export const config = {
  matcher: '/api/premium/:path*',
};
```

### Fastify

```typescript
import { fastifyLicensePlugin } from './lib/raas-middleware';

server.register(fastifyLicensePlugin, { tier: 'PRO' });

// Routes now require valid license
server.get('/api/premium/data', async (req, reply) => {
  // req.license available
  return { data: 'premium' };
});
```

### Hono

```typescript
import { Hono } from 'hono';
import { honoLicenseMiddleware } from './lib/raas-middleware';

const app = new Hono();

app.use('/api/premium/*', honoLicenseMiddleware('PRO'));

app.get('/api/premium/data', (c) => {
  return c.json({ data: 'premium' });
});
```

---

## License Key Sources

Middleware checks in order:

1. `X-API-Key` header
2. `Authorization: Bearer <key>` header
3. `RAAS_LICENSE_KEY` environment variable

---

## Error Responses

### 403 - No License

```json
{
  "error": "License Required",
  "message": "Valid license key required",
  "requiredTier": "PRO",
  "currentTier": "FREE"
}
```

### 403 - Insufficient Tier

```json
{
  "error": "Insufficient License Tier",
  "message": "This endpoint requires PRO license",
  "requiredTier": "PRO",
  "currentTier": "FREE"
}
```

---

## Tier Levels

| Tier | Level | Features |
|------|-------|----------|
| FREE | 0 | Basic strategies, live trading |
| PRO | 1 | + ML models, advanced backtest |
| ENTERPRISE | 2 | + All features, priority support |

---

## Custom Validation

```typescript
import { createLicenseMiddleware, LicenseTier } from './raas-middleware';

const middleware = createLicenseMiddleware(LicenseTier.PRO);

// Use in any framework
const allowed = await middleware({
  getHeader: (name) => getRequestHeader(name),
  getIP: () => getClientIP(),
  deny: (code, body) => sendResponse(code, body),
  allow: () => {},
});

if (allowed) {
  // Proceed with protected logic
}
```

---

## Logging

All validation attempts logged via `LicenseService`:

```typescript
// Audit logs available via database (PHASE 2)
GET /api/v1/licenses/:id/audit
```

---

## Related Files

- `src/lib/raas-gate.ts` - Core LicenseService
- `src/lib/raas-middleware.ts` - Framework adapters
- `src/api/routes/license-management-routes.ts` - Admin API
