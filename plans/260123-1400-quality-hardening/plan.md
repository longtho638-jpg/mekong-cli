---
title: Quality Hardening & Resilience
description: Increasing test coverage, hardening dependencies, and implementing chaos testing for AgencyOS Engine.
status: in-progress
priority: P1
effort: Large
branch: main
tags: quality, testing, hardening, resilience
created: 260123
---

# Phase 21: Quality Hardening & Resilience

## Overview
**Goal**: Increase test coverage to >80%, implement regression suites, and harden dependencies.
**Priority**: P1
**Status**: In Progress

## Scope
- Unit Tests for `antigravity` core.
- Integration Tests for `backend` API.
- Dependency audit (npm/pip).
- Chaos testing script skeleton.

## Key Insights
- Current backend coverage is around 46%.
- Antigravity core requires more granular unit tests for swarm orchestration.
- Dependency drift and vulnerabilities need automated checks.

## Architecture
- **Testing Framework**: `pytest` for backend/antigravity core.
- **Coverage**: `pytest-cov`.
- **Hardening**: `safety` (Python), `npm audit` (JS).
- **Chaos**: Custom script to simulate service drops.

## Implementation Steps
1. [ ] **Dependency Audit**: Run safety and npm audit, fix critical vulnerabilities.
2. [ ] **Unit Test Expansion**: Target `antigravity/core` modules (swarm, router, telemetry).
3. [ ] **Integration Test Expansion**: Target `backend/api/routers` (crm, franchise, monitor).
4. [ ] **Regression Suites**: Create "Golden Datasets" for agent output validation.
5. [ ] **Chaos Testing Skeleton**: Implement `chaos_monkey.py` to simulate agent timeouts.

## Success Criteria
- [ ] Backend coverage > 80%.
- [ ] Antigravity core coverage > 75%.
- [ ] Zero critical vulnerabilities in dependencies.
- [ ] Functional chaos testing script.

## Risk Assessment
- Increasing coverage may reveal hidden bugs (actually a benefit).
- Dependency updates might introduce breaking changes.

## Next Steps
- Start with Step 1: Dependency Audit.
