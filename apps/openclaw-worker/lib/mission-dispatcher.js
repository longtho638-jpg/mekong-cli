/**
 * 🚀 Mission Dispatcher v3 — Agent Team aware prompt building
 *
 * Routes tasks to project directories, builds prompts, and executes
 * missions via brain-process-manager's runMission().
 *
 * v1: Wrote mission to /tmp file → expect brain read it → file IPC polling
 * v2: Calls runMission() directly → Node.js child_process → exit code
 * v3: Complex missions get Agent Team prompts → parallel Task subagents
 */

const path = require('path');
const config = require('../config');

// 🛡️ Safe Logger Import
let log = console.log;
try {
  const bpm = require('./brain-process-manager');
  if (bpm.log) log = bpm.log;
} catch (e) {
  console.error(`WARN: brain-process-manager not found (${e.message}). Using console.log.`);
}

// 🛡️ Fallback: Try brain-process-manager
let runMission;
try {
  const bpm = require('./brain-process-manager');
  runMission = bpm.runMission;
} catch (e) {
  log(`CRITICAL: brain-process-manager not found!`);
  runMission = async () => ({ success: false, result: 'no_brain_module', elapsed: 0 });
}

// 🛡️ Safe Module Imports
let isTeamMission = () => false;
let buildAgentTeamBlock = () => '';
let buildDecomposedPrompt = () => '';
let detectIntent = () => 'COOK';

try {
  const mcc = require('./mission-complexity-classifier');
  isTeamMission = mcc.isTeamMission || isTeamMission;
  buildAgentTeamBlock = mcc.buildAgentTeamBlock || buildAgentTeamBlock;
  buildDecomposedPrompt = mcc.buildDecomposedPrompt || buildDecomposedPrompt;
  detectIntent = mcc.detectIntent || detectIntent;
} catch (e) {
  log(`WARN: mission-complexity-classifier not found: ${e.message}`);
}

let getTopLessons = () => '';
try {
  const pmr = require('./post-mortem-reflector');
  getTopLessons = pmr.getTopLessons || getTopLessons;
} catch (e) {
  log(`WARN: post-mortem-reflector not found: ${e.message}`);
}

const VI_PREFIX = 'Trả lời bằng TIẾNG VIỆT. ';
const FILE_LIMIT = 'Chỉ sửa TỐI ĐA 5 file mỗi mission. Nếu cần sửa nhiều hơn, báo cáo danh sách còn lại.';

// 🧬 BRAIN SURGERY: Cache memory.md reads (TTL 60s)
let _memoryCacheContent = '';
let _memoryCacheTs = 0;
const MEMORY_CACHE_TTL = 60000; // 60 seconds

// Project routing: detect project from task content keywords
function detectProjectDir(taskContent) {
  const lower = taskContent.toLowerCase();
  const routes = {
    'doanh-trai': 'doanh-trai-tom-hum',
    'lobster': 'doanh-trai-tom-hum',
    'tom-hum': 'doanh-trai-tom-hum',
    'raas': 'doanh-trai-tom-hum',
    'com-anh-duong': 'apps/com-anh-duong-10x',
    '84tea': 'apps/84tea',
    'algo-trader': 'apps/algo-trader',
    'algo': 'apps/algo-trader',
    apex: 'apps/apex-os',
    anima: 'apps/anima119',
    sophia: 'apps/sophia-ai-factory',
    well: 'apps/well',
    agency: 'apps/agencyos-web',
    'sa-dec': 'apps/sa-dec-flower-hunt',
    'flower': 'apps/sa-dec-flower-hunt',
    // 🧬 BRAIN SURGERY v30: Added missing keywords for mekong-cli root routing
    'openclaw-worker': '.',  // openclaw-worker files = root monorepo
    'openclaw': '.',          // openclaw = root monorepo
    'task-watcher': '.',      // task-watcher = root
    'brain-process': '.',     // brain-process-manager = root
    'auto-cto': '.',          // auto-cto-pilot = root
    'mekong-cli': '.',        // explicit mekong-cli mention
    mekong: '.',
  };
  for (const [keyword, dir] of Object.entries(routes)) {
    // 🧬 BRAIN SURGERY v30: Fix short-keyword matching
    // Only exact-match for very short (≤3 chars) to avoid false positives like "well" in "wellness"
    // All others use includes() to match substrings
    if (keyword.length <= 3 && lower === keyword) return path.join(config.MEKONG_DIR, dir);
    if (keyword.length > 3 && lower.includes(keyword)) return path.join(config.MEKONG_DIR, dir);
  }
  // 🦞 DEFAULT: mekong-cli root (FOCUS MODE 2026-02-23: ONLY mekong-cli)
  return config.MEKONG_DIR;
}

