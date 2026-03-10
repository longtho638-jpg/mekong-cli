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

const fs = require('fs');
const path = require('path');
const config = require('../config');

const { isProAvailable } = require('./system-status-registry');

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

// 🐉 105-Hands Specialist Registry — Safe import
let matchRole = null;
try {
  const handsRegistry = require('./hands-registry');
  matchRole = handsRegistry.matchRole;
} catch (e) {
  log(`WARN: hands-registry not found: ${e.message}`);
}

let getTopLessons = () => '';
try {
  const pmr = require('./post-mortem-reflector');
  getTopLessons = pmr.getTopLessons || getTopLessons;
} catch (e) {
  log(`WARN: post-mortem-reflector not found: ${e.message}`);
}

// 🧬 LEARNING LOOP: Dispatch hints from learning-engine
let getDispatchHints = () => ({ timeoutMultiplier: 1.0, shouldSkip: false, preferredIntent: null, reason: 'no_learning_engine' });
try {
  const le = require('./learning-engine');
  getDispatchHints = le.getDispatchHints || getDispatchHints;
} catch (e) {
  log(`WARN: learning-engine not found: ${e.message}`);
}

// 🧬 LEARNING LOOP: Project health scores
let getProjectHealthScore = () => ({ score: 50 });
try {
  const le = require('./learning-engine');
  getProjectHealthScore = le.getProjectHealthScore || getProjectHealthScore;
} catch (e) { }

/**
 * Classify mission priority: P0 (critical), P1 (important), P2 (routine).
 * Based on: task complexity, project importance, keywords.
 * @param {string} taskContent - Raw task content
 * @param {string} complexity - 'simple'|'complex' from classifier
 * @returns {{ priority: string, reason: string }}
 */
function classifyPriority(taskContent, complexity = 'simple') {
  const lower = taskContent.toLowerCase();

  // P0: AGI/openclaw, security fixes, production down
  if (/\bagi\b|openclaw-worker|production down|security|critical/i.test(taskContent)) {
    return { priority: 'P0', reason: 'AGI/security/critical keyword' };
  }

  // P0: Explicit deep 10x or urgent
  if (lower.includes('deep 10x') || lower.includes('urgent') || lower.includes('hotfix')) {
    return { priority: 'P0', reason: 'Urgent/deep task' };
  }

  // P1: Complex tasks, multi-file, architecture
  if (complexity === 'complex' || lower.includes('refactor') || lower.includes('architecture')) {
    return { priority: 'P1', reason: 'Complex task' };
  }

  // P2: Routine maintenance
  return { priority: 'P2', reason: 'Routine' };
}

