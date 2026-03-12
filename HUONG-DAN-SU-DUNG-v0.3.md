# HƯỚNG DẪN SỬ DỤNG v0.3.0 — Feed cho Opus CC CLI

## Kiểm tra trước khi bắt đầu

```bash
cd mekong-cli
git status                     # phải clean
pnpm build                     # phải pass
pnpm test                      # phải pass
mekong dashboard               # phải show Andon board
mekong crm summary             # phải show CRM data
mekong finance revenue         # phải show revenue
mekong sop list                # phải show 15 templates (5 v0.1 + 10 v0.2)
```

Nếu bất kỳ check nào fail → fix trước. KHÔNG bắt đầu v0.3.0 trên nền bị lỗi.

---

## Chuẩn bị

```bash
# Update CLAUDE.md
cp path/to/CLAUDE-v0.3.md ./CLAUDE.md

# Install new deps
pnpm add semver tar ignore ws simple-statistics
pnpm add -D @types/semver @types/tar @types/ws

# Bump version
# Edit package.json: "version": "0.3.0"

# Commit và tạo branch
git add -A && git commit -m "chore: upgrade deps for v0.3.0"
git checkout -b v0.3.0
```

---

## Quy trình: 6 Sessions

### SESSION 1 — Types + MCP Client (20 phút)

Kéo `IMPLEMENTATION-SPEC-v0.3.md` vào CC CLI, gõ:

```
Đọc CLAUDE.md và IMPLEMENTATION-SPEC-v0.3.md.

Đây là upgrade từ v0.2.0. KHÔNG sửa code cũ. Chỉ THÊM files mới.

Làm theo thứ tự:
1. Tạo folder structure mới (Section 2) — chỉ tạo folders/files mới
2. Code src/kaizen/types.ts (Section 3.1)
3. Code src/marketplace/types.ts (Section 3.2)
4. Code src/plugins/types.ts (Section 3.3)
5. Code src/mcp/types.ts (Section 3.4)
6. Code src/self-improve/types.ts (Section 3.5)
7. Code src/mcp/client.ts (Section 6.1) — ĐÂY LÀ CRITICAL MODULE
   - stdio transport: spawn child process, JSON-RPC 2.0 over stdin/stdout
   - SSE transport: HTTP EventSource connection
   - connect(), listTools(), callTool(), listResources(), readResource()
8. Code src/mcp/server-manager.ts (Section 6.2)
9. Code src/mcp/tool-adapter.ts — convert McpTool → ToolDefinition
10. Viết tests cho McpClient (mock stdio process) và McpServerManager
11. Chạy pnpm lint && pnpm test

STOP sau bước 11.
```

**Review → commit:**
```bash
git add -A && git commit -m "feat(v0.3): types + MCP client implementation"
```

---

### SESSION 2 — Kaizen Analytics Engine (20 phút)

Mở session mới:

```
Đọc CLAUDE.md và IMPLEMENTATION-SPEC-v0.3.md.

Tiếp tục v0.3.0. Code Kaizen engine:

1. Code src/kaizen/collector.ts (Section 4.1)
   - record(): buffer + periodic flush to JSONL
   - recordSopStep(), recordAgentTask(), recordToolCall(): convenience methods
   - query(): read JSONL, filter by name + time + labels
   - subscribeToEvents(): hook into v0.1.0 event bus
   - rotate(): cleanup old data (>90 days)

2. Code src/kaizen/analyzer.ts (Section 4.2)
   - analyzeSop(): duration stats (mean, median, p95), success rate, step breakdown
   - analyzeAgent(): task stats, tool usage, efficiency score
   - findBottlenecks(): rank by impact across SOPs, agents, tools
   - detectAnomalies(): flag points > 2 stddev from rolling mean
   - calculateHealthScore(): weighted composite score 0-100
   - Dùng simple-statistics: import { mean, median, standardDeviation, linearRegression } from 'simple-statistics'

3. Code src/kaizen/recommender.ts (Section 4.3)
   - suggest(): rule-based + AI-powered suggestions
   - apply(): auto-apply safe suggestions (model_downgrade, cache)
   - revert(): undo applied suggestion
   - Rule-based rules:
     a. Step >50% total time → parallelize
     b. Step 100% success + 0 retries → skip candidate
     c. Expensive model for simple task → model_downgrade
     d. Same tool called >3x sequentially → batch
     e. Prompt >2000 tokens for <100 output → prompt_optimize

4. Code src/kaizen/report.ts (Section 4.4)
   - generate(): quick/standard/deep reports
   - renderCli(): health score, bottlenecks table, suggestions list, SOP leaderboard
   - renderMarkdown()

5. Viết tests:
   - MetricsCollector: record + query
   - KaizenAnalyzer: analyzeSop (mock metric data)
   - KaizenRecommender: suggest (verify rule-based triggers)

6. Chạy pnpm lint && pnpm test

STOP sau bước 6.
```

