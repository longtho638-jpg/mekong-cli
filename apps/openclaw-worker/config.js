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
  POLL_INTERVAL_MS: 3000,
  COOLING_INTERVAL_MS: 90000,
  AUTO_CTO_EMPTY_THRESHOLD: 6, // 6 polls × 5s = 30s idle → generate next task
  STATE_FILE: path.join(MEKONG_DIR, 'tasks', '.tom_hum_state.json'),
  PROXY_PORT: parseInt(process.env.PROXY_PORT || '8080', 10),
  QWEN_PROXY_PORT: parseInt(process.env.QWEN_PROXY_PORT || '8081', 10),
  MODEL_NAME: 'claude-opus-4-6-thinking',
  QWEN_MODEL_NAME: process.env.QWEN_MODEL_NAME || 'qwen-coder-plus',
  // Engine selection: 'antigravity' (default, port 8080) or 'qwen' (port 8081)
  ENGINE: process.env.TOM_HUM_ENGINE || 'antigravity',
  PROJECTS: ['sophia-ai-factory', 'wellnexus', 'apex-os', '84tea', 'anima119'],

  // Agent Team orchestration
  AGENT_TEAM_SIZE_DEFAULT: 4,
  AGENT_TEAM_TIMEOUT_MS: 2 * 60 * 60 * 1000, // 2 hours for team missions

  // Complexity classification keywords
  COMPLEXITY: {
    COMPLEX_KEYWORDS: ['refactor', 'redesign', 'migrate', 'rewrite', 'overhaul', 'architecture', 'cross-module', 'full-stack', 'multi-project', 'monorepo', 'security audit', 'tech debt', 'performance audit'],
    MEDIUM_KEYWORDS: ['feature', 'implement', 'security', 'audit', 'multi-file', 'integration', 'api', 'database', 'auth', 'testing'],
    // Anything not matching COMPLEX or MEDIUM is SIMPLE
  },

  // Agent Team subagent roles for parallel execution
  AGENT_TEAM_ROLES: {
    security_scan: ['code-reviewer', 'tester', 'debugger', 'fullstack-developer'],
    tech_debt: ['code-reviewer', 'tester', 'fullstack-developer', 'researcher'],
    perf_audit: ['code-reviewer', 'tester', 'debugger', 'fullstack-developer'],
    default: ['code-reviewer', 'tester', 'debugger', 'fullstack-developer'],
  },

  // Rule: Match ClaudeKit /commands to situation — NOT blind /cook
  // complexity: 'simple' | 'medium' | 'complex' — determines prompt format
  BINH_PHAP_TASKS: [
    { id: 'console_cleanup', complexity: 'simple', cmd: 'Clean all console.log and debug statements from production code' },
    { id: 'type_safety', complexity: 'medium', cmd: 'Audit TypeScript any types — report all locations needing proper type annotations, fix them' },
    { id: 'a11y_audit', complexity: 'medium', cmd: 'WCAG 2.1 AA accessibility audit — report and fix alt text, ARIA labels, semantic HTML issues' },
    { id: 'security_scan', complexity: 'complex', cmd: 'Security audit — check CSP headers, XSS vectors, exposed secrets, CORS config. Fix all issues found' },
    { id: 'perf_audit', complexity: 'complex', cmd: 'Performance audit — bundle size, lazy loading, image optimization, Core Web Vitals improvements' },
    { id: 'test_suite', complexity: 'medium', cmd: 'Run full test suite, report failures and coverage gaps, fix failing tests' },
    { id: 'debug_errors', complexity: 'simple', cmd: 'Investigate any runtime errors, unhandled rejections, or console warnings in production' },
    { id: 'i18n_sync', complexity: 'medium', cmd: 'Sync all i18n translation keys — fix missing translations across all locales' },
    { id: 'tech_debt', complexity: 'complex', cmd: 'Full codebase review — TODO/FIXME/HACK count, dead code, circular deps. Fix all tech debt' },
  ],
};
