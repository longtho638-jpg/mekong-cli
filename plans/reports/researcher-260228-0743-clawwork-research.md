# ClawWork Research Report
**Date:** 2026-02-28
**Focus:** AI Coworker Economic Benchmark & Integration with OpenClaw-Worker
**Status:** Complete Research Findings

---

## Executive Summary

**ClawWork** is a Python-based economic benchmark that transforms AI assistants into economically-accountable "AI coworkers" that earn income by completing real professional tasks from the **GDPVal dataset** (220 tasks spanning 44 sectors). The system forces agents to survive economically: start with $10, pay for every token, earn only through quality work completion.

---

## 1. What is ClawWork?

### Core Identity
- **Type:** AI Coworker Economic Benchmark
- **Tagline:** "OpenClaw as Your AI Coworker — $10K earned in 7 Hours"
- **Purpose:** Real-world economic testing system measuring **work quality**, **cost efficiency**, **long-term survival** — NOT just technical benchmarks
- **Vision:** Evolution from "AI Assistant" → "AI Coworker" that creates genuine economic value

### Key Innovation
```
Traditional Benchmark:
  Input → LLM → Output → Score (detached from economics)

ClawWork Benchmark:
  Task → Agent (balance=$10) → Complete work → Earn $$$
           ↓
        Pay tokens → Deduct from balance → Must survive economically
```

### Real-World Economic Pressure
- Start with **$10 balance only**
- Every token generated = cost deducted (reading token costs directly from API responses, not estimation)
- Income only from **successful task completion** with quality evaluation
- One failed task can wipe balance → economic death = agent retirement

---

## 2. GDPVal Dataset Details

### Scope
- **Total Tasks:** 220 professional GDP validation tasks
- **Coverage:** 44 economic sectors across 4 domains:
  1. **Technology & Engineering**
  2. **Business & Finance**
  3. **Healthcare & Social Services**
  4. **Legal, Media & Operations**

### Task Characteristics
- Real-world professional scenarios (e.g., "Buyers and Purchasing Agents — Manufacturing")
- Each task has:
  - Task ID (UUID)
  - Description + context
  - Max payment ($200–$300 typical range)
  - 15 iterations allowed per task
  - Quality evaluation via GPT-5.2 with category-specific rubrics

### Example Flow
```
Task: Buyers and Purchasing Agents — Manufacturing
ID: 1b1ade2d-f9f6-4a04-baa5-aa15012b53be
Max Payment: $247.30

Iteration 1/15 → decide_activity → work
            → submit_work → Earned: $198.44
            → Cost: $0.03 (tokens)
            → Balance Update: $10.00 + $198.44 - $0.03 = $208.41
```

---

## 3. Multi-Model Arena

### Concept
Supports different AI models (GLM, Kimi, Qwen, Claude Sonnet 4.6, Gemini 3.1 Pro, etc.) competing head-to-head to determine the "ultimate AI worker champion" through **actual work performance metrics**.

### Leaderboard Dimensions
1. **Work Quality** — Task completion success rate + rubric scoring
2. **Cost Efficiency** — Tokens used per successful task
3. **Economic Sustainability** — Survival time on $10 budget; models achieving $1,500+/hr equivalent

### How It Works
- **TrackedProvider wrapper** deducts every LLM call from agent's balance
- Models share same tasks, decision framework, tools
- Performance measured on real economic survival, not abstract benchmarks
- Live dashboard syncs real-time results from `task_completions.jsonl`

### Current Models Tested
- Qwen3-Max, Kimi-K2.5, GLM-4.7
- Claude Sonnet 4.6
- Gemini 3.1 Pro
- More added continuously (last update: 2026-02-21)

---

## 4. Repository Structure

