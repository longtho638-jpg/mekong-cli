# HƯỚNG DẪN SỬ DỤNG v6.0 — Binh Phap VC Studio Platform

## Kiểm tra trước

```bash
cd mekong-cli
python3 -m pytest tests/ -x            # Python tests pass
cd packages/mekong-cli-core && pnpm build && pnpm test   # TS pass
cd ../..
mekong --help                           # CLI works
```

---

## Chuẩn bị

```bash
cp path/to/CLAUDE.md ./CLAUDE.md        # Overwrite v5.0 CLAUDE.md
git checkout -b v6.0-studio
git add CLAUDE.md && git commit -m "chore: CLAUDE.md for v6.0 studio"
```

---

## 5 Sessions

### SESSION 1 — Models + Types + Agent Definitions (15 phút)

Kéo `IMPLEMENTATION-SPEC-v6.0.md` vào CC CLI:

```
Đọc CLAUDE.md và IMPLEMENTATION-SPEC-v6.0.md.

Upgrade v5.0 → v6.0. KHÔNG sửa code cũ. Chỉ THÊM files mới.

Làm:
1. Tạo folder structure mới (Section 1) — chỉ folders mới
2. Code src/studio/__init__.py (empty)
3. Code src/studio/models.py (Section 2) — đầy đủ Pydantic models
4. Code packages/mekong-cli-core/src/studio/types.ts (Section 8.1)
5. Code packages/mekong-cli-core/src/venture/types.ts (reexport từ studio/types)
6. Tạo 5 agent files (Section 6):
   - packages/agents/hubs/studio-hub.md
   - agents/studio-cto.md
   - agents/studio-vc.md  
   - agents/studio-expert.md
   - agents/studio-founder.md
   - agents/studio-diligence.md
7. python3 -c "from src.studio.models import *; print('Models OK')"
8. cd packages/mekong-cli-core && pnpm lint

STOP.
```

**Commit:**
```bash
git add -A && git commit -m "feat(studio): models + types + agent definitions"
```

---

### SESSION 2 — Commands + Recipes (20 phút)

```
Đọc CLAUDE.md và IMPLEMENTATION-SPEC-v6.0.md.

Tạo 23 command files + recipe files. Đây là FILE CREATION session, không code logic.

1. Tạo 5 super command files trong .claude/commands/ (Section 4.1–4.5):
   - studio-bootstrap.md
   - studio-launch-full.md
   - studio-sprint-weekly.md
   - studio-operate-daily.md
   - studio-diligence-deep.md

2. Tạo 18 single command files (Section 4.6, dùng template):
   - portfolio-create.md, portfolio-status.md, portfolio-report.md
   - dealflow-source.md, dealflow-screen.md, dealflow-diligence.md
   - dealflow-term-sheet.md, dealflow-close.md
   - expert-match.md, expert-dispatch.md, expert-pool.md
   - venture-thesis.md, venture-terrain.md, venture-momentum.md
   - venture-five-factors.md, venture-void-substance.md
   - match-founder-idea.md, match-vc-startup.md

3. Tạo recipe JSON files (Section 5):
   - recipes/studio/INDEX.json + bootstrap.json + launch-full.json
   - recipes/studio/sprint-weekly.json + operate-daily.json + diligence-deep.json
   - recipes/studio/portfolio-report.json
   - recipes/dealflow/INDEX.json + source.json + screen.json + diligence.json
   - recipes/dealflow/term-sheet.json + close.json
   - recipes/venture/INDEX.json + thesis.json + terrain.json
   - recipes/venture/momentum.json + five-factors.json

4. EXTEND factory/layers.yaml (Section 7) — THÊM studio layer, ĐỪNG sửa layers cũ

5. Verify: ls .claude/commands/studio-* .claude/commands/portfolio-* .claude/commands/dealflow-* .claude/commands/expert-* .claude/commands/venture-* .claude/commands/match-*
   # Phải thấy 23 files

STOP.
```

**Commit:**
```bash
git add -A && git commit -m "feat(studio): 23 commands + recipes + factory layer"
```

---

### SESSION 3 — Python Business Logic (25 phút)

