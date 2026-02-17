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
 * Build prompt from raw task content.
 * Rule 13: Command Obsession + Hàn Băng Quyết v4 Adaptive Scaling
 */
function buildPrompt(taskContent) {
  let clean = taskContent.replace(/\\!/g, '!').replace(/\\"/g, '"').trim();
  clean = clean.replace(/^[a-z0-9_-]+:\s*/i, '');
  const safe = clean.replace(/[()$`\\!]/g, ' ').replace(/\s+/g, ' ').trim();

  if (safe.includes('/binh-phap') || safe.includes('/cook')) return safe;

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
  if (load > 12 || overheat) {
    adaptiveMandate = 'HÀN BĂNG MODE: Máy rất nóng — Chỉ dùng TỐI ĐA 2 subagents. Ưu tiên giải quyết nhanh, ít file. ';
  } else {
    adaptiveMandate = 'COMMANDER RULE 13: Bạn là Elite Commander. Chỉ huy team subagents một cách ÁM ẢNH (10+ agents nếu cần) để đạt hiệu quả 1000%. ';
  }

  const intent = detectIntent(safe);
  const mandatePrefix = `${memoryPrefix}${adaptiveMandate}`;

  if (isComplexRawMission(safe.toLowerCase())) {
    // If exceptionally hot, don't even use plan:parallel, just cook to avoid bailing
    if (load > 20) {
      log(`⚠️ THERMAL CRITICAL (Load ${load}): Downgrading parallel mission to single /cook`);
      return `${mandatePrefix}/cook "${VI_PREFIX}${safe}. ${FILE_LIMIT}" --auto`;
    }

    const decomposed = buildDecomposedPrompt(safe, 'default');
    if (intent === 'FIX') return `${mandatePrefix}/debug "${VI_PREFIX}${safe}. ${FILE_LIMIT}"`;
    if (intent === 'PLAN' || intent === 'RESEARCH') return `${mandatePrefix}/plan:hard "${VI_PREFIX}${safe}. ${FILE_LIMIT}"`;
    if (intent === 'REVIEW') return `${mandatePrefix}/review:codebase "${VI_PREFIX}${safe}. ${FILE_LIMIT}"`;

    return `${mandatePrefix}/plan:parallel "${VI_PREFIX}${safe}. ${FILE_LIMIT} ${decomposed}"`;
  }

  if (intent === 'FIX') return `${mandatePrefix}/debug "${VI_PREFIX}${safe}" --fast`;
  if (intent === 'REVIEW') return `${mandatePrefix}/review "${VI_PREFIX}${safe}"`;

  return `${memoryPrefix}/cook "${VI_PREFIX}${safe}. ${FILE_LIMIT}" --auto`;
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
