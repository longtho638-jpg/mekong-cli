const path = require('path');

const MEKONG_DIR = process.env.MEKONG_DIR || path.join(process.env.HOME || '', 'mekong-cli');

// ═══════════════════════════════════════════════════════════════
// 🔒 IRON CONFIG — KHOÁ CỨNG: CẤM THAY ĐỔI (kể cả Tôm Hùm)
// Approved by Chairman — Only modifiable by direct human edit
// Date locked: 2026-02-15 | Version: v1.1.0-BMAD-DNA
// DNA FUSION: ClaudeKit × BMAD-METHOD — 風林火山 + ⛰️NÚI
// ═══════════════════════════════════════════════════════════════

const config = {
  MEKONG_DIR,
  OPENCLAW_HOME: process.env.OPENCLAW_HOME || path.join(process.env.HOME || '', '.openclaw'),
  WATCH_DIR: path.join(MEKONG_DIR, 'tasks'),
  PROCESSED_DIR: path.join(MEKONG_DIR, 'tasks', 'processed'),
  REJECTED_DIR: path.join(MEKONG_DIR, 'tasks', 'rejected'),
  LOG_FILE: process.env.TOM_HUM_LOG || path.join(process.env.HOME || '', 'tom_hum_cto.log'),
  THERMAL_LOG: process.env.TOM_HUM_THERMAL_LOG || path.join(process.env.HOME || '', 'tom_hum_thermal.log'),
  MISSION_FILE: '/tmp/tom_hum_next_mission.txt',
  DONE_FILE: '/tmp/tom_hum_mission_done',
  TASK_PATTERN: /^(?:CRITICAL_|HIGH_|MEDIUM_|LOW_)?(?:mission_)?.+\.txt$/,
  MISSION_TIMEOUT_MS: 60 * 60 * 1000,
  TIMEOUT_SIMPLE: 15 * 60 * 1000,     // 15 phút — 🌪️GIÓ
  TIMEOUT_MEDIUM: 30 * 60 * 1000,     // 30 phút — 🌲RỪNG
  TIMEOUT_COMPLEX: 60 * 60 * 1000,    // 60 phút — 🔥LỬA
  TIMEOUT_STRATEGIC: 90 * 60 * 1000,  // 90 phút — ⛰️NÚI (BMAD workflows)
  POLL_INTERVAL_MS: 100, // ⚡ ULTRA SPEED: 100ms Polling (Bug #14: Sub-5s response)
  COOLING_INTERVAL_MS: 90000,
  SCANNER_INTERVAL_MS: 30 * 60 * 1000, // 30 mins — Level 4 Scanner
  AUTO_CTO_EMPTY_THRESHOLD: 10, // 10 polls × 0.2s = 2s idle → generate next task
  STATE_FILE: path.join(MEKONG_DIR, 'tasks', '.tom_hum_state.json'),
  API_RATE_GATE_MS: 0, // 🛡️ PROXY_RULES §4: Nuclear Speed — AG Ultra UNLIMITED, zero gap
  // 🔒 LOCKED — DO NOT CHANGE (2026-02-15) — Port must match running anthropic-adapter.js
  // 🦞 LOBSTER PILOT v1.0: Route through ADAPTER (20128)
  // 🦞 HYBRID BRAIN v2.0: Route CC CLI through BRIDGE (20129) -> ADAPTER (20128)
  PROXY_PORT: process.env.PROXY_PORT ? parseInt(process.env.PROXY_PORT) : 20129,
  // Anthropic Adapter (translates /v1/messages → dual AG Proxy rotation)
  // 🦞 LOBSTER: Cân bằng tải 2 acc Ultra qua adapter
  CLOUD_BRAIN_URL: process.env.CLOUD_BRAIN_URL || 'http://127.0.0.1:20128',
  QWEN_PROXY_PORT: 8081, // Qwen/VLLM dedicated port
  MODEL_NAME: process.env.MODEL_NAME || 'claude-sonnet-4-6-20250514', // v2026.2.27: Model 4.6
  // 虛實 Binh Phap Model Hierarchy
  // 🔥LỬA (Complex) → claude-opus-4-5-20250514
  OPUS_MODEL: 'claude-opus-4-6', // v2026.2.28: Upgraded to Opus 4.6 (match PRO pane)
  USE_GH_MODELS: false,
  GH_MODEL_NAME: 'claude-sonnet-4-6-20250514',
  WORKER_MODEL_NAME: 'claude-sonnet-4-6-20250514', // "Strongest" Local Model
  FALLBACK_MODEL_NAME: 'gemini-3-pro', // v2026.3.1: Upgraded for Max x20 intelligence via proxy
  QWEN_MODEL_NAME: process.env.QWEN_MODEL_NAME || 'qwen3-coder-next',
  // Engine selection: 'antigravity' (default, port 20128) or 'qwen' (port 8081)
  // 🔒 LOCKED — 'antigravity' uses port 20128 → upstream AG 9191 + Google fallback
  ENGINE: process.env.TOM_HUM_ENGINE || 'antigravity',
  // 🎯 STICKY ROUTING MODE — 3-worker assignment (Feb 28 2026)
  // P0: mekong-cli | P1: algo-trader | P2: well
  PROJECTS: ['mekong-cli', 'algo-trader', 'well'],

  // Self-Healer (v2026.2.13)
  HEALTH_CHECK_INTERVAL_MS: 30_000,
  PROXY_PING_TIMEOUT_MS: 5_000,
  MAX_RECOVERY_ATTEMPTS: 3,
  STALE_OUTPUT_THRESHOLD_MS: 3 * 60_000,
  MODEL_FALLBACK_CHAIN: ['claude-sonnet-4-6-20250514', 'claude-sonnet-4-5-20250514', 'gemini-3-flash', 'qwen3-coder-next'],

  // ANTIGRAVITY GOD MODE
  ANTIGRAVITY_KEY: 'GOD_MODE_ACTIVE',
  FULL_CLI_MODE: true, // P0 IS CC CLI — no monitor pane
  // 🦞 1-Tmux Session, 1 Window (`brain`), 2 Panes (P0=Opus, P1=Proxy)
  // 🦞 1-Tmux Session, 1 Window (`brain`), 3 Panes:
  //   P0=Opus Standby, P1=Well (API/Proxy), P2=Algo-Trader (API/Proxy)
  TMUX_SESSION: 'tom_hum',

  // Agent Team orchestration
  AGENT_TEAM_SIZE_DEFAULT: 3, // 3 workers: P0(standby) P1(well) P2(algo-trader)
  MAX_CONCURRENT_MISSIONS: 2, // P1 + P2 active, P0 standby
  AGENT_TEAM_TIMEOUT_MS: 4 * 60 * 60 * 1000, // 4 hours for deep missions

  // Complexity classification keywords
  COMPLEXITY: {
    STRATEGIC_KEYWORDS: ['bmad', 'product brief', 'prd', 'user story', 'epic', 'sprint planning', 'from scratch', 'greenfield', 'full lifecycle', 'new system', 'new module', 'quick-spec', 'dev-story', 'code-review bmad', 'retrospective'],
    COMPLEX_KEYWORDS: ['refactor', 'redesign', 'migrate', 'rewrite', 'overhaul', 'architecture', 'cross-module', 'full-stack', 'multi-project', 'monorepo', 'security audit', 'tech debt', 'performance audit', 'deep scan', 'binh phap', 'evolution', 'synthesis', 'agi'],
    MEDIUM_KEYWORDS: ['feature', 'implement', 'security', 'audit', 'multi-file', 'integration', 'api', 'database', 'auth', 'testing'],
    // Priority: STRATEGIC > COMPLEX > MEDIUM > SIMPLE
  },

  // Agent Team subagent roles for parallel execution
  AGENT_TEAM_ROLES: {
    security_scan: ['code-reviewer', 'tester', 'debugger', 'fullstack-developer'],
    tech_debt: ['code-reviewer', 'tester', 'fullstack-developer', 'researcher'],
    perf_audit: ['code-reviewer', 'tester', 'debugger', 'fullstack-developer'],
    deep_scan: ['architect', 'researcher', 'fullstack-developer', 'security-auditor'],
    agi_evolution: ['architect', 'researcher', 'planner', 'fullstack-developer'],
    default: ['code-reviewer', 'tester', 'debugger', 'fullstack-developer'],
  },

  // Rule: Match ClaudeKit /commands to situation — NOT blind /cook
  // complexity: 'simple' | 'medium' | 'complex' — determines prompt format
  BINH_PHAP_TASKS: [
    { id: 'binh_phap_deep_scan', complexity: 'complex', cmd: 'Deep Scan & Fix via Binh Pháp Master: Analyze entire codebase for architectural flaws, circular deps, and security gaps. Fix 10x impact issues.' },
    { id: '10x_architecture', complexity: 'complex', cmd: '10x Architecture Review: Propose and implement modularization to decoupling core services.' },
    { id: 'console_cleanup', complexity: 'simple', cmd: 'Clean all console.log and debug statements from production code' },
    { id: 'type_safety', complexity: 'medium', cmd: 'Audit TypeScript any types — report all locations needing proper type annotations, fix them' },
    { id: 'a11y_audit', complexity: 'medium', cmd: 'WCAG 2.1 AA accessibility audit — report and fix alt text, ARIA labels, semantic HTML issues' },
    { id: 'security_scan', complexity: 'complex', cmd: 'Security audit — check CSP headers, XSS vectors, exposed secrets, CORS config. Fix all issues found' },
    { id: 'perf_audit', complexity: 'complex', cmd: 'Performance audit — bundle size, lazy loading, image optimization, Core Web Vitals improvements' },
    { id: 'test_suite', complexity: 'medium', cmd: 'Run full test suite, report failures and coverage gaps, fix failing tests' },
    { id: 'debug_errors', complexity: 'simple', cmd: 'Investigate any runtime errors, unhandled rejections, or console warnings in production' },
    { id: 'i18n_sync', complexity: 'medium', cmd: 'Sync all i18n translation keys — fix missing translations across all locales' },
    { id: 'tech_debt', complexity: 'complex', cmd: 'Full codebase review — TODO/FIXME/HACK count, dead code, circular deps. Fix all tech debt' },
    { id: 'agi_evolution', complexity: 'complex', cmd: 'AGI Evolution: Research and implement new autonomous capabilities. Self-improve internal logic.' },
    { id: 'knowledge_synthesis', complexity: 'complex', cmd: 'Knowledge Synthesis: Consolidate learnings from recent missions into Knowledge Items.' },
    { id: 'self_correction', complexity: 'complex', cmd: 'Self-Correction: Analyze recent failures and implement systemic fixes.' },
    // ⛰️ NÚI — BMAD Strategic Tasks (DNA Fusion)
    { id: 'bmad_quick_spec', complexity: 'strategic', cmd: 'BMAD: Run /bmad-bmm-quick-spec to analyze codebase and generate tech-spec for top improvements' },
    { id: 'bmad_code_review', complexity: 'strategic', cmd: 'BMAD: Run /bmad-bmm-code-review for comprehensive adversarial quality review across all code facets' },
    { id: 'bmad_retrospective', complexity: 'strategic', cmd: 'BMAD: Run /bmad-bmm-retrospective to analyze recent work patterns and suggest process improvements' },
  ],

  // 🔥 Safety Gate v2.0 (火攻 Ch.12) — 亡國不可以復存
  SAFETY_GATE: {
    MAX_FILES_CHANGED: 15,
    MAX_DELETIONS: 500,
    FORBIDDEN_FILES: [
      'package.json', 'package-lock.json', 'pnpm-lock.yaml', '.env', '.env.local',
      'next.config.js', 'next.config.mjs', 'next.config.ts',
      'tsconfig.json', 'vercel.json', 'wrangler.jsonc',
      'ecosystem.config.js', 'config.js',
    ],
  },

  // 💰 Budget Enforcement (作戰 Ch.2) — 日費千金
  AG_HOURLY_BUDGET: 30,

  // 🧠 OpenClaw-RL Integration (Continuous Reinforcement Learning)
  // Connect to remote GPU server running OpenClaw-RL for self-improving CTO
  OPENCLAW_RL_HOST: process.env.OPENCLAW_RL_HOST || null, // e.g. 'http://<GPU_IP>:30000/v1'
  OPENCLAW_RL_API_KEY: process.env.OPENCLAW_RL_API_KEY || 'openclaw-rl',
  OPENCLAW_RL_MODEL: process.env.OPENCLAW_RL_MODEL || 'qwen3-4b',
  OPENCLAW_RL_ENABLED: !!process.env.OPENCLAW_RL_HOST, // Auto-enable when host is set
  OPENCLAW_RL_FEEDBACK_MODE: process.env.OPENCLAW_RL_FEEDBACK_MODE || 'auto', // 'auto' | 'manual'
  OPENCLAW_RL_COOLDOWN_MS: 5 * 60 * 1000, // 5 min between RL dispatches
};

