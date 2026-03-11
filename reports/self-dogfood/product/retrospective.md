# v5.0 Development Retrospective

**Sprint:** Jan–Mar 2026 (Q1) | **Release:** v5.0.0 | **Method:** Solo founder retro

---

## What We Shipped

| Item | Count | Notes |
|------|-------|-------|
| Commands | 289 | +89 vs v4.x target of 200 |
| Skills | 245 | New in v5.0 |
| Machine contracts | 176 | New in v5.0 |
| RaaS billing files | 38 | Full billing stack |
| PEV engine modules | 4 | planner, executor, verifier, orchestrator |
| Agents | 17+ | GitAgent, FileAgent, ShellAgent, etc. |
| LLM adapters | 7 | OpenRouter, Qwen, DeepSeek, Ollama, Gemini, OpenAI, Offline |

---

## What Went Well

### 1. Self-Dogfooding Worked
Using `mekong cook` to write `mekong cook` created a real feedback loop. When the CLI broke, we felt it immediately. When a command was confusing, we were the confused user. This is the most important process decision we made.

**Evidence:** The PEV loop design improved 3 times based on self-use. First version had no rollback. Second version had rollback but it was too aggressive. Third version added configurable rollback threshold — came directly from dogfooding a bad deploy.

### 2. Machine Contracts as Spec
Starting each new command by writing `factory/contracts/<command>.json` before any code forced clarity. The contract defines inputs, outputs, and verification criteria. This prevented scope creep and made testing deterministic.

**Evidence:** 176 contracts, all with `make self-test` validation. Zero undefined behavior in contract-backed commands.

### 3. Universal LLM Architecture Decision
Committing to "3 env vars, any provider" early saved us from two traps:
- Not writing OpenAI-specific code that would need refactoring
- Not being affected by the March 2026 OpenAI pricing change

The `llm_client.py` circuit breaker + fallback chain was built once and works for all providers.

### 4. RaaS Billing Depth
The billing stack (`src/raas/`) ended up with 38 files — more than expected — but each file is focused and under 200 lines. The idempotency layer, proration logic, and audit trail are production-grade. This was over-engineered for a pre-revenue project, but it means we can scale to 1,000 customers without rewriting billing.

---

## What Went Poorly

### 1. Documentation Lag
We shipped commands faster than we documented them. Result: 289 commands exist but not all have worked examples. New users see a wall of commands with no clear entry point.

**Root cause:** Documentation wasn't part of the "definition of done" for each command.
**Fix:** Add to every new command PR: `docs/commands/<name>.md` with one worked example. Non-negotiable starting Q2.

### 2. No User Testing
Zero external users touched v5.0 before release. All "testing" was the author dogfooding. This means we have blind spots around:
- Setup friction (what's obvious to us isn't obvious to users)
- Error messages (we know what errors mean, users don't)
- Command discovery (we know the commands exist, users don't)

**Fix:** Get 3 developers outside the project to do a cold install + first mission in Q2. Record the session. Fix every point of friction.

### 3. Scope Creep on Billing
The RaaS billing stack took 6 weeks instead of 3. Added proration, usage analytics, completion certificates, payload encryption — features no paying customer has asked for.

**Root cause:** Engineering curiosity + "build it right" instinct overcame YAGNI.
**Lesson:** The first billing system should be: deduct credits, enforce limits, send webhook. Everything else is premature.
**Action:** For next feature, write the simplest possible version first. Complexity only on customer request.

### 4. Frontend Not Ready
The landing page and dashboard were deprioritized in favor of backend and CLI. Result: we have a complete RaaS backend but nowhere to point customers. This is backwards — distribution requires a landing page.

**Fix:** Landing page is now Sprint 1 P0. Non-negotiable for Q2.

### 5. Tôm Hùm Daemon Instability
The autonomous daemon (`apps/openclaw-worker/`) was implemented but not battle-tested. 24h headless operation revealed memory leak on long-running mission queues.

**Status:** Deprioritized to Q3. Do not market autonomous daemon capability until stable.

---

## Metrics

| Metric | Target | Actual | Delta |
|--------|--------|--------|-------|
| Commands shipped | 200 | 289 | +44% |
| Billing stack complete | Yes | Yes | On target |
| PEV engine stable | Yes | Mostly | Minor edge cases |
| Landing page live | Yes | No | Miss |
| PyPI published | Yes | No | Miss |
| Paying customers | 0 (pre-revenue) | 0 | On target |
| GitHub stars | 10 | 0 | Miss (no distribution) |

**Scope delivered:** 120% of engineering targets.
**Distribution delivered:** 0% of targets. This is the Q2 problem.

---

## Process Changes for Q2

| Change | Reason |
|--------|--------|
| "Docs included" in DoD | Prevent documentation lag |
| Weekly user test session | Eliminate blind spots |
| 2-week sprints with explicit scope freeze | Prevent scope creep |
| Landing page = P0 before any new commands | Distribution first |
| YAGNI review before adding billing features | Prevent over-engineering |

---

## Overall Assessment

v5.0 is the most complete release in the project's history. The engineering quality is high. The billing architecture is production-grade. The command library (289) is unmatched in scope.

The failure mode is classic: built an excellent product in a vacuum. Q2 is about putting it in front of people and learning what actually matters to them vs. what we thought mattered.

**Grade:** B+ on product, D on distribution. Net: B-.
