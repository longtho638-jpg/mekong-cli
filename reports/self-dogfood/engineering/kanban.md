# v5.1 Kanban — Task Board
Generated: 2026-03-11

## Board: Mekong CLI v5.1 Roadmap

---

## BACKLOG

### Epic: Recipe Runner
| ID | Task | Priority | Est |
|----|------|----------|-----|
| RR-01 | Recipe YAML schema v2 (inputs, outputs, conditions) | P0 | 3d |
| RR-02 | Recipe validation CLI: `mekong recipe validate <file>` | P0 | 1d |
| RR-03 | Recipe marketplace index (YAML catalog, searchable) | P1 | 2d |
| RR-04 | `mekong recipe run <name>` with param interpolation | P0 | 2d |
| RR-05 | Recipe sharing: publish to marketplace via CLI | P2 | 3d |
| RR-06 | Recipe versioning (semver tags) | P2 | 1d |

### Epic: Plugin System
| ID | Task | Priority | Est |
|----|------|----------|-----|
| PL-01 | Plugin manifest spec (`plugin.yaml`) | P0 | 1d |
| PL-02 | Plugin install: `mekong plugin install <name>` | P0 | 2d |
| PL-03 | Plugin sandbox (isolated exec, no shell injection) | P0 | 3d |
| PL-04 | Plugin registry API (list, search, install endpoints) | P1 | 2d |
| PL-05 | Plugin dev kit: scaffold + test harness | P1 | 2d |
| PL-06 | Plugin signing / trust verification | P2 | 2d |
| PL-07 | Built-in plugins: git-workflow, docker-ops, k8s-deploy | P2 | 5d |

### Epic: White-Label
| ID | Task | Priority | Est |
|----|------|----------|-----|
| WL-01 | Brand config file (`brand.yaml`: name, colors, logo) | P0 | 1d |
| WL-02 | CLI help text templating from brand config | P1 | 2d |
| WL-03 | Dashboard white-label (custom logo/colors in saas-dashboard) | P1 | 3d |
| WL-04 | Email templates parameterized from brand config | P1 | 2d |
| WL-05 | White-label packaging: `mekong brand/build --output dist/` | P2 | 3d |
| WL-06 | Custom domain support for dashboard | P2 | 2d |

### Epic: Marketplace
| ID | Task | Priority | Est |
|----|------|----------|-----|
| MK-01 | Marketplace schema (products, ratings, installs) | P0 | 2d |
| MK-02 | Browse UI in saas-dashboard (`/marketplace`) | P1 | 3d |
| MK-03 | One-click install from dashboard | P1 | 2d |
| MK-04 | Revenue sharing for plugin authors (Polar.sh splits) | P2 | 3d |
| MK-05 | Marketplace CLI: `mekong marketplace search <query>` | P1 | 1d |
| MK-06 | Featured/curated collections | P2 | 1d |

---

## IN PROGRESS

| ID | Task | Owner | Started |
|----|------|-------|---------|
| SD-01 | SaaS dashboard initial scaffold | self-dogfood | 2026-03-11 |
| RD-01 | Engineering reports (self-dogfood phase 2) | self-dogfood | 2026-03-11 |

---

## DONE (v5.0 shipped)

- PEV orchestration engine (plan/execute/verify)
- RaaS API: `/v1/tasks`, `/v1/agents`, SSE streaming
- JWT auth + tenant isolation
- Tier-based rate limiting (4 tiers)
- MCU billing metering
- P0 security fixes (shell injection, secret exposure)
- 5-layer command pyramid (289 commands)
- Multi-provider LLM router (7 providers + offline)
- DAG scheduler with parallel execution
- main.py refactor: 1898 → 75 lines

---

## v5.1 Release Criteria

- [ ] Recipe runner functional end-to-end
- [ ] Plugin install/run working with at least 3 built-in plugins
- [ ] White-label config working for dashboard
- [ ] Marketplace browse + install from dashboard
- [ ] All 3637 tests passing
- [ ] Coverage ≥ 75%
- [ ] saas-dashboard deployed to Vercel