/**
 * Check if raw task text is complex based on config keywords.
 * @param {string} text - Sanitized task text (lowercase)
 * @returns {boolean}
 */
function isComplexRawMission(text) {
  return config.COMPLEXITY.COMPLEX_KEYWORDS.some(kw => text.includes(kw));
}

/**
 * Detect if task should be split into multiple /cook commands.
 * Heuristic: >100 chars AND has separators ("; ", " và ", " and ", multiple sentences)
 * @param {string} text - Sanitized task text
 * @returns {boolean}
 */
function shouldChainCooks(text) {
  if (text.length < 100) return false;
  const hasMultipleSentences = (text.match(/\.\s+[A-Z]/g) || []).length > 1;
  const hasSeparators = /;\s+|và\s+|and\s+/i.test(text);
  return hasMultipleSentences || hasSeparators;
}

/**
 * Split task into multiple subtasks based on separators.
 * @param {string} text - Task text
 * @returns {string[]} - Array of subtasks
 */
function splitTaskIntoSubtasks(text) {
  // Try splitting by: "; ", " và ", " and ", ". " (sentences)
  let subtasks = text.split(/;\s+|và\s+|and\s+|\.\s+(?=[A-Z])/i);

  // Filter out empty/short subtasks
  subtasks = subtasks.filter(s => s.trim().length > 10);

  // If split resulted in too many (>5), merge back to max 3-4 subtasks
  if (subtasks.length > 5) {
    const chunk1 = subtasks.slice(0, 2).join('; ');
    const chunk2 = subtasks.slice(2, 4).join('; ');
    const chunk3 = subtasks.slice(4).join('; ');
    subtasks = [chunk1, chunk2, chunk3].filter(s => s.length > 0);
  }

  return subtasks;
}

/**
 * Build prompt from raw task content.
 * Rule 13: Command Obsession + Hàn Băng Quyết v4 Adaptive Scaling + Multi-Cook Chaining
 */