// 🧬 DNA FUSION: BMAD × ClaudeKit — Slash command mapping
// Strategic missions use BMAD slash commands instead of /cook
config.BMAD_WORKFLOW_MAP = Object.freeze({
  quick: '/bmad-bmm-quick-spec',       // Quick tech-spec generation
  dev: '/bmad-bmm-dev-story',          // Story-driven implementation
  review: '/bmad-bmm-code-review',     // Adversarial code review
  retro: '/bmad-bmm-retrospective',    // Sprint retrospective
  prd: '/bmad-bmm-create-prd',         // Full PRD creation
  arch: '/bmad-bmm-create-architecture', // Architecture design
  epics: '/bmad-bmm-create-epics-and-stories', // Epic & story decomposition
});

// 🔒 IRON LOCK: Object.freeze prevents runtime modification
// CC CLI, Tôm Hùm, or any agent cannot change these values programmatically
Object.freeze(config);
Object.freeze(config.COMPLEXITY);
Object.freeze(config.AGENT_TEAM_ROLES);
Object.freeze(config.BINH_PHAP_TASKS);
Object.freeze(config.MODEL_FALLBACK_CHAIN);
Object.freeze(config.SAFETY_GATE);
Object.freeze(config.SAFETY_GATE.FORBIDDEN_FILES);

module.exports = config;
