# Moat Audit — Mekong CLI Competitive Defensibility

**Date:** March 2026 | **Assets audited:** 289 commands, 85 recipes, 5-layer cascade, 176 contracts

---

## Moat Framework

Five types of moats assessed:
1. **Network effects** — value increases with users
2. **Switching costs** — cost for user to leave
3. **Economies of scale** — cost advantages at scale
4. **Unique assets** — hard to replicate
5. **Counter-positioning** — business model competitors can't copy

---

## Asset 1: 289 Commands (Workflow Breadth)

**What it is:** Every command is an encoded expert workflow — not a generic prompt, but a specific opinionated process. `mekong founder/vc/cap-table` runs a structured cap table modeling workflow, not just "think about cap tables."

**Moat type:** Unique assets + switching costs

**Defensibility analysis:**
- A competitor must hire domain experts (sales, finance, HR, engineering, legal) to encode equivalent workflows OR use generic prompting (weaker output quality).
- Encoding 289 workflows took months of iteration. Reproducing them takes the same time.
- Each command file is a knowledge artifact — compounding with each improvement.

**Weakness:** Commands are MIT-licensed and visible. A fork can copy them.
**Counter:** Forks don't have the PEV engine, billing, or community. Commands without execution context are just text.

**Moat score: 6/10** — replicable by well-funded team in 6 months, but nobody has done it yet.

---

## Asset 2: 85 Recipes (Compound Workflows)

**What it is:** Recipes combine multiple commands into multi-step business playbooks. E.g., `launch-saas` = market research + landing page + payment setup + CI/CD + monitoring in one pipeline.

**Moat type:** Unique assets

**Defensibility analysis:**
- Recipes encode the *sequence* and *dependencies* between tasks — the hardest part to replicate.
- Each recipe is a tested hypothesis about how work flows in a real business.
- As more recipes get battle-tested, they become more accurate (data flywheel).

**Weakness:** Recipes are also open-source.
**Counter:** The database of tested recipes (failures, iterations, edge cases) lives in maintainer's head and git history — not easily forked.

**Moat score: 5/10** — medium moat. Strengthens significantly at 500+ recipes.

---

## Asset 3: 5-Layer Cascade (Architecture)

**What it is:** Founder → Business → Product → Engineer → Ops. Tasks decompose downward. A founder-layer command automatically spawns product and engineering sub-tasks. No other tool has this vertical integration.

**Moat type:** Counter-positioning + unique assets

**Defensibility analysis:**
- Cursor is positioned as "code editor enhanced." They cannot add Founder layer without brand confusion.
- Devin is positioned as "AI engineer." Adding business strategy contradicts their pitch.
- OpenHands is framework-first, not business-workflow-first.
- **Mekong is the only product that can be everything** because it started with that intent.

**Weakness:** A new entrant with no positioning could copy the architecture.
**Counter:** We have the 6-month head start and the opinionated defaults baked in.

**Moat score: 8/10** — strongest moat. Architecture-level differentiation is durable.

---

## Asset 4: 176 Machine Contracts

**What it is:** `factory/contracts/*.json` are machine-readable execution blueprints. Not just prompts — structured JSON that defines inputs, outputs, verification criteria, rollback conditions. The PEV engine uses these as execution spec.

**Moat type:** Unique assets

**Defensibility analysis:**
- Contracts make workflows deterministic and testable. Competitors using pure LLM prompting get non-deterministic results.
- `make self-test` validates all 176 contracts — quality gate competitors don't have.
- Contract format is proprietary schema — anyone using it adopts Mekong's ecosystem.

**Weakness:** Schema is simple enough to replicate.
**Counter:** The populated contracts (176 tested scenarios) are the value, not the schema.

**Moat score: 7/10** — above average. Compounds with community contributions.

---

## Asset 5: Universal LLM Architecture

**What it is:** 3 env vars (`LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`) route to any OpenAI-compatible endpoint. Works with $0 Ollama to $500/mo Claude.

**Moat type:** Counter-positioning

**Defensibility analysis:**
- OpenAI, Anthropic, Google cannot offer this — they want vendor lock-in.
- Cursor is built on OpenAI API — can't easily become provider-agnostic.
- Devin is proprietary infra — cannot run on local models.
- **We can run where competitors cannot** (air-gapped, cheap, offline).

**Weakness:** OpenHands also has multi-provider support.
**Counter:** Mekong has business-layer commands OpenHands lacks.

**Moat score: 7/10** — strong in the local LLM segment.

---

## Asset 6: PEV Engine with Auto-Rollback

**What it is:** Plan → Execute → Verify loop with DAG scheduling, circuit breakers, and automatic rollback on verification failure. Production-grade orchestration, not a prototype.

**Moat type:** Unique assets (engineering investment)

**Defensibility analysis:**
- `src/core/orchestrator.py` — months of engineering to get right.
- Rollback + DAG + circuit breakers = features most AI tools don't have at all.
- Every bug fixed in production makes the engine more robust.

**Moat score: 7/10** — requires significant engineering to replicate.

---

## Composite Moat Score

| Asset | Moat Score | Durability |
|-------|-----------|-----------|
| 289 Commands | 6/10 | Medium (6 months to copy) |
| 85 Recipes | 5/10 | Medium (grows stronger with use) |
| 5-Layer Cascade | 8/10 | High (architecture + positioning) |
| 176 Contracts | 7/10 | High (data compounds) |
| Universal LLM | 7/10 | High (counter-positioned) |
| PEV Engine | 7/10 | High (engineering depth) |
| **Composite** | **6.7/10** | **Medium-High** |

---

## Strategic Recommendation

The 5-layer cascade + universal LLM combination is the genuine moat — neither Cursor nor Devin can replicate this positioning without contradicting their brand.

**Actions to deepen moat:**
1. Grow contracts to 500+ (each one harder to copy)
2. Build plugin marketplace (network effects turn on at ~50 community plugins)
3. Establish "5-layer cascade" as category name via content marketing
4. Get agency white-label customers — creates switching cost ecosystem
