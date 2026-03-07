---
title: "Mekong CLI Build Optimization"
description: "PyInstaller binary build, dependency optimization, license caching, <0.5s startup"
status: pending
priority: P1
effort: 5d
branch: master
tags: [build, performance, pyinstaller, raas]
created: 2026-03-07
---

# Mekong CLI Build Optimization Plan

## Overview

| Attribute | Value |
|-----------|-------|
| **Current** | Poetry source install, ~2s startup |
| **Target** | PyInstaller binary, <0.5s startup, ~25MB binary |
| **RaaS Compatibility** | JWT + mk_ API key auth must work |
| **Tests** | Integration tests pass against raas.agencyos.network |

## Phases Summary

| Phase | Name | Effort | Status |
|-------|------|--------|--------|
| [Phase 1](./phase-01-pyinstaller-setup.md) | PyInstaller Setup | 1-2 days | pending |
| [Phase 2](./phase-02-dependency-optimization.md) | Dependency Optimization | 1 day | pending |
| [Phase 3](./phase-03-license-caching.md) | License Caching Layer | 1 day | pending |
| [Phase 4](./phase-04-test-verification.md) | Test Verification | 1 day | pending |
| [Phase 5](./phase-05-documentation.md) | Documentation Update | 0.5 day | pending |

## Dependencies

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
                         ↘
                          → Phase 5 (docs can start after Phase 3)
```

## Success Criteria

- [ ] Binary startup < 0.5s (measured via `time mekong --version`)
- [ ] Binary size ~25MB (±5MB)
- [ ] RaaS license validation works (JWT + mk_ API keys)
- [ ] All integration tests pass against raas.agencyos.network
- [ ] Documentation updated with build instructions

## Risks

| Risk | Mitigation |
|------|------------|
| PyInstaller misses dynamic imports | Add hidden-imports in spec file |
| Binary size > 50MB | Use UPX compression, exclude optional deps |
| License cache stale | 5-min TTL + manual invalidation |
| Integration tests fail | Mock RaaS gateway for local testing |

## Related Files

- `pyproject.toml` - Build configuration
- `src/main.py` - CLI entry point
- `src/lib/raas_gate_validator.py` - License validation
- `scripts/` - Build scripts
- `tests/integration/` - Integration tests

---

*Generated: 2026-03-07 | Effort: 5 days | Priority: P1*
