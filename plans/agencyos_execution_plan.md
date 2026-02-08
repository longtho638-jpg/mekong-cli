# 🦞 TÔM HÙM AGI - AGENCYOS EXECUTION PLAN (Consolidated)

**Date:** Feb 8, 2026
**Executor:** Mekong CLI (Gemini 2.5 Pro)
**Objective:** Orchestrate the construction of AgencyOS (RaaS) and the evolution of Mekong CLI (Open Source).

---

## 1. The "Tôm Hùm Control Plane" (Metastructure)

The user wants **Mekong CLI** (Tôm Hùm) to be the "Brain" that codes the rest of the ecosystem.

```mermaid
graph TD
    A[🦞 TÔM HÙM (Mekong CLI)] -->|Controls & Codes| B[AgencyOS Web (RaaS UI)]
    A -->|Validates & Merges| C[Open Source Dev Logic]
    A -->|Deploys| D[OpenClaw Worker (Engine)]

    subgraph "Zone A: Money Layer (Non-Tech)"
    B
    end

    subgraph "Zone B: Viral Layer (Devs)"
    C
    end

    subgraph "Zone C: Engine (Production)"
    D
    end
```

## 2. Component Mapping (The "Defragmentation")

Currently, `apps/` is fragmented. We will consolidate into 3 primary targets:

| Zone             | Component         | Path                   | Status                            | Action                |
| :--------------- | :---------------- | :--------------------- | :-------------------------------- | :-------------------- |
| **Orchestrator** | **Mekong CLI**    | `.` (Root)             | ✅ **v1.1.0** (Gemini Integrated) | **Self-Evolve**       |
| **Zone A**       | **AgencyOS Web**  | `apps/agencyos-web`    | ❓ Missing/Fragmented             | **Bootstrap New**     |
| **Zone B**       | **Logic Modules** | `src/core/recipes/*`   | 🚧 In Progress                    | **Expand via Devs**   |
| **Zone C**       | **Engine**        | `apps/openclaw-worker` | ⚠️ Needs Update                   | **Align with Gemini** |

_(Note: Existing `apps/agencyos-landing` can be migrated or archived. New `agencyos-web` will act as the RaaS Platform)_

## 3. Execution Roadmap (The "Cook" Strategy)

### Phase 1: Foundation (The Control Center)

- [x] Integrate Vertex AI (Gemini 2.5 Pro) -> **DONE (v1.1.0)**.
- [ ] Establish Tôm Hùm's ability to manipulate `apps/` (Cross-directory coding).
- [ ] Define shared constants between CLI and Web.

### Phase 2: Building Zone A (AgencyOS Web)

- [ ] **Bootstrap:** Create `apps/agencyos-web` (Next.js 15, Tailwind v4, Shadcn/UI).
- [ ] **Feature:** "RaaS Dashboard" (Credits, Services, Results).
- [ ] **Integration:** Connect to `openclaw-worker` via API.

### Phase 3: Building Zone C (The Engine)

- [ ] Upgrade `apps/openclaw-worker` to support Gemini 2.5 recipes.
- [ ] Implement the "Recipe Runner" (which pulls logic from Zone B).

### Phase 4: The Virtuous Loop (RaaS Model)

1. Dev contributes logic to Mekong CLI (Zone B).
2. Tôm Hùm verifies logic -> Deploys to Engine (Zone C).
3. Client pays AgencyCoin -> Triggers Engine via Web (Zone A).
4. Revenue shared? (Future).

## 4. Immediate Next Step: "The Genesis Boot"

**Command:** `cc boot agencyos-web`
**Action:** Tôm Hùm initializes the Next.js project structure for AgencyOS Web, ensuring it strictly follows the "Money Layer" specs from `MASTER_PRD`.

---

**Status:** Ready to Execute Phase 2 (Bootstrap AgencyOS Web).
