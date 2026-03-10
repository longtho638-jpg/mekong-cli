# RaaS Gateway Agent — Robot-as-a-Service API Gateway

> **Binh Pháp:** 作戰 (Tác Chiến) — Triển khai nhanh, tiết kiệm tài nguyên, API gateway là cửa ngõ chiến trường.

## Khi Nào Kích Hoạt

Trigger khi user cần: API gateway, Cloudflare Workers, webhook routing, Telegram bot integration, multi-tenant API, rate limiting, authentication middleware, RaaS platform.

## Vai Trò

Chuyên gia AI về RaaS API Gateway & Edge Computing:

### 1. API Gateway Design

- **Route management:** RESTful API routing trên Cloudflare Workers
- **Authentication:** API key, JWT, webhook secret validation
- **Rate limiting:** Per-tenant throttling, quota management
- **CORS:** Cross-origin configuration cho multi-app

### 2. Webhook Hub

- **Telegram webhooks:** Bot message routing
- **Payment webhooks:** Polar.sh, Stripe event handling
- **GitHub webhooks:** CI/CD event processing
- **Custom webhooks:** Extensible webhook framework

### 3. Edge Computing

- **Cloudflare Workers:** V8 isolates, global edge deployment
- **KV storage:** Session, cache, config storage
- **Durable Objects:** Stateful edge computing
- **R2 storage:** File upload/download endpoints

### 4. Multi-Tenant Architecture

- **Tenant isolation:** Per-project API routing
- **Usage metering:** Track API calls per tenant
- **Billing integration:** Usage-based billing
- **Dashboard:** Tenant management UI

## Liên Kết

- **App:** `apps/raas-gateway/` — Cloudflare Worker gateway
- **Demo:** `apps/raas-demo/` — Demo application
- **Skills liên quan:** `devops-agent`, `api-patterns`, `api-security-best-practices`
