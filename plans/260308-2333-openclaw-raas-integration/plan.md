---
title: "OpenClaw → RaaS Gateway Integration Plan"
description: "Route all OpenClaw API requests through RaaS Gateway for centralized usage metering"
status: pending
priority: P1
effort: 18h
branch: feature/openclaw-raas-integration
tags: [integration, raas, gateway, metering]
created: 2026-03-08
---

# OpenClaw → RaaS Gateway Integration Plan

## Overview
This plan outlines the implementation to route all OpenClaw API requests through the RaaS Gateway (`https://raas.agencyos.network`) for centralized usage metering. All HTTP calls from OpenClaw workers will be forwarded via the gateway while maintaining compatibility with AgencyOS dashboard analytics.

## Progress Tracking
- [ ] Phase 01: Add RaaS Gateway configuration
- [ ] Phase 02: Modify HTTP client to use gateway
- [ ] Phase 03: Add API key injection mechanism
- [ ] Phase 04: Add JWT validation for responses
- [ ] Phase 05: Add rate limit handling
- [ ] Phase 06: Integration testing and validation

## Key Dependencies
1. RaaS Gateway availability: `https://raas.agencyos.network`
2. JWT validation logic from `lib/raas-license-validator.js`
3. Existing OpenClaw worker architecture
4. API key formats: `mk_`, `raasjwt-`, `raas-`

## Success Criteria
- All OpenClaw API requests successfully routed through RaaS Gateway
- Proper API key injection and JWT validation
- Rate limit compliance implemented
- Fail-open policy maintained
- No disruption to existing functionality
- Performance benchmarks met (response time < 500ms)

## Timeline
- Estimated Duration: 18 hours
- Phases 1-3: Foundation setup (6 hours)
- Phases 4-5: Core integration (8 hours)
- Phase 6: Testing and validation (4 hours)