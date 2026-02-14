const path = require('path');

const MEKONG_DIR = process.env.MEKONG_DIR || '/Users/macbookprom1/mekong-cli';

module.exports = {
  MEKONG_DIR,
  OPENCLAW_HOME: process.env.OPENCLAW_HOME || path.join(process.env.HOME || '', '.openclaw'),
  WATCH_DIR: path.join(MEKONG_DIR, 'tasks'),
  PROCESSED_DIR: path.join(MEKONG_DIR, 'tasks', 'processed'),
  LOG_FILE: process.env.TOM_HUM_LOG || '/Users/macbookprom1/tom_hum_cto.log',
  THERMAL_LOG: process.env.TOM_HUM_THERMAL_LOG || '/Users/macbookprom1/tom_hum_thermal.log',
  MISSION_FILE: '/tmp/tom_hum_next_mission.txt',
  DONE_FILE: '/tmp/tom_hum_mission_done',
  TASK_PATTERN: /^mission_.*\.txt$/,
  MISSION_TIMEOUT_MS: 45 * 60 * 1000,
  TIMEOUT_SIMPLE: 15 * 60 * 1000,   // 15 phút
  TIMEOUT_MEDIUM: 30 * 60 * 1000,   // 30 phút
  TIMEOUT_COMPLEX: 45 * 60 * 1000,  // 45 phút
  POLL_INTERVAL_MS: 1000, // PROJECT FLASH: 1s Polling
  COOLING_INTERVAL_MS: 90000,
  AUTO_CTO_EMPTY_THRESHOLD: 2, // 2 polls × 2s = 4s idle → generate next task
  STATE_FILE: path.join(MEKONG_DIR, 'tasks', '.tom_hum_state.json'),
  PROXY_PORT: process.env.PROXY_PORT ? parseInt(process.env.PROXY_PORT) : 11434, // Native Ollama Anthropic-compatible port (0.14.x+)
  // Anthropic Adapter (translates /v1/messages → /v1/chat/completions for Ollama)
  CLOUD_BRAIN_URL: process.env.CLOUD_BRAIN_URL || 'http://localhost:11436',
  QWEN_PROXY_PORT: 8081, // Qwen/VLLM dedicated port
  MODEL_NAME: process.env.MODEL_NAME || 'qwen3-coder-next', // Cloud Model (80B A100)
  USE_GH_MODELS: false,
  GH_MODEL_NAME: 'deepseek-coder-v2',
  WORKER_MODEL_NAME: 'deepseek-coder-v2', // "Strongest" Local Model
  FALLBACK_MODEL_NAME: 'gemini-3-flash', // P2+: Gemini (cashback 100%)
  QWEN_MODEL_NAME: process.env.QWEN_MODEL_NAME || 'qwen3-coder-next',
  // Engine selection: 'antigravity' (default, port 11436) or 'qwen' (port 8081)
  ENGINE: process.env.TOM_HUM_ENGINE || 'antigravity',
  PROJECTS: ['mekong-cli', 'agencyos-web', 'sophia-ai-factory', 'wellnexus', 'apex-os', '84tea', 'anima119', 'sa-dec-flower-hunt'],

  // ANTIGRAVITY GOD MODE
  ANTIGRAVITY_KEY: 'GOD_MODE_ACTIVE',
  FULL_CLI_MODE: false, // P0 is CTO/Monitor, P1-P3 are Workers

  // Agent Team orchestration
  AGENT_TEAM_SIZE_DEFAULT: 4, // P0 (CTO) + P1-P3 (Workers) — OpenRouter cloud, no bottleneck
  AGENT_TEAM_TIMEOUT_MS: 4 * 60 * 60 * 1000, // 4 hours for deep missions

  // Complexity classification keywords
  COMPLEXITY: {
    COMPLEX_KEYWORDS: ['refactor', 'redesign', 'migrate', 'rewrite', 'overhaul', 'architecture', 'cross-module', 'full-stack', 'multi-project', 'monorepo', 'security audit', 'tech debt', 'performance audit', 'deep scan', 'binh phap', 'evolution', 'synthesis', 'agi'],
    MEDIUM_KEYWORDS: ['feature', 'implement', 'security', 'audit', 'multi-file', 'integration', 'api', 'database', 'auth', 'testing'],
    // Anything not matching COMPLEX or MEDIUM is SIMPLE
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
  ],
};