```
Đọc CLAUDE.md và IMPLEMENTATION-SPEC-v6.0.md.

Code Python studio modules:

1. Code src/studio/portfolio_manager.py
   - StudioPortfolioManager class
   - CRUD cho PortfolioCompany (save to .mekong/studio/portfolio/{slug}/profile.json)
   - health_score() calculation
   - dashboard() aggregation
   - Dùng existing src/core/llm_client.py cho AI calls

2. Code src/studio/deal_pipeline.py
   - DealPipelineManager class
   - add_deal(), list_deals(), advance_deal(), pass_deal()
   - screen_deal() — call LLM with thesis context, return score + reasoning
   - source_deals() — call LLM with sector + thesis, generate deal candidates

3. Code src/studio/thesis_engine.py
   - ThesisEngine class
   - load_thesis(), update_thesis(), evaluate_against_thesis()
   - evaluate_against_thesis(deal) → thesis_fit_score

4. Code src/studio/five_factors.py
   - FiveFactorEvaluator class
   - evaluate(target_data) → FiveFactorEvaluation
   - evaluate_single_factor(factor, context) → {score, reasoning}

5. Code src/studio/terrain_analyzer.py
   - TerrainAnalyzer class
   - analyze_market(market) → {terrain_type, reasoning, entry_strategy}

6. Code src/studio/momentum_scorer.py
   - MomentumScorer class
   - score_market(), score_company()

7. Code src/studio/expert_matcher.py
   - ExpertMatcher class
   - match(company_slug, need) → ranked list of experts with fit scores
   - dispatch(expert_id, company_slug, scope) → create engagement

8. Code src/studio/founder_matcher.py
   - FounderMatcher class
   - match(sector, requirements) → ranked founders

9. Code src/studio/company_instance.py
   - CompanyInstance class
   - create_openclaw_config(company_slug) → .mekong/studio/portfolio/{slug}/openclaw.yaml
   - get_company_context() → context string for per-company agent

10. Viết tests:
    - test_studio_models.py — validate Pydantic models
    - test_portfolio_manager.py — CRUD operations
    - test_five_factors.py — evaluation with mock LLM

11. python3 -m pytest tests/test_studio*.py -v

STOP.
```

**Commit:**
```bash
git add -A && git commit -m "feat(studio): Python business logic — portfolio, deals, strategy, matching"
```

---

### SESSION 4 — TypeScript Modules (20 phút)

```
Đọc CLAUDE.md và IMPLEMENTATION-SPEC-v6.0.md.

Code TypeScript studio + venture modules:

1. Code packages/mekong-cli-core/src/studio/portfolio-manager.ts (Section 8.2)
2. Code packages/mekong-cli-core/src/studio/deal-pipeline.ts (Section 8.3)
3. Code packages/mekong-cli-core/src/studio/three-party.ts (Section 8.4)
4. Code packages/mekong-cli-core/src/studio/company-instance.ts
5. Code packages/mekong-cli-core/src/studio/index.ts (barrel export)

6. Code packages/mekong-cli-core/src/venture/five-factors.ts (Section 8.5)
7. Code packages/mekong-cli-core/src/venture/terrain-analyzer.ts (Section 8.6)
8. Code packages/mekong-cli-core/src/venture/momentum-scorer.ts (Section 8.7)
9. Code packages/mekong-cli-core/src/venture/void-substance.ts
10. Code packages/mekong-cli-core/src/venture/index.ts (barrel export)

11. Viết tests:
    - packages/mekong-cli-core/tests/unit/studio.test.ts
    - packages/mekong-cli-core/tests/unit/venture.test.ts

12. cd packages/mekong-cli-core && pnpm lint && pnpm test

STOP.
```

**Commit:**
```bash
git add -A && git commit -m "feat(studio): TypeScript studio + venture modules"
```

---

### SESSION 5 — CLI Wiring + Final (15 phút)

