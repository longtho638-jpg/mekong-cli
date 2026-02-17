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
// ⚠️ CRITICAL: runMission MUST come from brain-tmux (tmux paste dispatch)
// brain-process-manager does NOT export runMission (file-based = BROKEN)
const { log } = require('./brain-process-manager');
const { runMission } = require('./brain-tmux');
const { isTeamMission, buildAgentTeamBlock, buildDecomposedPrompt, detectIntent } = require('./mission-complexity-classifier');
const { getTopLessons } = require('./post-mortem-reflector');

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
      const gotchas = gotchasMatch ? gotchasMatch[0].slice(0, 800) : ''; // Limit to 800 chars
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
  const claudekitEnforcement = 'CLAUDEKIT MANDATORY: Mọi task PHẢI dùng ClaudeKit commands (/cook, /plan:hard, /debug). PHẢI bật đa luồng subagents. PHẢI deep thinking. ';
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
  if (intent === 'MULTI_FIX') return `${mandatePrefix}/fix "${VI_PREFIX}${safe}. ${FILE_LIMIT}" --parallel --auto`;

  // STRATEGIC: large-scale architecture/redesign → deep parallel planning
  if (intent === 'STRATEGIC') return `${mandatePrefix}/plan:parallel "${VI_PREFIX}${safe}. ${FILE_LIMIT}"`;

  if (isComplexRawMission(safe.toLowerCase())) {
    // If exceptionally hot, don't even use plan:parallel, just cook to avoid bailing
    if (load > 30) {
      log(`⚠️ THERMAL CRITICAL (Load ${load}): Downgrading to minimal parallel /cook`);
      return `${mandatePrefix}/cook "${VI_PREFIX}${safe}. ${FILE_LIMIT} Nhiệt cao nhưng PHẢI dùng ít nhất 3 subagents parallel." --parallel --auto`;
    }

    const decomposed = buildDecomposedPrompt(safe, 'default');
    if (intent === 'FIX') return `${mandatePrefix}/debug "${VI_PREFIX}${safe}. ${FILE_LIMIT}"`;
    if (intent === 'PLAN' || intent === 'RESEARCH') return `${mandatePrefix}/plan:hard "${VI_PREFIX}${safe}. ${FILE_LIMIT}"`;
    if (intent === 'REVIEW') return `${mandatePrefix}/review:codebase "${VI_PREFIX}${safe}. ${FILE_LIMIT}"`;

    return `${mandatePrefix}/plan:parallel "${VI_PREFIX}${safe}. ${FILE_LIMIT} ${decomposed}"`;
  }

  if (intent === 'FIX') return `${mandatePrefix}/debug "${VI_PREFIX}${safe}" --fast`;
  if (intent === 'REVIEW') return `${mandatePrefix}/review "${VI_PREFIX}${safe}"`;

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
