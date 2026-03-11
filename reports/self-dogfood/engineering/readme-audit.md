# README Audit Report
Generated: 2026-03-11

## README Stats
- File: `/README.md`
- Lines: 158
- Last meaningful update: 2026-03-10 (landing fix commit)

---

## Claims vs Reality

| Claim in README | Actual Value | Status |
|-----------------|-------------|--------|
| "289 commands" | 273 in `.claude/commands/` | OVERSTATED by 16 |
| "245 skills" | 542 in `.claude/skills/` | UNDERSTATED by 297 |
| "176 contracts" | 9 in `factory/contracts/` | OVERSTATED by 167 |
| "5-tầng doanh nghiệp" | 5 layers confirmed | CORRECT |
| `.agencyos/commands/ # 245 command definitions` | `.claude/commands/` has 273 | WRONG PATH + WRONG COUNT |
| `factory/contracts/ # 176 JSON machine contracts` | only 9 JSON files present | WRONG COUNT |
| Version: implied v5.0 | pyproject.toml: 5.0.0 | CORRECT (no explicit version in README) |

---

## Structural Accuracy

### Architecture diagram — CORRECT
```
👑 Founder    /annual /okr /fundraise /swot
🏢 Business   /sales /marketing /finance /hr
📦 Product    /plan /sprint /roadmap /brainstorm
⚙️ Engineer   /cook /code /test /deploy /review
🔧 Ops        /audit /health /security /status
```
Layers match actual command organization.

### LLM Config section — CORRECT
Universal 3-var setup (`LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`) matches `src/core/llm_client.py`.

### Quick Start commands — CORRECT
`mekong cook`, `mekong annual` are real entry points.

### Ollama local section — CORRECT
`ollama pull qwen2.5-coder` + `OLLAMA_BASE_URL` matches fallback chain in `llm_client.py`.

---

## Issues Found

### 1. Stat mismatch (commands/skills/contracts)
```
README: "289 commands • 245 skills • 176 contracts"
Actual: 273 commands, 542 skills, 9 contracts
```
The 289/245/176 numbers appear to come from an earlier state or include
commands from multiple locations (global `~/.claude/commands/` + local).

**Fix:** Clarify that "289 commands" = local (273) + global (~16). Or recount.
Skills (542) should be updated. Contracts (9) is a major discrepancy — the
`factory/contracts/` may have been partially deleted or moved.

### 2. Wrong path in directory tree
```
README: .agencyos/commands/
Actual:  .claude/commands/
```

### 3. Language inconsistency
README mixes Vietnamese and English. CLAUDE.md says Vietnamese (ĐIỀU 55) but
README is a public-facing document — English is more appropriate for OSS.
Recent commit `i18n: translate 830+ Vietnamese runtime lines to English` suggests
active migration; README partially updated.

### 4. No version badge
No `![Version](https://img.shields.io/badge/version-5.0.0-blue)` badge.
`codebase-summary.md` still says v3.0.0 — creates confusion.

---

## Recommended Fixes

1. Update counts: `273 commands • 542 skills • 9 contracts` (or audit factory/contracts)
2. Fix path: `.claude/commands/` not `.agencyos/commands/`
3. Add version badge pointing to pyproject.toml
4. Confirm/restore `factory/contracts/` count — 9 vs 176 is a red flag
5. Verify `mekong help` output matches claimed 289 commands
