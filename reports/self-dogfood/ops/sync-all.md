# Mekong CLI v5.0 — Full System Sync Status Report

**Date:** 2026-03-11
**Auditor:** OpenClaw self-dogfood ops pass
**Scope:** All loadable system components, checked against filesystem reality

---

## Summary

| Component Class | Expected | Found | Synced | Delta |
|----------------|----------|-------|--------|-------|
| LLM Providers (yaml) | 12 | 12 | 12 | 0 |
| Agent definitions (.md) | 19 | 19 | 19 | 0 |
| Agents in registry JSON | 19 | 14 | 14 | -5 |
| Skill definitions (.md dirs) | 542 | 542 | 542 | 0 |
| Skills in registry JSON | 542 | 241 | 241 | -301 |
| Command .md files | 176 | 176 | 176 | 0 |
| Factory contracts JSON | 9 | 9 | 9 | 0 |
| Recipe directories | 44 | 44 | 44 | 0 |
| MCP servers | configured | 0 active | — | n/a |

**Overall sync health: PARTIAL — registry JSON files lag behind filesystem counts**

---

## 1. LLM Providers — SYNCED

File: `mekong/adapters/llm-providers.yaml`

All 12 provider presets verified:

| Preset | Base URL | Model | Status |
|--------|----------|-------|--------|
| qwen-coding-plan | dashscope.aliyuncs.com | qwen3-coder-plus | configured |
| qwen-international | dashscope-intl.aliyuncs.com | qwen3-coder-plus | configured |
| deepseek | api.deepseek.com | deepseek-chat | configured |
| openrouter | openrouter.ai/api/v1 | anthropic/claude-sonnet-4 | configured |
| agentrouter | agentrouter.org/v1 | claude-sonnet-4-6-20250514 | configured |
| openai | api.openai.com/v1 | gpt-4o | configured |
| anthropic | api.anthropic.com/v1 | claude-sonnet-4-6-20250514 | configured |
| deepinfra | api.deepinfra.com/v1/openai | DeepSeek-V3.2 | configured |
| fireworks | api.fireworks.ai/inference/v1 | qwen3-coder-plus | configured |
| together | api.together.xyz/v1 | DeepSeek-V3 | configured |
| google | (Gemini native) | gemini-2.5-pro | configured |
| ollama | localhost:11434 | user-selected | configured |

Runtime priority order (from `src/core/llm_client.py`):
1. `LLM_BASE_URL + LLM_API_KEY + LLM_MODEL` (universal override)
2. `OPENROUTER_API_KEY`
3. `AGENTROUTER_API_KEY`
4. `DASHSCOPE_API_KEY`
5. `DEEPSEEK_API_KEY`
6. `ANTHROPIC_API_KEY`
7. `OPENAI_API_KEY`
8. `GOOGLE_API_KEY`
9. `OLLAMA_BASE_URL`
10. OfflineProvider (fallback)

Circuit breaker: 3 consecutive failures → 15s cooldown per provider.

**No drift detected. YAML matches runtime logic.**

---

## 2. Agent Definitions — PARTIALLY SYNCED

Filesystem: `mekong/agents/*.md` — 19 files
Registry: `factory/contracts/agents.registry.json` — 14 entries

Files on disk (19):
- binh-phap-strategist.md
- brainstormer.md
- code-reviewer.md
- copywriter.md
- database-admin.md
- debugger.md
- docs-manager.md
- fullstack-developer.md
- git-manager.md
- journal-writer.md
- mcp-manager.md
- mekong-market-analyst.md
- planner.md
- project-manager.md
- researcher.md
- revenue-forecaster.md
- scout-external.md
- scout.md
- tester.md

Registered in JSON (14): brainstormer, code-reviewer, code-simplifier, debugger,
docs-manager, fullstack-developer, git-manager, planner, project-manager,
researcher, scout, tester, copywriter, mekong-market-analyst

**MISSING from registry (5):**
- binh-phap-strategist
- database-admin
- journal-writer
- mcp-manager
- revenue-forecaster
- scout-external

**Action required:** Add 5 missing agents to `factory/contracts/agents.registry.json`.

Also note: `code-simplifier` appears in registry but has no corresponding `.md` in `mekong/agents/` — orphaned entry.

---

## 3. Skill Definitions — PARTIALLY SYNCED

Filesystem: `.claude/skills/` — 542 directories
Registry: `factory/contracts/skills.registry.json` — 241 entries

Sync ratio: 44.5% registered. Over half the skill definitions exist only on disk and are not reflected in the machine-readable registry.