**Review → commit:**
```bash
git add -A && git commit -m "feat(v0.3): Kaizen analytics engine — collector, analyzer, recommender"
```

---

### SESSION 3 — Self-Improvement Engine (20 phút)

Mở session mới:

```
Đọc CLAUDE.md và IMPLEMENTATION-SPEC-v0.3.md.

Tiếp tục v0.3.0. Code self-improvement:

1. Code src/self-improve/execution-feedback.ts (Section 7.1)
   - record(): append ExecutionRecord to JSONL
   - analyzePatterns(): group by taskType, find success/failure patterns
   - getBestApproach(): return recommended agent + model + estimates

2. Code src/self-improve/skill-evolution.ts (Section 7.2)
   - detectCandidates(): find recurring tool sequences (≥5 occurrences)
   - generateSop(): LLM generates YAML from tool sequence
   - approve(): save learned skill, register with SOP engine
   - suggestSkill(): match task description against learned skill triggers

3. Code src/self-improve/prompt-refiner.ts (Section 7.3)
   - getVariant(): return active variant for context
   - recordResult(): update variant metrics
   - generateChallenger(): LLM creates alternative prompt (shorten/examples/restructure)
   - evaluateTest(): chi-squared test, need ≥30 samples per variant
   - KHÔNG auto-activate tests — manual trigger only for v0.3.0

4. Code src/self-improve/memory-curator.ts (Section 7.4)
   - compactSessions(): keep last 20 full, summarize older via LLM
   - deduplicateKnowledge(): merge similar entities
   - scoreRelevance(): recency + frequency + confidence
   - selectContext(): pick most relevant memory for a task
   - getStorageStats() + cleanup()

5. Viết tests:
   - ExecutionFeedback: record + analyzePatterns (mock execution data)
   - SkillEvolution: detectCandidates (mock executions with repeated sequences)
   - MemoryCurator: getStorageStats

6. Chạy pnpm lint && pnpm test

STOP sau bước 6.
```

**Review → commit:**
```bash
git add -A && git commit -m "feat(v0.3): self-improvement — feedback, skills, prompts, memory"
```

---

### SESSION 4 — Marketplace (20 phút)

Mở session mới:

```
Đọc CLAUDE.md và IMPLEMENTATION-SPEC-v0.3.md.

Tiếp tục v0.3.0. Code marketplace:

1. Code src/marketplace/validator.ts
   - validatePackageJson(): check required fields, semver, mekongVersion compat
   - validateSopYaml(): parse with Zod SopDefinitionSchema from v0.1.0
   - validateNoSecrets(): regex scan for API keys, tokens, passwords
   - validateStructure(): check all referenced files exist
   - Return { valid: boolean, errors: string[], warnings: string[] }

2. Code src/marketplace/packager.ts (Section 5.1)
   - pack(): validate → collect files → tar.gz → output .mkg
   - unpack(): extract → validate → return SopPackage
   - Dùng 'tar' package: tar.create() và tar.extract()

3. Code src/marketplace/registry.ts
   - Local registry: ~/.mekong/marketplace/registry.json
   - register(): add installed package to local registry
   - unregister(): remove from registry
   - list(): return all registered packages
   - get(): return specific package info
   - isInstalled(): check if package + version exists
   
4. Code src/marketplace/publisher.ts (Section 5.2)
   - publish(): validate → pack → create GitHub Release → upload .mkg as asset
   - Dùng fetch() cho GitHub Releases API
   - Cần GITHUB_TOKEN env var

5. Code src/marketplace/installer.ts (Section 5.3)
   - install(): resolve version → download .mkg → validate → unpack → register
   - update(): check latest → download if newer → install
   - uninstall(): unregister → delete files
   - listInstalled(), checkUpdates()

6. Code src/marketplace/discovery.ts (Section 5.4)
   - search(): query GitHub registry index.json
   - getPackageInfo(): get detailed package metadata
   - getFeatured(): return featured packages from index
   - syncIndex(): download latest index.json to cache

7. Viết tests:
   - SopPackager: pack → unpack roundtrip
   - MarketplaceValidator: valid package, invalid package, secrets detection
   - MarketplaceRegistry: register + list + unregister

8. Chạy pnpm lint && pnpm test

STOP sau bước 8.
```