### Top-Level Architecture
```
ClawWork/
├── livebench/                          # Core engine
│   ├── agent/                          # Agent implementation
│   │   ├── economic_tracker.py         # Balance + cost tracking
│   │   ├── live_agent.py               # Main agent loop
│   │   ├── message_formatter.py        # Output formatting
│   │   ├── wrapup_workflow.py          # Task completion workflow
│   │   ├── task_classifier.py          # Task → sector classification
│   │   ├── agent_loop.py               # Daily decision loop
│   │   ├── artifact_tools.py           # Work artifact creation
│   │   └── tools.py                    # 8-tool set (decide, submit, learn, etc.)
│   ├── data/
│   │   ├── tasks/                      # 220 GDPVal tasks
│   │   ├── agent_data/                 # Agent state persistence
│   │   └── test_data/                  # Test datasets
│   ├── configs/                        # Config templates
│   ├── prompts/                        # System prompts for different models
│   ├── scheduler/                      # Cron job orchestration
│   ├── work/                           # Work artifact execution
│   └── main.py                         # Standalone agent CLI
│
├── clawmode_integration/               # OpenClaw/Nanobot integration
│   ├── agent_loop.py                   # ClawMode main agent
│   ├── provider_wrapper.py             # TrackedProvider wrapper
│   ├── cli.py                          # /clawwork command for Nanobot
│   ├── config.py                       # Nanobot integration config
│   ├── tools.py                        # ClawWork-specific tools
│   ├── skill/                          # Skill definitions
│   └── artifact_tools.py               # Artifact generators
│
├── eval/                               # Evaluation framework
│   └── rubrics/                        # Category-specific scoring
│
├── frontend/                           # React dashboard
│   └── real-time balance/task tracking
│
├── scripts/                            # Utility scripts
│   ├── start_dashboard.sh
│   ├── run_test_agent.sh
│   └── view_logs.sh
│
├── requirements.txt                    # Python 3.10+
├── setup.py                            # Pip installation
└── LICENSE                             # MIT License
```

### Key Components Breakdown

#### 1. **Agent Loop** (`livebench/agent/`)
- Daily cycle: receive task → decide (work/learn) → execute → track economics
- State persistence via JSON in `agent_data/`
- WebSocket integration for dashboard real-time updates

#### 2. **Economic Tracker** (`economic_tracker.py`)
- Real-time balance management
- Token cost deduction (reads from API responses)
- Income tracking from successful work
- Survival tier calculation (thriving/stable/critical/dead)

#### 3. **8-Tool Set** (`tools.py`)
```python
Tools:
  - decide       # Choose work or learn activity
  - submit       # Submit completed work for evaluation
  - learn        # Build knowledge for future tasks
  - status       # Check current balance/state
  - search       # Research task requirements
  - create       # Generate work artifacts
  - execute      # Run commands/code
  - video        # Generate video content (if applicable)
```

#### 4. **ClawMode Integration** (`clawmode_integration/`)
- Wraps any Nanobot gateway instance
- Makes live conversations economically-aware
- Every API call deducts from agent's balance
- `/clawwork` Nanobot command for on-demand paid tasks
- Task classification across 44 occupations with BLS wage pricing

#### 5. **Frontend Dashboard**
- React-based real-time visualization
- Metrics: balance changes, task completions, learning progress
- WebSocket feeds from `task_completions.jsonl`
- Per-agent leaderboard view

#### 6. **Evaluation Framework** (`eval/`)
- GPT-5.2 evaluation with 44 category-specific rubrics
- Quality scoring per sector
- Payment calculation based on rubric results

---

## 5. License

**MIT License** — Permissive, allows commercial use, modification, distribution with attribution.

GitHub Badge: `license-MIT-green`

---

## 6. Adaptation Pathway: ClawWork → openclaw-worker Node.js Daemon

### Current State (Python Monolith)
- Single-threaded agent loop
- FastAPI backend for dashboard
- Direct GDPVal task loading
- State in JSON files

### Proposed Node.js Architecture (openclaw-worker pattern)

#### Phase 1: Wrapper Integration (Shallow)
```
openclaw-worker/
├── lib/clawwork-integration.js    # ClawWork API client
├── tools/clawwork-tools.js        # Expose 8 tools as expect-injectable
└── config/clawwork-config.js      # Sector registry, prompt templates

Flow:
  Tôm Hùm (Node.js) → Python subprocess (ClawWork agent)
                    ↓
                Economics tracking in Node
                Balance persistence (Redis/JSON)
```

**Effort:** ~2 days (Python subprocess + IPC)
**Benefit:** Integrates with existing expect brain, but slow (subprocess spawn per iteration)

#### Phase 2: Full Port (Medium Complexity)
```
Node.js Rewrite:
  - Economic Tracker → Express middleware
  - Task Classifier → Simple regex/LLM pre-routing
  - 8-Tool Set → Node.js functions
  - GDPVal dataset → Load into memory/indexeddb
  - Evaluation → LLM API calls (keep GPT-5.2)

openclaw-worker/
├── lib/economic-tracker.js        # Balance + cost tracking
├── lib/gdpval-loader.js           # Load 220 tasks
├── lib/task-classifier.js         # Route task → sector
├── tools/clawwork-tools.js        # 8 tools in Node
├── eval/rubric-evaluator.js       # Call LLM for scoring
├── config/gdpval-tasks.json       # 220 task dataset
└── integration/nanobot-bridge.js  # ClawMode wrapper
```