function buildPrompt(taskContent) {
  let clean = taskContent.replace(/\\!/g, '!').replace(/\\"/g, '"').trim();
  clean = clean.replace(/^[a-z0-9_-]+:\s*/i, '');
  const safe = clean.replace(/[()$`\\!]/g, ' ').replace(/\s+/g, ' ').trim();

  // 🦞 FIX 2026-02-23: LEAN PROMPT — Stop dumping 1500+ chars overhead into every prompt.
  // MEMORY/GOTCHAS/lessons are already in customInstructions (config.json), loaded once per session.
  // Prompt should only contain: command + task content + file limit.
  const mandatePrefix = 'Trả lời bằng TIẾNG VIỆT. ';
  const FILE_LIMIT = 'Chỉ sửa TỐI ĐA 5 file mỗi mission. Nếu cần sửa nhiều hơn, báo cáo danh sách còn lại.';
  const VI_PREFIX = '';

  // Routing variables (kept lean — no prompt injection, just for command selection)
  let load = 0;
  try { const os = require('os'); load = os.loadavg()[0]; } catch (e) { load = 0; }
  const isHanBangMode = load > 30;

  // Helper to construct ClaudeKit command properly
  // Output format: /command "mandatePrefix \n\n VI_PREFIX parsedText FILE_LIMIT" flags
  const formatCmd = (cmd, text, flags = '') => {
    const escapedText = text.replace(/"/g, '\\"').trim();
    const payload = escapedText ? `\n\n${VI_PREFIX}${escapedText} ${FILE_LIMIT}` : '';
    // Fix string builder so mandatePrefix and payload are strictly inside the double quotes
    return `${cmd} "${mandatePrefix.trim()}${payload}" ${flags}`.trim();
  };

  // 🔒 Chairman Fix v5: Support explicit user commands (e.g. `/plan:hard "task" --auto`)
  let parsedCmd = null;
  let parsedText = safe;
  let parsedFlags = '';

  const cmdMatch = safe.match(/^(\/[a-z0-9:-]+)(?:\s+"([^"]+)")?(?:\s+(.*))?$/i);
  if (cmdMatch) {
    parsedCmd = cmdMatch[1];
    if (cmdMatch[2]) {
      parsedText = cmdMatch[2];
      parsedFlags = cmdMatch[3] || '';
    } else {
      // It might be `/cook task without quotes --flags`
      const rest = safe.substring(parsedCmd.length).trim();
      const flagIdx = rest.indexOf('--');
      if (flagIdx >= 0) {
        parsedText = rest.substring(0, flagIdx).trim();
        parsedFlags = rest.substring(flagIdx).trim();
      } else {
        parsedText = rest;
      }
    }
  } else if (safe.startsWith('/')) {
    const spaceIdx = safe.indexOf(' ');
    if (spaceIdx > 0) {
      parsedCmd = safe.substring(0, spaceIdx);
      parsedText = safe.substring(spaceIdx + 1);
    } else {
      parsedCmd = safe;
      parsedText = '';
    }
  }

  // If user provided an explicit command, respect it
  if (parsedCmd) {
    return formatCmd(parsedCmd, parsedText, parsedFlags);
  }

  // 🤖 NEW INTENTS (CI, BOOTSTRAP, TEST) - Added 2026-02-18
  const lowerSafe = safe.toLowerCase();

  // 1. CI Intent
  if (lowerSafe.includes('ci/cd') || lowerSafe.includes('pipeline') || lowerSafe.includes('build fail')) {
    return formatCmd('/plan:ci', safe);
  }

  // 2. BOOTSTRAP Intent
  if (lowerSafe.includes('new project') || lowerSafe.includes('bootstrap') || lowerSafe.includes('khoi tao')) {
    return formatCmd('/bootstrap', safe, isHanBangMode ? '--auto' : '--parallel --auto');
  }

  // 3. TEST Intent
  if (lowerSafe.includes('test') || lowerSafe.includes('kiem thu')) {
    return formatCmd('/test', safe);
  }

  const intent = detectIntent(safe);

  // MULTI_FIX: parallel bug fixing (2+ bug/error keywords detected)
  if (intent === 'MULTI_FIX') return formatCmd('/cook', safe + (isHanBangMode ? ' [HÀN BĂNG MODE: Minimal agents]' : ' PHẢI dùng đa luồng 10+ subagents.'), isHanBangMode ? '--auto' : '--parallel --auto');

  // STRATEGIC: large-scale architecture/redesign → deep parallel planning
  if (intent === 'STRATEGIC') return formatCmd(isHanBangMode ? '/plan:hard' : '/plan:parallel', safe + (isHanBangMode ? ' [HÀN BĂNG MODE: Downgraded to /plan:hard]' : ''));

  if (isComplexRawMission(lowerSafe)) {
    const decomposed = buildDecomposedPrompt(safe, 'default');

    // If exceptionally hot, downgrade command but preserve Binh Phap decomposed context
    if (isHanBangMode) {
      log(`⚠️ THERMAL CRITICAL (Load ${load}): Downgrading complex mission to /plan:hard to preserve Binh Phap strategy while reducing concurrency`);
      return formatCmd('/plan:hard', safe + '\n\n[HÀN BĂNG MODE: Tạm thời dùng /plan:hard thay vì /plan:parallel do CPU load > 30, tuy nhiên vẫn giữ nguyên chiến lược Binh Pháp]\n\n' + decomposed);
    }

    if (intent === 'FIX') return formatCmd('/debug', safe, '--parallel');
    if (intent === 'PLAN' || intent === 'RESEARCH') return formatCmd('/plan:hard', safe);
    if (intent === 'REVIEW') return formatCmd('/review', safe, '--parallel');

    return formatCmd('/plan:parallel', safe + '\n\n' + decomposed);
  }

  if (intent === 'FIX') return formatCmd('/debug', safe, isHanBangMode ? '' : '--parallel');
  if (intent === 'REVIEW') return formatCmd('/review', safe, isHanBangMode ? '' : '--parallel');

  // 🦞 FIX 2026-02-23: PLAN-FIRST — ClaudeKit workflow: /plan:hard → 100x DEEP PIPELINE auto-chains /cook
  return formatCmd('/plan:hard', safe + (isHanBangMode ? ' [HÀN BĂNG MODE: Minimal agents]' : ''), isHanBangMode ? '' : '--parallel');
}

const { preemptiveCool } = require('./m1-cooling-daemon');

// Task 8: Safety Guard integration
let checkSafety = async () => ({ status: 'SAFE', reason: 'no_guard' });
try {
  const sg = require('./safety-guard');
  checkSafety = sg.checkSafety;
} catch (e) { log(`WARN: safety-guard not found: ${e.message}`); }

// Task 11: Strategy Optimizer integration
let optimizeStrategy = async (p) => p;
let classifyError = () => ({ errorType: 'unknown', recoverable: false });
try {
  const so = require('./strategy-optimizer');
  optimizeStrategy = so.optimizeStrategy;
  classifyError = so.classifyError;
} catch (e) { log(`WARN: strategy-optimizer not found: ${e.message}`); }

/**
 * Full dispatch flow: safety check → detect project → build prompt → run via brain
 * Task 8: Pre-dispatch safety gate
 * Task 12: Retry-with-hints loop (max 2 retries)
 *
 * @param {string} taskContent - Raw task file content
 * @param {string} taskFile - Task filename (for logging)
 * @param {number} [timeoutMs] - Override timeout from classifier (optional)
 * @returns {Promise<{success: boolean, result: string, elapsed: number}>}
 */
async function executeTask(taskContent, taskFile, timeoutMs, complexity) {
  // ═══ Task 8: Safety Gate ═══
  const safety = await checkSafety(taskContent);
  if (safety.status === 'UNSAFE') {
    log(`🚫 BLOCKED BY SAFETY: ${taskFile} — ${safety.reason}`);
    return { success: false, result: 'unsafe_blocked', elapsed: 0 };
  }
  if (safety.status === 'NEEDS_CONFIRMATION') {
    log(`⚠️ SAFETY CAUTION: ${taskFile} — ${safety.reason} (proceeding in CTO auto mode)`);
  }

  const projectDir = detectProjectDir(taskContent);
  const prompt = buildPrompt(taskContent);
  const finalTimeout = timeoutMs || (isTeamMission(prompt) ? config.AGENT_TEAM_TIMEOUT_MS : config.MISSION_TIMEOUT_MS);
  const mode = isTeamMission(prompt) ? 'AGENT_TEAM' : 'SINGLE';

  // 10x Predictive Cooling: Pre-purge for complex missions
  await preemptiveCool(complexity);

  // 虛實 Model Routing: Opus only for complex, qwen3 for rest
  let modelOverride = null;
  if (complexity === 'complex') {
    modelOverride = config.OPUS_MODEL;
    log(`🔥 OPUS ACTIVATED: ${modelOverride} — Complex mission requires Ultra power`);
  }

  log(`PROMPT [${mode}]: ${prompt.slice(0, 150)}... [timeout=${Math.round(finalTimeout / 60000)}min] [model=${modelOverride || config.MODEL_NAME}]`);

  // ═══ Task 12: Retry-with-hints loop ═══
  let currentPrompt = prompt;
  const MAX_RETRIES = 2;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const result = await runMission(currentPrompt, projectDir, finalTimeout, modelOverride);

    if (result.success || result.result === 'success') {
      if (modelOverride) {
        log(`🔥→🌲 Opus mission done — switching back to ${config.MODEL_NAME}`);
      }

      // 🦞 FIX 2026-02-23: DISABLED 100x DEEP PIPELINE auto-chain
      // ClaudeKit workflow: /plan:hard → REVIEW plan → /cook <plan_dir>
      // CTO must NOT auto-cook immediately. Let Auto-CTO discover plan.md in next scan cycle.
      if (/^\/(plan:|bootstrap)/.test(currentPrompt)) {
        log(`[PLAN-FIRST] Planning complete. Plan saved. Waiting for review before /cook.`);
        try {
          const execSync = require('child_process').execSync;
          const lsCmdPlans = `ls -t "${projectDir}/plans"/*/plan.md 2>/dev/null | head -n 1`;
          let latestPlan = '';
          try { latestPlan = execSync(lsCmdPlans, { encoding: 'utf8' }).trim(); } catch (e) { }
          if (latestPlan) {
            log(`[PLAN-FIRST] Plan at: ${latestPlan} — next Auto-CTO cycle will review and /cook.`);
          }
        } catch (e) { }
      }
      // ══════════════════════════════════════════════════════════════

      return result;
    }

    // Don't retry on certain result types. If busy, bubble up immediately so queue can sleep/retry.
    if (['all_workers_busy', 'busy_blocked', 'mission_locked', 'unsafe_blocked', 'brain_died', 'brain_died_fatal', 'no_brain_module', 'max_retries_exhausted', 'duplicate_rejected'].includes(result.result)) {
      return result;
    }

    // Check if error is recoverable
    const errorInfo = classifyError(result.result || '');
    if (!errorInfo.recoverable) {
      log(`TERMINAL ERROR: ${taskFile} — ${errorInfo.errorType} (not recoverable)`);
      return result;
    }

    // Generate hints for retry
    if (attempt < MAX_RETRIES) {
      log(`🔄 RETRY ${attempt + 1}/${MAX_RETRIES}: ${taskFile} — generating correction hints`);
      currentPrompt = await optimizeStrategy(prompt, result.result || '', attempt + 1);
    }
  }

  // All retries exhausted
  return { success: false, result: 'max_retries_exhausted', elapsed: 0 };
}

module.exports = { executeTask, buildPrompt, detectProjectDir };