```
Đọc CLAUDE.md và IMPLEMENTATION-SPEC-v6.0.md.

Final session — wire everything:

1. Code src/cli/studio_commands.py (Section 3) — full Typer commands

2. EXTEND src/cli/commands_registry.py:
   - THÊM 1 dòng: from src.cli.studio_commands import register_studio_commands
   - THÊM 1 dòng: register_studio_commands(app)
   - ĐỪNG sửa gì khác trong file này

3. Code packages/mekong-cli-core/src/cli/commands/studio.ts
   - Commander subcommands: init, status, report

4. Code packages/mekong-cli-core/src/cli/commands/portfolio-cmd.ts
   - Commander subcommands: create, list, status, update, health

5. Code packages/mekong-cli-core/src/cli/commands/dealflow-cmd.ts
   - Commander subcommands: add, list, screen, diligence, advance, pass

6. Code packages/mekong-cli-core/src/cli/commands/venture-cmd.ts
   - Commander subcommands: thesis, terrain, momentum, five-factors, void-substance

7. Code packages/mekong-cli-core/src/cli/commands/expert-cmd.ts
   - Commander subcommands: add, match, dispatch, pool

8. Code packages/mekong-cli-core/src/cli/commands/match-cmd.ts
   - Commander subcommands: founder-idea, vc-startup, expert-need

9. EXTEND packages/mekong-cli-core/src/cli/index.ts (Section 9)
   - THÊM imports + addCommand cho 6 new commands

10. Verify:
    mekong studio --help              # phải show init, status, report
    mekong portfolio --help           # phải show create, list, status, update, health
    mekong dealflow --help            # phải show add, list, screen, diligence, advance, pass
    mekong venture --help             # phải show thesis, terrain, momentum, five-factors, void-substance
    mekong expert --help              # phải show add, match, dispatch, pool
    mekong match --help               # phải show founder-idea, vc-startup, expert-need

11. python3 -m pytest tests/ -x       # ALL tests pass (cũ + mới)
12. cd packages/mekong-cli-core && pnpm build && pnpm test

13. Update VERSION file: 6.0.0
14. Update README.md — thêm Studio Platform section

STOP.
```

**Commit + tag:**
```bash
git add -A && git commit -m "feat(studio): CLI wiring + v6.0 complete — Binh Phap VC Studio Platform"
git tag v6.0.0
git checkout main && git merge v6.0-studio
```

---

## Verification Checklist

```bash
# === Existing v5.0 (regression check) ===
mekong --help                    # all old commands still visible
python3 -m pytest tests/ -x      # old tests pass

# === New Studio commands ===
mekong studio --help
mekong portfolio --help
mekong dealflow --help
mekong venture --help
mekong expert --help
mekong match --help

# === Claude Commands (CC CLI) ===
# In CC CLI session:
/studio:bootstrap test-studio
/portfolio:create
/venture:thesis
/dealflow:source
/studio:sprint:weekly

# === File structure ===
ls .claude/commands/studio-*     # 5 super commands
ls .claude/commands/portfolio-*  # 3 commands
ls .claude/commands/dealflow-*   # 5 commands
ls .claude/commands/venture-*    # 5 commands
ls .claude/commands/expert-*     # 3 commands
ls .claude/commands/match-*      # 2 commands
# Total: 23 new commands

ls recipes/studio/               # 7 recipes
ls recipes/dealflow/             # 6 recipes
ls recipes/venture/              # 5 recipes

ls agents/studio-*               # 5 agent definitions
ls packages/agents/hubs/studio-* # 1 studio hub
```

---

## Jidoka Rules

Tất cả rules v5.0 VẪN ÁP DỤNG, thêm:

- Nếu Opus **sửa factory/layers.yaml thay vì extend** → REJECT
- Nếu Opus **tạo LLM client mới** thay vì dùng src/core/llm_client.py → REJECT
- Nếu Opus **sửa commands_registry.py** ngoài việc thêm 2 dòng → REJECT
- Nếu Opus **hardcode .mekong/studio/ paths** → yêu cầu dùng config
- Nếu Opus **code cross_portfolio.py phức tạp** → yêu cầu giữ simple
- Nếu test cũ fail → FIX NGAY, đây là regression
- Nếu command file thiếu YAML frontmatter → REJECT
- Nếu recipe JSON thiếu `dag.groups` → REJECT
