---
name: infra-hub-sdk
description: Unified infrastructure SDK — auth, identity, compliance, consent, edge computing, bridge connectors. Use for authentication, SSO, GDPR/SOC2 compliance, edge functions.
license: MIT
version: 1.0.0
---

# Infra Hub SDK Skill

Build secure, compliant infrastructure with unified auth, compliance, and edge computing facades.

## When to Use

- Authentication and identity management
- SSO and multi-tenant auth
- GDPR, CCPA, SOC2 compliance automation
- Consent management and audit trails
- Edge function deployment
- Bridge connectors between systems

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/infra-hub-sdk/auth` | AuthFacade | Auth, identity, SSO |
| `@agencyos/infra-hub-sdk/compliance` | ComplianceFacade | GDPR, SOC2, consent |
| `@agencyos/infra-hub-sdk/edge` | EdgeFacade | Edge functions, bridges |

## Underlying Packages

| Package | Purpose |
|---------|---------|
| `@agencyos/vibe-auth` | Authentication engine |
| `@agencyos/vibe-identity` | Identity management |
| `@agencyos/vibe-compliance` | Compliance frameworks |
| `@agencyos/vibe-compliance-auto` | Automated auditing |
| `@agencyos/vibe-consent` | Consent management |
| `@agencyos/vibe-edge` | Edge computing |
| `@agencyos/vibe-bridge` | System connectors |
