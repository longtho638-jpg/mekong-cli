---
title: "AGI Hoa RaaS - Open Source Integration"
description: "Tich hop Mem0+Qdrant, Langfuse, Aider spike vao mekong-cli RaaS platform"
status: completed
priority: P1
effort: 14h
branch: master
tags: [agi, raas, mem0, qdrant, langfuse, aider]
created: 2026-02-28
---

# AGI Hoa RaaS — Open Source Integration

## Vision (Post-Validation)

```
Phase 01: Memory+Qdrant ──┐
(packages/memory/)         ├── PARALLEL ──→ Phase 04: Tests+Docs
                           │                (tests/ + docs/)
Phase 03: Langfuse Cloud ──┤
(packages/observability/)  │
                           │
Phase 04-spike: Aider ─────┘
(spike test only)
```

## Dependency Graph

```
Phase 01 (Memory+Vector)   ─┐
Phase 03 (Langfuse Cloud)  ─┤── PARALLEL (no file overlap)
Phase 04 (Aider Spike)     ─┘
         |
         ▼
Phase 06 (Integration Tests + Docs) ◄── needs 01,03,04 done
```

## File Ownership Matrix (EXCLUSIVE)

| Phase | Owns (creates/modifies) |
|-------|------------------------|
| 01 | `packages/memory/` (NEW), `src/core/memory.py`, `src/core/memory_client.py` |
| 03 | `packages/observability/` (NEW), `src/core/telemetry.py` |
| 04 | `apps/openclaw-worker/lib/aider-bridge.js` (NEW), `apps/openclaw-worker/lib/auto-cto-pilot.js` |
| 06 | `tests/test_memory_qdrant.py` (NEW), `tests/test_langfuse.py` (NEW), `docs/agi-integration.md` (NEW) |

## Phase Status

| # | Phase | Priority | Status | Est. | File |
|---|-------|----------|--------|------|------|
| 01 | Memory & Vector Layer | P0 | **completed** | 5h | [phase-01](phase-01-memory-vector-layer.md) |
| ~~02~~ | ~~LangGraph~~ | ~~P1~~ | **DEFERRED** | — | 兵貴勝不貴久 — avoid Ngũ Nguy #4 |
| 03 | Observability Langfuse | P0 | **completed** | 5h | [phase-03](phase-03-observability-langfuse.md) |
| 04 | Self-Healing Aider (spike) | P2 | **completed** | 2h | [phase-04](phase-04-self-healing-engine.md) |
| ~~05~~ | ~~Marketplace~~ | ~~P3~~ | **DEFERRED v2** | — | 避實擊虛 — focus P0 first |
| 06 | Integration Tests & Docs | P2 | **completed** | 2h | [phase-06](phase-06-integration-tests-docs.md) |

## Key Decisions (Validated by Binh Pháp DNA)

- **Mem0 OSS** + Qdrant Docker local — cross-session memory
- **Langfuse CLOUD** free tier (50k traces/month) — 因糧於敵 tiết kiệm RAM M1
- **LangGraph DEFERRED** — 必生 Ngũ Nguy #4, linear pipeline đang ổn
- **Aider SPIKE TEST** — 知己知彼 test proxy compat trước khi full implement
- **Marketplace DEFERRED v2** — 避實擊虛 focus P0

## Research

- [Research Report: AGI Frameworks](research/researcher-01-agi-frameworks.md)

## Validation Log

### Session 1 — 2026-02-28
**Trigger:** Initial plan creation, validated against BINH_PHAP_MASTER.md DNA
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** Qdrant + Langfuse Docker local trên M1 16GB — RAM tradeoff?
   - Options: Qdrant local + Langfuse cloud | Cả hai Docker local | Cả hai cloud
   - **Answer:** Qdrant local + Langfuse cloud
   - **Rationale:** 作戰 Ch.2 因糧於敵 — dùng free tier Langfuse cloud, tiết kiệm ~1.5GB RAM M1. 仁 (nhân từ tài nguyên)

2. **[Scope]** LangGraph 50MB dependency cho linear pipeline đang ổn?
   - Options: Skip Phase 02 | Lightweight custom | Full LangGraph
   - **Answer:** Skip Phase 02 (DEFERRED)
   - **Rationale:** 兵貴勝不貴久 Ch.2 + Ngũ Nguy #4 (必生 over-engineer). YAGNI — thêm khi cần conditional branching thật sự

3. **[Scope]** Phase 04 (Aider) và Phase 05 (Marketplace) scope?
   - Options: Spike Aider + Defer Marketplace | Giữ cả 5 | Chỉ 01+03
   - **Answer:** Spike test Aider + Defer Marketplace
   - **Rationale:** 避實擊虛 Ch.6 — focus P0 (Memory+Observability). 知己知彼 Ch.3 — test Aider proxy compat trước

#### Confirmed Decisions
- Infra: Qdrant Docker + Langfuse Cloud — 因糧於敵
- LangGraph: DEFERRED — 必生 avoidance
- Marketplace: DEFERRED v2 — 避實擊虛
- Aider: spike test trước — 行軍 trinh sát

#### Impact on Phases
- Phase 02: DEFERRED — removed from execution
- Phase 03: Langfuse cloud thay Docker self-hosted — update config
- Phase 04: Downscoped to spike test only (2h thay 4h)
- Phase 05: DEFERRED to v2
- Phase 06: Remove test_langgraph.py, reduce scope