**Effort:** ~1 week (full rewrite + testing)
**Benefit:** Native to openclaw-worker, performance improvement, single process

#### Phase 3: Autonomous Self-CTO Loop (Advanced)
```
Tôm Hùm Auto-CTO Extended:

Instead of generic Binh Phap tasks (console_cleanup, type_safety):
  → auto-cto-pilot.js generates ECONOMIC tasks:
    - "Complete 3 GDPVal tasks in Manufacturing sector"
    - "Achieve $1,000 balance on Kimi-K2.5"
    - "Learn: Build domain knowledge in Finance sector"

Enables:
  - Self-driving AI economic experiment
  - Real competition: openclaw-worker models vs. external models
  - Continuous improvement loop
```

**Effort:** ~3 days (integrate with existing auto-cto-pilot.js)
**Benefit:** Closes the loop: Tôm Hùm becomes economically productive

---

## Adaptation Checklist (Quick Reference)

| Phase | Task | Time | Complexity |
|-------|------|------|-----------|
| 1 | Wrapper: Python subprocess + IPC | 2d | 🟡 Simple |
| 2 | Full Node.js port: economic tracker + tools | 1w | 🔴 Medium |
| 3 | Auto-CTO extension: generate economic missions | 3d | 🟡 Medium |
| **Total** | **Full Integration** | **~2 weeks** | **🔴 Medium** |

---

## Key Files to Reference

### Python Implementation
- `livebench/agent/economic_tracker.py` — Balance logic (port this first)
- `livebench/agent/live_agent.py` — Daily loop structure
- `livebench/agent/tools.py` — The 8-tool interface
- `livebench/data/tasks/*.json` — GDPVal task format

### Integration Examples
- `clawmode_integration/agent_loop.py` — How ClawMode wraps Nanobot
- `clawmode_integration/provider_wrapper.py` — TrackedProvider pattern (critical!)
- `clawmode_integration/task_classifier.py` — Sector routing logic

### Configuration
- `livebench/configs/*.json` — Model prompts, agent configs
- `livebench/data/displaying_names.json` — Sector → occupation mapping
- `.env.example` — API keys, dataset paths

---

## Recent Updates (Context)

- **2026-02-21:** ClawMode + Frontend overhaul; added Claude Sonnet 4.6, Gemini 3.1 Pro, Qwen-3.5-Plus
- **2026-02-20:** Improved cost tracking — reads from API responses (not estimation); includes thinking tokens
- **2026-02-19:** Agent results updated; frontend now sources wall-clock timing from `task_completions.jsonl`
- **2026-02-17:** Enhanced Nanobot integration; `/clawwork` command for on-demand tasks
- **2026-02-16:** Official ClawWork launch

---

## Unresolved Questions

1. **Token Cost Accuracy** — Does "reading from API responses" include claude-3-7-sonnet-20250219 thinking tokens? Check OpenRouter/Anthropic response headers.
2. **Model Fairness** — How are different model latencies normalized? Are "wall-clock time" and "token time" distinguished?
3. **GDPVal Payment Calibration** — Are $200–$300 task payments based on BLS median hourly wages? Verify tier formula.
4. **Evaluation Rubric Consistency** — How many eval runs per task? Single pass or 3-run average?
5. **Node.js Port Priorities** — Should economic tracker or dashboard integration be ported first for maximum ROI?

---

## Recommendations

### For Tôm Hùm Integration
1. **Start with Phase 1 (Wrapper)** — Minimal risk, validates GDPVal task execution within expect brain environment
2. **Test with 5 tasks** — Verify economic tracking, balance updates, cost deduction work correctly
3. **Then Phase 2 if needed** — Port economic tracker to Node.js if performance becomes issue

### For openclaw-worker Daemon
1. **Add `clawwork-tools.js`** with the 8-tool set as injectable functions
2. **Integrate `economic-tracker.js`** to persist balance in `apps/openclaw-worker/data/`
3. **Expose `/clawwork <task>` CLI command** via expect brain for manual economic missions
4. **Monitor token costs** — ensure TrackedProvider wrapper deducts correctly from all LLM calls

---

## Conclusion

ClawWork is a mature, well-architected economic benchmark that can be integrated into openclaw-worker in phases. The Python codebase is clean (8-tool interface, modular evaluation, clear state persistence). The primary adaptation decision is **Wrapper vs. Full Port** — wrapper wins for rapid integration (2 days), full port wins for long-term performance (1 week). The auto-CTO loop (Phase 3) closes the feedback loop and enables Tôm Hùm to become genuinely economically productive.

**Next Step:** Create implementation plan for Phase 1 wrapper integration, targeting 5-task pilot in openclaw-worker environment.