// Project routing: detect project from task content keywords
function detectProjectDir(taskContent, taskFile = '') {
  const lowerContent = taskContent.toLowerCase();
  const lowerFile = (taskFile || '').toLowerCase();

  const routes = {
    'well': 'apps/well',
    'com-anh-duong': 'apps/com-anh-duong-10x',
    'doanh-trai': 'doanh-trai-tom-hum',
    '84tea': 'apps/84tea',
    'algo-trader': 'apps/algo-trader',
    'apex-os': 'apps/apex-os',
    'anima119': 'apps/anima119',
    'sophia-ai-factory': 'apps/sophia-ai-factory',
    'agencyos-web': 'apps/agencyos-web',
    'sa-dec-flower-hunt': 'apps/sa-dec-flower-hunt',
    'openclaw-worker': '.',
    'mekong-cli': '.',
  };

  // 1. PRIORITIZE FILENAME: If mission name has a project key, stick to it!
  for (const [key, dir] of Object.entries(routes)) {
    if (lowerFile.includes(key)) {
      const target = path.join(config.MEKONG_DIR, dir);
      if (fs.existsSync(target)) {
        log(`[ROUTING] Filename match: ${key} -> ${target}`);
        return target;
      }
    }
  }

  // 2. FALLBACK TO CONTENT (Only if filename is generic)
  for (const [keyword, dir] of Object.entries(routes)) {
    const target = path.join(config.MEKONG_DIR, dir);
    // FIX: Short keywords (<=3 chars) need exact match to avoid false positives
    if (keyword.length <= 3 && lowerContent === keyword) {
      if (fs.existsSync(target)) {
        log(`[ROUTING] Content exact match: ${keyword} -> ${target}`);
        return target;
      }
    }
    // Longer keywords use substring match
    if (keyword.length > 3 && lowerContent.includes(keyword)) {
      if (fs.existsSync(target)) {
        log(`[ROUTING] Content keyword match: ${keyword} -> ${target}`);
        return target;
      }
    }
  }

  // 3. IRON FOCUS VALIDATION: If config.PROJECTS is set, don't wander off!
  if (config.PROJECTS && config.PROJECTS.length > 0) {
    const defaultProj = config.PROJECTS[0];
    // FIX: Use correct routes lookup - defaultProj may not exist in routes
    const routePath = routes[defaultProj];
    const target = routePath
      ? path.join(config.MEKONG_DIR, routePath === '.' ? '' : routePath)
      : path.join(config.MEKONG_DIR, `apps/${defaultProj}`);
    if (fs.existsSync(target)) {
      log(`[ROUTING] Iron Focus fallback: ${defaultProj} -> ${target}`);
      return target;
    }
  }

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
// --- Prompt Sanitization (v2026.2.27: Lean Stealth) ---

function stripPollution(content) {
  let clean = content;
  // 1. Strip WORKFLOW ORCHESTRATION block
  clean = clean.replace(/WORKFLOW ORCHESTRATION \(MANDATORY\):[\s\S]*?CORE PRINCIPLES:[\s\S]*?Avoid introducing bugs\./gi, '');
  // 2. Strip GOOGLE ULTRA INTEL block
  clean = clean.replace(/GOOGLE ULTRA INTEL \(searched Drive\/Gmail\/Calendar\):[\s\S]*?━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━/gi, '');
  // 3. Strip extra separators
  clean = clean.replace(/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━/g, '');
  return clean.replace(/\n{3,}/g, '\n\n').trim();
}

function findLatestPlan(projectDir) {
  if (!projectDir || projectDir === config.MEKONG_DIR) return null;
  const plansDir = path.join(projectDir, 'plans');
  if (!fs.existsSync(plansDir)) return null;

  try {
    const { execSync } = require('child_process');
    // Find latest plan.md in subdirectories of /plans
    const findCmd = `ls -t "${plansDir}"/*/plan.md 2>/dev/null | head -n 1`;
    const planPath = execSync(findCmd, { encoding: 'utf8' }).trim();
    return planPath || null;
  } catch (e) {
    return null;
  }
}

function buildPrompt(taskContent, projectDir = null) {
  let clean = taskContent.replace(/\\!/g, '!').replace(/\\"/g, '"').trim();
  clean = clean.replace(/^[a-z0-9_-]+:\s*/i, '');

  // 🦞 STRIP POLLUTION: Save tokens by removing verbose mandates
  const leanContent = stripPollution(clean);

  const safe = leanContent.replace(/[()$`\\!]/g, ' ').replace(/\s+/g, ' ').trim();
  const lowerSafe = safe.toLowerCase();
  const isDeepTask = lowerSafe.includes('deep 10x') || lowerSafe.includes('deep scan') || lowerSafe.includes('ánh xạ');

  // 🧬 CLAUDEKIT DNA v2026.2.27: Aggressive Agental Execution (Rule 13)
  const isPro = isProAvailable();

  // 🛡️ CHAIRMAN MANDATE: Pro is for THINKING (PLAN) only.
  const STRATEGIC_STOP = 'CHỈ RESEARCH VÀ LẬP PLAN (plan.md). TUYỆT ĐỐI KHÔNG FIX/COOK. Xong plan hãy dừng lại. ';
  const mandatePrefix = `Trả lời bằng TIẾNG VIỆT. WORKFLOW: THINK DEEP -> PLAN FIRST. ${STRATEGIC_STOP}`;
  const FILE_LIMIT = 'Sửa < 5 file mỗi mission.';
  const VI_PREFIX = '';

  // Routing variables (kept lean — no prompt injection, just for command selection)
  let load = 0;
  try { const os = require('os'); load = os.loadavg()[0]; } catch (e) { load = 0; }
  const isHanBangMode = load > 30;

  // Helper to construct ClaudeKit command properly
  const formatCmd = (cmd, text, flags = '') => {
    const escapedText = text.replace(/"/g, '\\"').trim();
    const isPlanCmd = cmd.startsWith('/plan') || cmd === '/bootstrap';

    // Minimal mandate for cooking to reduce noise
    const finalMandate = isPlanCmd ? mandatePrefix : 'Trả lời TIẾNG VIỆT. Ưu tiên /cook và kiểm tra kỹ. ';

    const payload = escapedText ? `\n\n${escapedText} ${FILE_LIMIT}` : '';
    return `${cmd} "${finalMandate.trim()}${payload}" ${flags}`.trim();
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

  if (isDeepTask && (parsedCmd === '/cook' || !parsedCmd) && isPro) {
    log(`🛡️ [HYBRID BRAIN] Deep Task detected — Forcing /plan:hard (Pro) for thinking phase.`);
    return formatCmd('/plan:hard', parsedText, parsedFlags);
  }

  // 🦞 PLAN INFILTRATION: Auto-link latest plan.md for /cook
  if ((parsedCmd === '/cook' || parsedCmd === '/plan:fast') && projectDir && projectDir !== config.MEKONG_DIR) {
    const planPath = findLatestPlan(projectDir);
    if (planPath && !parsedText.includes('plan.md')) {
      log(`🎯 [PLAN INFILTRATION] Linking plan context: ${path.basename(path.dirname(planPath))}/plan.md`);
      const planRelPath = `./plans/${path.basename(path.dirname(planPath))}/plan.md`;
      return formatCmd(parsedCmd, `Using plan from ${planRelPath}: ${parsedText}`, parsedFlags);
    }
  }

  // If user provided an explicit command, respect it (unless it was a forced deep /cook)
  if (parsedCmd) {
    return formatCmd(parsedCmd, parsedText, parsedFlags);
  }

  const intent = detectIntent(safe);
  const routingLog = (msg) => log(`[HYBRID ROUTING] ${isPro ? '' : '⚠️ FALLBACK: '}${msg}`);

  // 🐉 105-HANDS ROLE INJECTION: Gắn context chuyên gia vào task (chỉ khi không có explicit command)
  let roleInjectedText = safe;
  if (matchRole) {
    try {
      const { role, score, fallback } = matchRole(safe, intent);
      if (!fallback && role && role.systemPrompt) {
        log(`🐉 [HANDS MATCH] ${role.displayName} (score:${score})`);
        // Prepend role context vào task text để CC CLI hiểu ngữ cảnh chuyên gia
        roleInjectedText = `[ROLE: ${role.displayName}] ${role.systemPrompt} | Nhiệm vụ: ${safe}`;
      }
    } catch (e) {
      // Không để lỗi hands-registry phá vỡ routing chính
      log(`WARN: hands matchRole error: ${e.message}`);
    }
  }

  // 1. CI Intent
  if (lowerSafe.includes('ci/cd') || lowerSafe.includes('pipeline') || lowerSafe.includes('build fail')) {
    routingLog(`CI/CD detected -> Routing to ${isPro ? 'Claude Pro (/plan:ci)' : '9Router API (/plan:ci)'}`);
    return formatCmd('/plan:ci', roleInjectedText);
  }

  // 2. BOOTSTRAP Intent
  if (lowerSafe.includes('new project') || lowerSafe.includes('bootstrap') || lowerSafe.includes('khoi tao')) {
    routingLog(`Bootstrap detected -> Routing to ${isPro ? 'Claude Pro (/bootstrap)' : '9Router API (/bootstrap)'}`);
    return formatCmd('/bootstrap', roleInjectedText, isHanBangMode ? '--auto' : '--parallel --auto');
  }

  // 3. TEST Intent
  if (lowerSafe.includes('test') || lowerSafe.includes('kiem thu')) {
    routingLog(`Testing task detected -> Routing to 9Router(/test)`);
    return formatCmd('/test', roleInjectedText);
  }

  // MULTI_FIX: parallel bug fixing (2+ bug/error keywords detected)
  if (intent === 'MULTI_FIX') {
    routingLog(`Multi - bug detected -> Routing to 9Router(/cook --parallel)`);
    return formatCmd('/cook', roleInjectedText + (isHanBangMode ? ' [HÀN BĂNG MODE: Minimal agents]' : ' PHẢI dùng đa luồng 10+ subagents.'), isHanBangMode ? '--auto' : '--parallel --auto');
  }

  // STRATEGIC: large-scale architecture/redesign → deep parallel planning
  if (intent === 'STRATEGIC') {
    routingLog(`Strategic mission detected -> Routing to ${isPro ? 'Claude Pro' : '9Router API'} (${isHanBangMode ? '/plan:hard' : '/plan:parallel'})`);
    return formatCmd(isHanBangMode ? '/plan:hard' : '/plan:parallel', roleInjectedText + (isHanBangMode ? ' [HÀN BĂNG MODE: Downgraded to /plan:hard]' : ''));
  }

  if (isComplexRawMission(lowerSafe)) {
    const decomposed = buildDecomposedPrompt(safe, 'default');

    routingLog(`Complex raw mission detected -> Routing to Claude Pro for strategic planning`);

    if (intent === 'FIX') return formatCmd('/debug', roleInjectedText, '--parallel');
    if (intent === 'PLAN' || intent === 'RESEARCH') return formatCmd('/plan:hard', roleInjectedText);
    if (intent === 'REVIEW') return formatCmd('/review', roleInjectedText, '--parallel');

    return formatCmd('/plan:parallel', roleInjectedText + '\n\n' + decomposed);
  }

  if (intent === 'FIX') {
    routingLog(`Fix intent detected -> Routing to 9Router(/debug)`);
    return formatCmd('/debug', roleInjectedText, isHanBangMode ? '' : '--parallel');
  }

  if (intent === 'REVIEW') {
    routingLog(`Review intent detected -> Routing to 9Router(/review)`);
    return formatCmd('/review', roleInjectedText, isHanBangMode ? '' : '--parallel');
  }

  // 🦞 FIX 2026-02-23: PLAN-FIRST — ClaudeKit workflow: /plan:hard → 100x DEEP PIPELINE auto-chains /cook
  routingLog(`Default Planning fallback -> Routing to ${isPro ? 'Claude Pro (/plan:hard)' : '9Router API (/plan:hard)'}`);
  return formatCmd('/plan:hard', roleInjectedText + (isHanBangMode ? ' [HÀN BĂNG MODE: Minimal agents]' : ''), isHanBangMode ? '' : '--parallel');
}

const { preemptiveCool } = require('./m1-cooling-daemon');

// Task 8: Safety Guard integration
let checkSafety = async () => ({ status: 'SAFE', reason: 'no_guard' });
try {
  const sg = require('./safety-guard');
  checkSafety = sg.checkSafety;
} catch (e) { log(`WARN: safety - guard not found: ${e.message} `); }

// Task 11: Strategy Optimizer integration
let optimizeStrategy = async (p) => p;
let classifyError = () => ({ errorType: 'unknown', recoverable: false });
try {
  const so = require('./strategy-optimizer');
  optimizeStrategy = so.optimizeStrategy;
  classifyError = so.classifyError;
} catch (e) { log(`WARN: strategy - optimizer not found: ${e.message} `); }

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
    log(`🚫 BLOCKED BY SAFETY: ${taskFile} — ${safety.reason} `);
    return { success: false, result: 'unsafe_blocked', elapsed: 0 };
  }
  if (safety.status === 'NEEDS_CONFIRMATION') {
    log(`⚠️ SAFETY CAUTION: ${taskFile} — ${safety.reason} (proceeding in CTO auto mode)`);
  }

  // 🧬 PRIORITY CLASSIFICATION: P0/P1/P2
  const { priority, reason: priorityReason } = classifyPriority(taskContent, complexity);
  log(`📊 PRIORITY: ${priority} — ${priorityReason} [${taskFile}]`);

  // 🧬 LEARNING LOOP: Check dispatch hints before executing
  const hints = getDispatchHints(taskContent);
  if (hints.shouldSkip) {
    log(`🧠 LEARNING SKIP: ${taskFile} — ${hints.reason}`);
    return { success: false, result: 'learning_skip', elapsed: 0 };
  }
  if (hints.reason !== 'No learned pattern' && hints.reason !== 'no_learning_engine') {
    log(`🧠 LEARNING HINT: ${hints.reason} [timeout×${hints.timeoutMultiplier}]`);
  }

  // 🧬 PROJECT HEALTH: Log project health score
  const projectDir = detectProjectDir(taskContent, taskFile);
  const projectName = path.basename(projectDir);
  const health = getProjectHealthScore(projectName);
  if (health.totalMissions > 0) {
    log(`🏥 PROJECT HEALTH: ${projectName} — score:${health.score}/100 success:${health.successRate}% (${health.totalMissions} missions)`);
  }
  const lowerContent = taskContent.toLowerCase();

  // 🦞 HYBRID BRAIN: Force PLAN intent for Deep 10x tasks to hit Claude Pro
  // UNLESS Pro is hit, then let it stay in default intent for 9Router fallback
  let intent = detectIntent(taskContent);
  const isPro = isProAvailable();

  if ((lowerContent.includes('deep 10x') || lowerContent.includes('deep scan') || lowerContent.includes('ánh xạ')) && isPro) {
    intent = 'PLAN';
  }
  // 🦞 PROJECT ROUTING: AGI/openclaw tasks → P0 (PRO intent)
  if (/\bagi\b|openclaw-worker|mekong-cli/i.test(taskContent) && isPro) {
    intent = 'PRO';
    log(`[ROUTING] AGI/openclaw task detected → forcing PRO intent (P0)`);
  }

  let prompt = buildPrompt(taskContent, projectDir);

  // 🧬 BRAIN SURGERY: Well-specific strategic mandates (REMOVED - Simplified)

  // 🧬 LEARNING LOOP: Apply timeout multiplier from learned patterns
  const baseTimeout = timeoutMs || (isTeamMission(prompt) ? config.AGENT_TEAM_TIMEOUT_MS : config.MISSION_TIMEOUT_MS);
  const finalTimeout = Math.round(baseTimeout * (hints.timeoutMultiplier || 1.0));
  const mode = isTeamMission(prompt) ? 'AGENT_TEAM' : 'SINGLE';

  // 10x Predictive Cooling: Pre-purge for complex missions
  await preemptiveCool(complexity);

  // 虛實 Model Routing: Opus only for complex, qwen3 for rest
  let modelOverride = null;
  if (complexity === 'complex') {
    modelOverride = config.OPUS_MODEL;
    log(`🔥 OPUS ACTIVATED: ${modelOverride} — Complex mission requires Ultra power`);
  }

  log(`PROMPT[${mode}]: ${prompt.slice(0, 150)}...[timeout = ${Math.round(finalTimeout / 60000)}min][model = ${modelOverride || config.MODEL_NAME}]`);

  // ═══ Task 12: Retry-with-hints loop ═══
  let currentPrompt = prompt;
  const MAX_RETRIES = 2;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const result = await runMission(currentPrompt, projectDir, finalTimeout, modelOverride, complexity, intent);

    if (result.success || result.result === 'success') {
      if (modelOverride) {
        log(`🔥→🌲 Opus mission done — switching back to ${config.MODEL_NAME} `);
      }

      // 🦞 FIX 2026-02-23: DISABLED 100x DEEP PIPELINE auto-chain
      // ClaudeKit workflow: /plan:hard → REVIEW plan → /cook <plan_dir>
      // CTO must NOT auto-cook immediately. Let Auto-CTO discover plan.md in next scan cycle.
      if (/^\/(plan:|bootstrap)/.test(currentPrompt)) {
        log(`[PLAN - FIRST] Planning complete.Plan saved.Waiting for review before / cook.`);
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
    // 🦞 FIX 2026-02-24: failed_to_start + queued_abort bubble up to task-queue.js for delayed re-enqueue
    // DO NOT retry here — instant retry paste-stacks into CC CLI creating "queued messages"
    if (['all_workers_busy', 'busy_blocked', 'mission_locked', 'unsafe_blocked', 'brain_died', 'brain_died_fatal', 'no_brain_module', 'max_retries_exhausted', 'duplicate_rejected', 'queued_abort', 'failed_to_start'].includes(result.result)) {
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

module.exports = { executeTask, buildPrompt, detectProjectDir, classifyPriority, isComplexRawMission, shouldChainCooks, splitTaskIntoSubtasks, stripPollution };

