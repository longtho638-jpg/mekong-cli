# Mekong CLI Dashboard Wireframe

## Main Dashboard View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MEKONG CLI DASHBOARD                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  🚀 Mekong CLI v3.0.0 - RaaS Agency Operating System                     │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  📊 SYSTEM STATUS                                                         │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐                │
│  │ Agents: 4   │ Tasks: 12   │ Memory:     │ Credits:    │                │
│  │ ✓ Healthy   │ 3 Running   │ 85%         │ 1,250       │                │
│  │             │ 9 Queued    │             │             │                │
│  └─────────────┴─────────────┴─────────────┴─────────────┘                │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  🎯 RECENT MISSIONS                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ #1245 [Build API] - Success (2 min ago)                               ││
│  │     ┌─ mkdir src/ ── create main.py ── add routes ── verify build ─┐   ││
│  │     └─ [███████████████████████████████████████░░░░] 90%            │   ││
│  │                                                                 │   ││
│  │ #1244 [Fix bug] - Failed (5 min ago)                              ││
│  │     ┌─ find issue ── apply fix ── run tests ── verify ──────────┐     ││
│  │     └─ [███████████████████████░░░░░░░░░░░░░░░░░░] 60% (ERROR) │     ││
│  │                                                                 │     ││
│  │ #1243 [Add auth] - Success (1 hour ago)                             ││
│  │     ┌─ setup auth ── create middleware ── test ── deploy ────────┐     ││
│  │     └─ [██████████████████████████████████████████████] 100%     │     ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  🛠️ QUICK ACTIONS                                                         │
│  [ 🍳 Cook Mission ] [ 📋 Plan Only ] [ 🧪 Test ] [ 🔧 Config ] [ 📚 Docs ] │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  📁 PROJECT RECIPES                                                        │
│  • Build Project     • Deploy App      • Test Suite                       │
│  • Setup DB          • Add Feature     • Fix Security                     │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  🤖 AVAILABLE AGENTS                                                      │
│  GitAgent • FileAgent • ShellAgent • RecipeCrawler • LeadHunter           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Mission Detail View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MISSION #1245 DETAIL                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  🎯 GOAL: Build FastAPI application with authentication                    │
│  📅 Created: Today, 10:30 AM           🕐 Duration: 2m 15s               │
│  💰 Cost: 3 credits                  💹 Status: SUCCESS                   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  📋 EXECUTION STEPS                                                        │
│  ┌─ 1. Setup Project [✓] ────────────────────────────────────────────────┐ │
│  │   Command: mkdir src && touch main.py                                  │ │
│  │   Duration: 0.5s | Exit: 0                                             │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│  ┌─ 2. Create API Routes [✓] ────────────────────────────────────────────┐ │
│  │   Command: echo "from fastapi..." > main.py                            │ │
│  │   Duration: 1.2s | Exit: 0                                             │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│  ┌─ 3. Add Auth Middleware [✓] ──────────────────────────────────────────┐ │
│  │   Command: LLM Mode - Generate auth code                               │ │
│  │   Duration: 30s | Exit: 0                                              │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│  ┌─ 4. Run Tests [✓] ────────────────────────────────────────────────────┐ │
│  │   Command: pytest tests/                                               │ │
│  │   Duration: 45s | Exit: 0                                              │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│  ┌─ 5. Verify Build [✓] ─────────────────────────────────────────────────┐ │
│  │   Command: python -m py_compile main.py                                │ │
│  │   Duration: 0.8s | Exit: 0                                             │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  💾 OUTPUT                                                                 │
│  Successfully created FastAPI app with:                                    │
│  - Authentication middleware                                               │
│  - Protected routes                                                        │
│  - Token refresh system                                                    │
│  - Test coverage >80%                                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Agent Configuration View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AGENT CONFIGURATION                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  🤖 AGENT: FileAgent                                                      │
│  📄 DESCRIPTION: Handles file operations (read, write, search)           │
│  ⚙️ STATUS: Active                                                        │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  🔧 CONFIGURATION PARAMETERS                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Maximum file size: [ 10 MB        ]                                    │ │
│  │ Allowed extensions: [.py, .js, .ts, .md, .json, .txt]                  │ │
│  │ Search depth:    [ 5             ]                                     │ │
│  │ Timeout:         [ 30 seconds    ]                                     │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  🚀 CAPABILITIES                                                           │
│  • Find files by name/pattern                                              │
│  • Read file contents                                                      │
│  • Write/modify files                                                      │
│  • Tree directory structure                                                │
│  • Grep for patterns in files                                              │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  📊 PERFORMANCE METRICS                                                    │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐                │
│  │ Calls: 245  │ Success:    │ Avg. Time:  │ Error:      │                │
│  │             │ 98.8%       │ 0.45s       │ 1.2%        │                │
│  └─────────────┴─────────────┴─────────────┴─────────────┘                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Command Line Interface Layout

```
$ mekong dash
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MEKONG DASHBOARD                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ Press a button, get things done.                                          │
│ Select an action below — no coding needed.                                │
│                                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐                       │
│  │  🍳     │  │  📋     │  │  🧪     │  │  📚     │                       │
│  │  COOK   │  │  PLAN   │  │  TEST   │  │  DOCS   │  │
│  │ Mission │  │  Goal   │  │  Suite  │  │  GEN    │  │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘                       │
│                                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐                       │
│  │  🔧     │  │  📊     │  │  🚀     │  │  🔒     │                       │
│  │ CONFIG  │  │ STATUS  │  │ DEPLOY  │  │ SECURE  │                       │
│  │         │  │         │  │         │  │         │                       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘                       │
│                                                                             │
│  Pick a number (or 'q' to quit): [1-8/q]                                  │
│  1 → 🍳 Cook Mission → Execute a goal end-to-end                          │
│  2 → 📋 Plan Goal    → Decompose goal into steps (no execution)           │
│  3 → 🧪 Test Suite   → Run project tests                                  │
│  4 → 📚 Docs Gen     → Generate project documentation                     │
│  5 → 🔧 Config       → Manage API keys and settings                       │
│  6 → 📊 Status       → Check system health                                │
│  7 → 🚀 Deploy       → Deploy to staging/production                       │
│  8 → 🔒 Secure       → Run security audit                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```