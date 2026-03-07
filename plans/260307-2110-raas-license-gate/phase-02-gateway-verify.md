---
title: "Phase 2: Gateway Verify Endpoint"
description: "Implement RaaS Gateway /v1/auth/verify endpoint for license validation"
status: pending
priority: P1
effort: 2h
---

# Phase 2: Gateway Verify Endpoint

## Context Links

- Related: `apps/raas-gateway/` — Cloudflare Worker gateway
- Related: `src/lib/raas-gate.ts` — Existing validation logic
- Related: `docs/HIEN_PHAP_ROIAAS.md` — Revenue architecture

## Overview

**Priority:** P1 (Critical Path)
**Status:** pending
**Description:** Implement `/v1/auth/verify` endpoint in RaaS Gateway for centralized license validation.

## Key Insights

- Gateway already exists at `apps/raas-gateway/index.js`
- Current validation is client-side only (TypeScript/Python)
- Need server-side validation for revoke checking + rate limiting
- User-agent tracking for analytics

## Requirements

### Functional

1. `POST /v1/auth/verify` endpoint
2. Request: `{ license_key, email?, machine_id? }`
3. Response: `{ valid, tier, features, expires_at, error }`
4. JWT decoding + signature verification
5. Revocation list check
6. Rate limiting per IP + per key
7. Audit logging

### Non-Functional

- P95 latency < 200ms
- Rate limit: 10 req/min per IP
- User-Agent parsing for device tracking
- Idempotent requests (same key = same response)

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                  RaaS Gateway (Cloudflare)                   │
│                                                              │
│  POST /v1/auth/verify                                        │
│  │                                                           │
│  ├─→ Rate Limit Check (10/min per IP)                       │
│  ├─→ JWT Decode + Verify (HS256)                            │
│  ├─→ Revocation List Check                                  │
│  ├─→ Expiration Check                                       │
│  ├─→ Audit Log (async)                                      │
│  └─→ Response: { valid, tier, features, expires_at }        │
│                                                              │
│  Dependencies:                                               │
│  - KV Store: LICENSE_REVOCATIONS                            │
│  - D1 Database: audit_logs                                  │
│  - Secret: JWT_SECRET_KEY                                   │
└──────────────────────────────────────────────────────────────┘
```

## Related Code Files

### Files to Create

- `apps/raas-gateway/src/handlers/auth-verify.ts` — Verify endpoint handler
- `apps/raas-gateway/src/middleware/rate-limiter.ts` — Rate limiting middleware
- `apps/raas-gateway/src/lib/jwt-verifier.ts` — JWT verification utilities
- `apps/raas-gateway/src/lib/revocation-checker.ts` — Revocation list check
- `apps/raas-gateway/src/lib/audit-logger.ts` — Async audit logging
- `apps/raas-gateway/src/lib/user-agent-parser.ts` — User-Agent parsing

### Files to Modify

- `apps/raas-gateway/index.js` — Add route registration
- `apps/raas-gateway/wrangler.toml` — Add KV/D1 bindings
- `apps/raas-gateway/package.json` — Add dependencies (@hono/jwt)

## Implementation Steps

### Step 1: JWT Verification Library (30min)

1. Add `@hono/jwt` dependency
2. Create `src/lib/jwt-verifier.ts`:
   ```typescript
   export interface JWTPayload {
     sub: string;      // Organization ID
     tier: string;     // free | pro | enterprise
     exp: number;      // Expiration timestamp
     iat: number;      // Issued at
     email: string;    // License holder email
     features: string[];
     jti: string;      // JWT ID (unique)
   }

   export function verifyJWT(token: string, secret: string): JWTPayload | null
   export function isRevoked(jti: string): Promise<boolean>
   ```

### Step 2: Rate Limiter (30min)

1. Create `src/middleware/rate-limiter.ts`:
   ```typescript
   interface RateLimitState {
     requests: number[];
     blockedUntil?: number;
   }

   export function checkRateLimit(
     ip: string,
     env: Env
   ): { allowed: boolean; retryAfter?: number }
   ```
2. Use Cloudflare KV for distributed rate limiting
3. Block for 5 minutes after 10 failed attempts

### Step 3: Auth Verify Handler (45min)

1. Create `src/handlers/auth-verify.ts`:
   ```typescript
   export async function handleAuthVerify(
     request: Request,
     env: Env
   ): Promise<Response> {
     // 1. Parse request body
     // 2. Check rate limit
     // 3. Verify JWT
     // 4. Check revocation
     // 5. Check expiration
     // 6. Log audit (async)
     // 7. Return response
   }
   ```
2. Response format:
   ```json
   {
     "valid": true,
     "tier": "pro",
     "features": ["premium_agents", "priority_support"],
     "expires_at": "2027-03-07T00:00:00Z",
     "email": "user@example.com"
   }
   ```

### Step 4: Revocation List (15min)

1. Create KV namespace `LICENSE_REVOCATIONS`
2. Implement `isRevoked(jti: string)`:
   ```typescript
   export async function isRevoked(jti: string, env: Env): Promise<boolean> {
     return await env.LICENSE_REVOCATIONS.get(jti) !== null;
   }
   ```

### Step 5: Audit Logger (30min)

1. Create D1 table `audit_logs`:
   ```sql
   CREATE TABLE audit_logs (
     id TEXT PRIMARY KEY,
     timestamp INTEGER NOT NULL,
     license_jti TEXT,
     action TEXT NOT NULL,
     result TEXT NOT NULL,
     ip_address TEXT,
     user_agent TEXT,
     details TEXT
   );
   ```
2. Implement async logger:
   ```typescript
   export async function logAudit(
     entry: AuditLogEntry,
     env: Env
   ): Promise<void>
   ```

### Step 6: User-Agent Parser (15min)

1. Create `src/lib/user-agent-parser.ts`:
   ```typescript
   export interface ClientInfo {
     client_type: 'cli' | 'sdk' | 'unknown';
     client_version?: string;
     os?: string;
     arch?: string;
   }

   export function parseUserAgent(ua: string): ClientInfo
   ```
2. Parse format: `mekong-cli/0.2.0 (darwin; arm64)`

## Success Criteria

- [ ] `POST /v1/auth/verify` returns valid JSON
- [ ] JWT verification works with HS256
- [ ] Revoked keys return `valid: false`
- [ ] Expired keys return `valid: false`
- [ ] Rate limiting triggers after 10 req/min
- [ ] Audit logs written to D1
- [ ] User-Agent parsed correctly
- [ ] P95 latency < 200ms (test with wrangler dev)

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cloudflare KV latency | Medium | Cache revocation list in memory |
| JWT secret rotation | Low | Support multiple secrets during rotation |
| Rate limit false positives | Medium | Higher limit for valid keys |

## Security Considerations

- JWT secret stored in Cloudflare Secrets
- No license keys in logs (only JTI)
- IP addresses anonymized (last octet removed)
- CORS restricted to mekong.dev domains

## Next Steps

→ Phase 3: Implement CLI validation middleware

## Todo List

- [ ] Add @hono/jwt dependency
- [ ] Create JWT verification library
- [ ] Create rate limiter middleware
- [ ] Create revocation checker
- [ ] Create auth-verify handler
- [ ] Create audit logger
- [ ] Create user-agent parser
- [ ] Update wrangler.toml with KV/D1 bindings
- [ ] Register route in index.js
- [ ] Test with wrangler dev
- [ ] Deploy to staging
