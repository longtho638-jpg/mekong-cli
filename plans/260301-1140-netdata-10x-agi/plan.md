# 10x Plan: Netdata Architecture → Mekong-CLI RaaS AGI

**Date:** 2026-03-01 | **Branch:** master | **Status:** In Progress

## Strategy

Map 5 high-ROI netdata patterns to mekong-cli. Focus on enhancing existing modules (not rewriting).

## Feature Map (Netdata → Mekong-CLI)

| # | Netdata Pattern | Mekong Module | New/Enhanced | Impact |
|---|----------------|---------------|-------------|--------|
| 1 | Health Watchdog Cascade | `src/core/health_watchdog.py` | NEW | Quality gates with hysteresis |
| 2 | Plugin Collector Interface | `src/core/collector_registry.py` | NEW | Auto-discover & load agents |
| 3 | Tiered Telemetry Storage | `src/core/telemetry.py` | ENHANCED | Phase-level log tiers |
| 4 | Auto-Discovery | `src/core/auto_discovery.py` | NEW | Detect project type → recipe |
| 5 | Streaming Execution Events | `src/core/event_bus.py` | ENHANCED | WebSocket real-time updates |

## Phase Execution

| Phase | Files | Status |
|-------|-------|--------|
| F1: Health Watchdog | health_watchdog.py, tests | ☐ |
| F2: Collector Registry | collector_registry.py, tests | ☐ |
| F3: Tiered Telemetry | telemetry.py enhance, tests | ☐ |
| F4: Auto-Discovery | auto_discovery.py, tests | ☐ |
| F5: Event Streaming | event_bus.py enhance, tests | ☐ |
| Audit: lint+security+vuln | all files | ☐ |
| Build+Verify | pytest, browser | ☐ |

## Principles
- YAGNI/KISS/DRY — Only add what research proves valuable
- < 200 LOC per file
- Type hints + docstrings
- Tests for every module
