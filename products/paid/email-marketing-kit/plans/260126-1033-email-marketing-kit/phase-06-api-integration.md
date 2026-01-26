# Phase 06: API & Integration

> **Status**: Pending
> **Priority**: Medium
> **Dependencies**: Phase 01-05

## Overview
Since this is a "Kit", developers will likely want to integrate it into their own SaaS (e.g., "Send welcome email when user signs up"). This phase focuses on exposing a clean, documented REST API and Webhooks for external systems.

## Key Insights
- **Developer Experience (DX)**: The API must be intuitive.
- **Authentication**: API Keys are standard for machine-to-machine communication.
- **Transactional vs. Marketing**: The system handles both. The API is primary for transactional (single send).

## Requirements
### Functional
- **Public API**:
  - `POST /v1/send`: Send transactional email.
  - `POST /v1/subscribers`: Add/Update subscriber.
  - `GET /v1/campaigns`: List campaigns.
- **Webhooks (Outbound)**: Notify external app when event occurs (e.g., user unsubscribes).
- **API Key Management**: Generate, Revoke keys.

### Non-Functional
- **Documentation**: OpenAPI (Swagger) auto-generated.
- **Performance**: Async endpoint for sending (returns 202 Accepted).

## Architecture
- **Auth**: `APIKeyHeader` dependency.
- **Versioning**: URL versioning (`/api/v1/...`).

## Implementation Steps
1. **API Key System**
   - Model `ApiKey` (key_hash, name, permissions).
   - Dependency `get_current_app` (validates key).

2. **Transactional Endpoint**
   - High-priority queue for single emails.
   - Immediate rendering and validation.

3. **Outbound Webhooks**
   - Model `WebhookEndpoint` (url, events_subscribed).
   - Event dispatcher to POST JSON to external URLs on specific events (Unsubscribe, Bounce).

4. **Documentation**
   - Enhance FastAPI docs with examples.
   - Write integration guide (Python/Node.js examples).

## Success Criteria
- [ ] External app can trigger an email via API.
- [ ] External app receives a webhook when that email bounces.
- [ ] Invalid API keys are rejected.

## Security Considerations
- Hash API keys in DB.
- Rate limit API endpoints to prevent abuse.