This is not a runtime blocker — CC CLI reads `.claude/skills/` directly and does not require registry validation. However, the factory contract registry is used by:
- `mekong list skills` command (shows only 241)
- `factory/contracts/INDEX.json` referencing skill count
- External API consumers of `/v1/skills` endpoint

**Sample unregistered skills (from directory listing):**
- team, worktree, imagemagick, ai-multimodal, docs-seeker, sequential-thinking,
  mermaidjs-v11, debug, code-reviewer (skill), context7, and ~300 more

**Action required:** Run registry regeneration pass. Add script to Makefile:
```bash
make sync-registries  # regenerate from filesystem
```

---

## 4. Command Files — SYNCED

`.claude/commands/` — 273 files (176 mekong-native + 97 global claudekit commands)
`mekong/commands/` — 176 files

All 176 mekong command `.md` files present. No orphans detected in spot check of
5 random commands: `cook.md`, `deploy.md`, `plan.md`, `annual.md`, `review.md` — all
have valid YAML frontmatter and non-empty body.

`factory/contracts/commands.schema.json` exists and is valid JSON.

---

## 5. Factory Contracts — SYNCED

`factory/contracts/` — 9 files:

| File | Valid JSON | Status |
|------|-----------|--------|
| agents.registry.json | yes | stale (see §2) |
| commands.schema.json | yes | ok |
| missions.schema.json | yes | ok |
| pricing.json | yes | ok |
| skills.registry.json | yes | stale (see §3) |
| layers.json | yes | ok |
| INDEX.json | yes | ok |
| commands/ (dir) | — | 176 files |
| schemas/ (dir) | — | ok |

`pricing.json` spot-checked: starter=50 MCU, growth=200 MCU, premium=1000 MCU.
Matches `src/core/mcu_billing.py::TIER_CREDITS`. Consistent.

---

## 6. Recipes — SYNCED

`recipes/` — 44 directories. Spot-check of 5 recipe subdirs confirms each contains
a valid recipe JSON or YAML plus `README.md`. Recipe loader in
`src/cli/recipe_commands.py` reads from this directory at runtime.

Categories present: accounting, ae, analyst, auto, backend, business, code-review,
data, design, dev, devops, eng, engineering, example, finance, founder, frontend,
growth, hr, junior, lead_gen, legal, marketing, ops, people, platform, product,
recruiter, release, releng, sales, sdr, sre, tech, ui, ux, web, writer.

No broken symlinks or empty dirs detected in spot check.

---

## 7. MCP Servers — NOT CONFIGURED

No active MCP server connections detected in current environment.
`mekong/agents/mcp-manager.md` agent definition exists but MCP connectivity depends
on runtime `MCP_*` env vars, which are absent.

This is expected for a local dev environment. Production deployments connecting to
external MCP servers (Supabase, context7, claude-mem) require:
```bash
export MCP_CLAUDE_MEM_URL=...
export MCP_CONTEXT7_URL=...
```

No action required unless connecting to MCP-dependent recipes.

---

## 8. PEV Engine Core Modules — VERIFIED

`src/core/` contains all expected PEV components:

| Module | File | Status |
|--------|------|--------|
| Planner | planner.py | present |
| Executor | executor.py | present |
| Verifier | verifier.py | present |
| Orchestrator | orchestrator.py | present |
| DAG Scheduler | dag_scheduler.py | present |
| LLM Client | llm_client.py | present |
| MCU Billing | mcu_billing.py | present |
| MCU Gate | mcu_gate.py | present |
| Health Endpoint | health_endpoint.py | present (port 9192) |
| Alert Router | alert_router.py | present |
| Anomaly Detector | anomaly_detector.py | present |
| Usage Metering | usage_metering.py | present |
| Event Bus | event_bus.py | present |

Import smoke test: `from src.core.health_endpoint import start_health_server` completes
in ~1.2s with no import errors. Core engine importable.

---

## Action Items

Priority | Item | File
---------|------|-----
HIGH | Add 5 missing agents to agents.registry.json | `factory/contracts/agents.registry.json`
HIGH | Remove orphaned `code-simplifier` registry entry | `factory/contracts/agents.registry.json`
MEDIUM | Regenerate skills.registry.json from filesystem (241 → 542) | `factory/contracts/skills.registry.json`
LOW | Add `make sync-registries` target | `Makefile`
LOW | Document MCP env var requirements | `docs/deployment-guide.md`

---

*Report generated: 2026-03-11 | Mekong CLI v5.0.0*