**Review → commit:**
```bash
git add -A && git commit -m "feat(v0.3): SOP marketplace — pack, publish, install, search"
```

---

### SESSION 5 — Plugin System + Scheduler Upgrade (20 phút)

Mở session mới:

```
Đọc CLAUDE.md và IMPLEMENTATION-SPEC-v0.3.md.

Tiếp tục v0.3.0. Code plugins + scheduler:

1. Code src/plugins/api.ts (Section 8.2)
   - createPluginApi(): permission-gated API factory
   - Mỗi method check permission trước khi execute
   - Tools/agents registered with plugin prefix: "plugin.{name}.{tool}"

2. Code src/plugins/hooks.ts
   - PluginHookDispatcher class
   - dispatch(hookName, ...args): call hook on all loaded plugins
   - Error in one plugin KHÔNG block others — log and continue

3. Code src/plugins/sandbox.ts
   - Basic sandboxing: restrict file access to plugin dir + approved dirs
   - Validate plugin doesn't import dangerous modules
   - Rate limit LLM calls per plugin

4. Code src/plugins/loader.ts (Section 8.1)
   - loadAll(): scan dirs → validate → check permissions → dynamic import → onLoad()
   - load(manifestPath): single plugin load
   - unload(): onUnload() → cleanup registrations
   - dispatchHook(): delegate to PluginHookDispatcher

5. UPGRADE src/core/scheduler.ts (Section 9)
   - GIỮA backward compat: old interval heartbeat vẫn chạy
   - THÊM: cron-based scheduling (dùng 'cron' package)
   - THÊM: event triggers (subscribe to event bus, trigger actions)
   - THÊM: condition triggers (periodic check, fire when true)
   - THÊM: proactive suggestions (daily briefing)
   - THÊM: plugin heartbeat hooks (dispatchHook('onHeartbeat'))
   - Main loop: every 30s check task queue, run due tasks

6. Viết tests:
   - PluginLoader: load valid manifest, reject invalid manifest
   - PluginApi: permission gate (allowed vs denied)
   - Scheduler: cron parsing, event trigger registration

7. Chạy pnpm lint && pnpm test

STOP sau bước 7.
```

**Review → commit:**
```bash
git add -A && git commit -m "feat(v0.3): plugin system + advanced heartbeat scheduler"
```

---

### SESSION 6 — CLI + Config + Templates + Wiring (20 phút)

Mở session mới:

