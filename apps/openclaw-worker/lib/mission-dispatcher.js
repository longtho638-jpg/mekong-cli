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

// Project routing: detect project from task content keywords
function detectProjectDir(taskContent) {
  const lower = taskContent.toLowerCase();
  const routes = {
    '84tea': 'apps/84tea',
    apex: 'apps/apex-os',
    anima: 'apps/anima119',
    sophia: 'apps/sophia-ai-factory',
    well: 'apps/well',
    agency: 'apps/agencyos-web',
    'sa-dec': 'apps/sa-dec-flower-hunt',
    'flower': 'apps/sa-dec-flower-hunt',
    mekong: '.',
  };
  for (const [keyword, dir] of Object.entries(routes)) {
    if (lower.includes(keyword)) return path.join(config.MEKONG_DIR, dir);
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
function buildPrompt(taskContent) {
  let clean = taskContent.replace(/\\!/g, '!').replace(/\\"/g, '"').trim();
  clean = clean.replace(/^[a-z0-9_-]+:\s*/i, '');
  const safe = clean.replace(/[()$`\\!]/g, ' ').replace(/\s+/g, ' ').trim();

  // 🔒 Chairman Fix: REMOVED bypass — ALL prompts MUST go through mandatePrefix for đa luồng
  // OLD BUG: if (safe.includes('/cook')) return safe; ← SKIPPED all multi-thread mandates!

  // 🧠 FIX #1: PERSISTENT MEMORY — Always load memory.md + post-mortem lessons
  const memoryCtx = getTopLessons(10);
  let memoryPrefix = '';

  // Load knowledge/memory.md for long-term patterns
  const memoryFile = path.join(__dirname, '../knowledge/memory.md');
  try {
    if (require('fs').existsSync(memoryFile)) {
      const memoryContent = require('fs').readFileSync(memoryFile, 'utf-8');
      // Extract GOTCHAS section (most critical)
      const gotchasMatch = memoryContent.match(/## GOTCHAS[\s\S]*?(?=##|$)/);
      // Token efficiency: Limit to 2000 chars (was 800)
      const gotchas = gotchasMatch ? gotchasMatch[0].slice(0, 2000) : '';
      memoryPrefix += gotchas ? `📜 MEMORY (GOTCHAS):\n${gotchas}\n\n` : '';
    }
  } catch (e) { /* silent fail — memory is optional */ }

  // Add recent mission lessons
  if (memoryCtx) memoryPrefix += `${memoryCtx}\n\n`;

  const { isOverheating } = require('./m1-cooling-daemon');
  let load = 0;
  try { const os = require('os'); load = os.loadavg()[0]; } catch(e) { load = 0; }
  const overheat = isOverheating();

  // Smart Throttle: If load is high, reduce power to stay alive
  let adaptiveMandate = '';
  if (load > 25 || overheat) {
    adaptiveMandate = 'HÀN BĂNG MODE: Máy rất nóng — Chỉ dùng TỐI ĐA 3 subagents parallel. Ưu tiên giải quyết nhanh, ít file. ';
  } else {
    adaptiveMandate = 'COMMANDER RULE 13: Bạn là Elite Commander. Chỉ huy team subagents một cách ÁM ẢNH (10+ agents nếu cần) để đạt hiệu quả 1000%. ';
  }

  // 🔒 IRON RULE (Chairman Decree 2026-02-17): MỌI prompt PHẢI dùng ClaudeKit command.
  // CẤM gửi raw text. PHẢI có /cook, /plan:hard, /debug, /plan:parallel, /review.
  // Đa luồng (10+ subagents) + Deep 10x thinking = BẮT BUỘC khi không overheat.
  // Deep Reference: knowledge/CLAUDEKIT_DEEP_REFERENCE.md (28 commands, 13 agents, 50+ skills)

  // Calculate complexity for token optimization
  const s = safe.toLowerCase();
  const isBugFix = /\b(debug|fix|error|bug|broken|fail|crash|500|404)\b/i.test(s);
  const isReview = /\b(review|audit|security|scan)\b/i.test(s);
  const isDocs = /\b(document|docs|readme|changelog)\b/i.test(s);
  const isCI = /\b(ci|cd|build.*fail|pipeline|deploy)\b/i.test(s);
  const isCRO = /\b(conver|cro|optimize.*rate|a\/b)\b/i.test(s);
  const isTest = /\b(test|spec|coverage|e2e)\b/i.test(s);
  const isComplex = s.length > 300 || /\b(architect|refactor|migrate|overhaul|redesign|multi)\b/i.test(s);
  const isStrategic = /\b(strateg|portfolio|cross.?project|multi.?project)\b/i.test(s);

  const claudekitRouting = (() => {
    if (isBugFix) return 'USE: /debug "issue" --parallel → /plan:fast "fix" → /cook "apply" --parallel --auto → /test → /check-and-commit. [軍形Ch.4+行軍Ch.9] ';
    if (isReview) return 'USE: /review:codebase --parallel (PARALLEL multi-agent audit). [謀攻Ch.3: 知己知彼] ';
    if (isDocs) return 'USE: /docs:update --parallel (or /docs:init, /docs:summarize). [用間Ch.13: 情報] ';
    if (isCI) return 'USE: /plan:ci → analyze CI failures → /cook "fix" --parallel --auto → /test. [行軍Ch.9: 偵察先行] ';
    if (isCRO) return 'USE: /plan:cro → conversion optimization plan → /cook --parallel --auto. [虛實Ch.6: 避實擊虛] ';
    if (isTest) return 'USE: /test (unit) or /test:ui (E2E/visual). [軍形Ch.4: 先為不可勝] ';
    if (isStrategic) return 'USE: /plan:parallel "task" [5] → multi-researcher deep analysis → phased /cook --parallel --auto. [兵勢Ch.5: 奇正相生] ';
    if (isComplex) return 'USE: /plan:hard "task" → detailed plan with research → /cook "implement as planned" --parallel --auto → /test → /check-and-commit. [謀攻Ch.3: 上兵伐謀] ';
    return 'USE: /cook "task" --parallel --auto. 🔥LỬA mode BẮT BUỘC. [作戰Ch.2: 兵貴勝不貴久] ';
  })();

  // Token Efficiency: Dynamic Context Injection
  let claudekitEnforcement;
  if (!isComplex && !isStrategic && safe.length < 200) {
    // Simple task: Minimal prompt
    claudekitEnforcement = `CLAUDEKIT v2.9.1: ${claudekitRouting}CẤM raw text. PHẢI dùng ClaudeKit commands.`;
  } else {
    // Complex task: Full context
    claudekitEnforcement = `CLAUDEKIT v2.9.1 MANDATORY: ${claudekitRouting}CẤM raw text. PHẢI dùng ClaudeKit commands. Available: /cook /plan:hard /plan:fast /plan:parallel /plan:ci /plan:cro /debug /test /test:ui /review /review:codebase /docs:update /check-and-commit /kanban /watzup /journal /ask. Agents: planner, fullstack-developer, debugger, tester, code-reviewer, researcher (auto-orchestrated). Đa luồng 10+ subagents + deep thinking BẮT BUỘC. `;
  }

  const mandatePrefix = `${memoryPrefix}${adaptiveMandate}${claudekitEnforcement}`;

  // 🔥 NEW: Multi-Cook Chaining for complex tasks (check BEFORE intent detection)
  // Chaining có precedence cao hơn single intent khi có nhiều subtasks rõ ràng
  if (shouldChainCooks(safe) && !overheat && load <= 30) {
    const subtasks = splitTaskIntoSubtasks(safe);
    if (subtasks.length >= 2) {
      log(`🔗 CHAIN COOK DETECTED: Splitting into ${subtasks.length} parallel /cook commands`);
      const cookCommands = subtasks.map((subtask, i) =>
        `/cook "${VI_PREFIX}${subtask.trim()}. ${FILE_LIMIT} PHẢI dùng đa luồng 10+ subagents parallel." --parallel --auto`
      ).join('\n\n');
      return `${mandatePrefix}${cookCommands}`;
    }
  }

  // 🤖 NEW INTENTS (CI, BOOTSTRAP, TEST) - Added 2026-02-18
  // Doc: knowledge/claudekit-brain.md
  const lowerSafe = safe.toLowerCase();

  // 1. CI Intent
  if (lowerSafe.includes('ci/cd') || lowerSafe.includes('pipeline') || lowerSafe.includes('build fail')) {
    return `${mandatePrefix}/plan:ci "${VI_PREFIX}${safe}. ${FILE_LIMIT}"`;
  }

  // 2. BOOTSTRAP Intent
  if (lowerSafe.includes('new project') || lowerSafe.includes('bootstrap') || lowerSafe.includes('khoi tao')) {
    return `${mandatePrefix}/bootstrap:auto:parallel "${VI_PREFIX}${safe}. ${FILE_LIMIT}"`;
  }

  // 3. TEST Intent
  if (lowerSafe.includes('test') || lowerSafe.includes('kiem thu')) {
    // Pass safe text as arg in case /test supports filtering or context
    return `${mandatePrefix}/test "${VI_PREFIX}${safe}"`;
  }

  const intent = detectIntent(safe);

  // MULTI_FIX: parallel bug fixing (2+ bug/error keywords detected)
  if (intent === 'MULTI_FIX') return `${mandatePrefix}/cook "${VI_PREFIX}${safe}. ${FILE_LIMIT} PHẢI dùng đa luồng 10+ subagents." --parallel --auto`;

  // STRATEGIC: large-scale architecture/redesign → deep parallel planning
  if (intent === 'STRATEGIC') return `${mandatePrefix}/plan:parallel "${VI_PREFIX}${safe}. ${FILE_LIMIT}"`;

  if (isComplexRawMission(safe.toLowerCase())) {
    // If exceptionally hot, don't even use plan:parallel, just cook to avoid bailing
    if (load > 30) {
      log(`⚠️ THERMAL CRITICAL (Load ${load}): Downgrading to minimal parallel /cook`);
      return `${mandatePrefix}/cook "${VI_PREFIX}${safe}. ${FILE_LIMIT} Nhiệt cao nhưng PHẢI dùng ít nhất 3 subagents parallel." --parallel --auto`;
    }

    const decomposed = buildDecomposedPrompt(safe, 'default');
    if (intent === 'FIX') return `${mandatePrefix}/debug "${VI_PREFIX}${safe}. ${FILE_LIMIT}" --parallel`;
    if (intent === 'PLAN' || intent === 'RESEARCH') return `${mandatePrefix}/plan:hard "${VI_PREFIX}${safe}. ${FILE_LIMIT}"`;
    if (intent === 'REVIEW') return `${mandatePrefix}/review:codebase "${VI_PREFIX}${safe}. ${FILE_LIMIT}" --parallel`;

    return `${mandatePrefix}/plan:parallel "${VI_PREFIX}${safe}. ${FILE_LIMIT} ${decomposed}"`;
  }

  if (intent === 'FIX') return `${mandatePrefix}/debug "${VI_PREFIX}${safe}" --parallel`;
  if (intent === 'REVIEW') return `${mandatePrefix}/review "${VI_PREFIX}${safe}" --parallel`;

  return `${mandatePrefix}/cook "${VI_PREFIX}${safe}. ${FILE_LIMIT} PHẢI dùng đa luồng 10+ subagents parallel. 風林火山: 🔥LỬA mode — Agent Teams parallel execution." --parallel --auto`;
}

const { preemptiveCool } = require('./m1-cooling-daemon');

/**
 * Full dispatch flow: detect project → build prompt → run via brain
 *
 * @param {string} taskContent - Raw task file content
 * @param {string} taskFile - Task filename (for logging)
 * @param {number} [timeoutMs] - Override timeout from classifier (optional)
 * @returns {Promise<{success: boolean, result: string, elapsed: number}>}
 */
async function executeTask(taskContent, taskFile, timeoutMs, complexity) {
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

  const result = await runMission(prompt, projectDir, finalTimeout, modelOverride);

  // 虛實: Switch back to default model after Opus mission
  if (modelOverride) {
    log(`🔥→🌲 Opus mission done — switching back to ${config.MODEL_NAME}`);
    // Model switch back happens at next runMission start (no explicit /model needed)
  }

  return result;
}

module.exports = { executeTask, buildPrompt, detectProjectDir };
