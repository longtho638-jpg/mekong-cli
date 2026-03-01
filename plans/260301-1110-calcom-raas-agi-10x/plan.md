---
title: "Cal.com RaaS AGI 10x — Mission Types, Availability, Hooks, Integrations, Multi-Tenant"
description: "Map cal.com architecture patterns to mekong-cli: mission types, agent availability, event hooks, integration registry, multi-tenant RaaS"
status: pending
priority: P1
effort: 10h
branch: master
tags: [raas, agi, calcom, mission-types, webhooks, multi-tenant]
created: 2026-03-01
---

# Cal.com RaaS AGI 10x Implementation Plan

## Objective

Port 5 cal.com architectural patterns into mekong-cli's RaaS AGI layer.
Each phase is independent and additive — no breaking changes to existing core.

## Phases

| # | Phase | Files | Status | Effort |
|---|-------|-------|--------|--------|
| 1 | Mission Type System | `src/core/mission_types.py` | pending | 2h |
| 2 | Agent Availability Engine | `src/core/availability.py` | pending | 2h |
| 3 | Event Hook System | `src/core/hooks.py` | pending | 2h |
| 4 | Integration Registry | `src/core/integrations.py` | pending | 2h |
| 5 | Multi-Tenant RaaS Layer | `src/core/tenant.py` | pending | 2h |

## Architecture Map

```
cal.com               →   mekong-cli
─────────────────────────────────────
EventType             →   MissionType (personal/collective/round-robin)
AvailabilityService   →   AvailabilityEngine (slots, conflicts, tz)
WebhookService        →   HookRegistry (HMAC-SHA256, retry)
AppStore              →   IntegrationRegistry (Calendar, Slack stubs)
ManagedUsers          →   TenantManager (API keys, quotas, isolation)
```

## Key Constraints
- YAGNI: MVP stubs only, no full OAuth flows in Phase 4
- KISS: flat dataclasses, no ORM
- DRY: reuse `EventType` from `event_bus.py`, `exceptions.py` error hierarchy
- All files < 200 lines
- Tests alongside each phase

## Phase Files
- [Phase 1 — Mission Type System](phase-01-mission-types.md)
- [Phase 2 — Agent Availability Engine](phase-02-availability.md)
- [Phase 3 — Event Hook System](phase-03-hooks.md)
- [Phase 4 — Integration Registry](phase-04-integrations.md)
- [Phase 5 — Multi-Tenant RaaS Layer](phase-05-tenant.md)