```
Đọc CLAUDE.md và IMPLEMENTATION-SPEC-v0.3.md.

Final session v0.3.0 — wire everything:

1. EXTEND src/config/schema.ts:
   - Dùng ConfigSchema.extend({}) — ĐỪNG replace
   - Thêm: mcp, marketplace, plugins, kaizen, self_improve sections (Section 11)
   - Thêm: heartbeat.event_triggers, heartbeat.proactive (Section 11)

2. Tạo 5 SOP templates (Section 10):
   - src/sops/templates/kaizen-review.yaml
   - src/sops/templates/marketplace-publish.yaml
   - src/sops/templates/self-audit.yaml
   - src/sops/templates/competitive-analysis.yaml
   - src/sops/templates/plugin-create.yaml

3. Code src/cli/commands/kaizen.ts (Section 12.1)
   - Subcommands: (default), report, bottlenecks, suggestions, apply, revert, history

4. Code src/cli/commands/marketplace.ts (Section 12.2)
   - Subcommands: search, browse, info, install, update, uninstall, list, pack, validate, publish

5. Code src/cli/commands/plugin.ts (Section 12.3)
   - Subcommands: list, load, unload, validate, create, permissions

6. UPDATE src/cli/index.ts — register 3 new commands

7. UPDATE src/core/engine.ts:
   - Register McpServerManager → connect all configured servers on startup
   - Register MetricsCollector → subscribe to events
   - Register KaizenAnalyzer + KaizenRecommender
   - Register ExecutionFeedback → hook into agent task completion
   - Register SkillEvolution
   - Register PromptRefiner
   - Register MemoryCurator
   - Register MarketplaceInstaller → load installed marketplace SOPs
   - Register PluginLoader → loadAll() on startup
   - Register upgraded Scheduler → start all scheduled tasks

8. Update default mekong.yaml template (Section 11)

9. Update HEARTBEAT.md:
   - Thêm: weekly Kaizen review
   - Thêm: monthly self-audit
   - Thêm: monthly plugin update check

10. Chạy pnpm build
11. Test CLI commands:
    - mekong kaizen
    - mekong kaizen report --days=7
    - mekong marketplace search "deploy"
    - mekong marketplace list
    - mekong plugin list
    - mekong sop list (phải show 20 templates: 5 v0.1 + 10 v0.2 + 5 v0.3)

12. Update README.md — thêm v0.3.0 features + marketplace docs + plugin guide

13. Chạy pnpm lint && pnpm test

STOP sau bước 13.
```

**Review → commit & tag:**
```bash
git add -A && git commit -m "feat(v0.3): CLI + config + wiring — v0.3.0 platform complete"
git tag v0.3.0
git checkout main
git merge v0.3.0
```

---

## Quy tắc Jidoka cho v0.3.0

Tất cả rules từ v0.1.0 + v0.2.0 VẪN ÁP DỤNG, thêm:

- Nếu Opus **sửa file v0.1.0 hoặc v0.2.0** mà spec không yêu cầu → REJECT
- Nếu Opus **replace ConfigSchema** thay vì extend → REJECT, dùng .extend()
- Nếu Opus **import * from 'simple-statistics'** → yêu cầu import cụ thể functions
- Nếu Opus **auto-activate A/B testing** → REJECT, v0.3.0 chỉ manual trigger
- Nếu Opus **tạo HTTP server cho marketplace** → REJECT, dùng GitHub API
- Nếu Opus **bỏ qua permission check trong plugin API** → REJECT, security quan trọng
- Nếu Opus **break backward compat của scheduler** → REJECT, phải giữ interval-based heartbeat
- Nếu test v0.1.0 hoặc v0.2.0 fail → FIX NGAY, đây là regression

---

## Verification Checklist — Sau v0.3.0

```bash
# === Core (v0.1.0) ===
mekong --help                          # all commands visible
mekong run "hello world"               # basic agent works
mekong sop run deploy --dry-run        # SOP engine works

# === Business (v0.2.0) ===
mekong dashboard                       # Andon board shows
mekong crm lead list                   # CRM works
mekong finance revenue                 # Finance works

# === Platform (v0.3.0) ===
mekong kaizen                          # Health score shows
mekong kaizen report --days=7          # Full report generates
mekong marketplace list                # Installed packages list
mekong marketplace search "deploy"     # Search works (may need internet)
mekong plugin list                     # Plugin system loaded
mekong sop list                        # 20 templates (5+10+5)

# === Completeness ===
pnpm build                             # Clean build
pnpm test                              # All tests pass
```

Nếu tất cả pass → **mekong-cli v0.3.0 complete**.

Solo founder giờ có:
- Dev workflow (code, review, deploy, incident response)
- Business ops (CRM, finance, invoicing, support)  
- Self-improvement (Kaizen analytics, learned skills, prompt optimization)
- Extensibility (marketplace SOPs, community plugins, MCP tools)
- Autonomous operations (advanced heartbeat, event triggers, proactive suggestions)

Đó là đủ để 1 người vận hành tech company. 🚀
