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
const { log, runMission } = require('./brain-tmux');
const { isTeamMission, buildAgentTeamBlock } = require('./mission-complexity-classifier');

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
 * - If task already has /binh-phap or /cook → pass through unchanged
 * - If task matches complex keywords → wrap with Agent Team instructions
 * - Otherwise → standard /binh-phap + /cook wrapper
 */
function buildPrompt(taskContent) {
  let clean = taskContent.replace(/\\!/g, '!').replace(/\\"/g, '"').trim();
  // Strip project routing prefix (e.g. "sophia: " at start)
  clean = clean.replace(/^[a-z0-9_-]+:\s*/i, '');
  const safe = clean.replace(/[()$`\\!]/g, ' ').replace(/\s+/g, ' ').trim();

  // Don't double-wrap if already has /binh-phap or /cook
  if (safe.includes('/binh-phap') || safe.includes('/cook')) return safe;

  // Complex raw missions → Agent Team prompt
  const lower = safe.toLowerCase();
  if (isComplexRawMission(lower)) {
    const teamBlock = buildAgentTeamBlock('default');
    return `/cook "${VI_PREFIX}${safe}. ${FILE_LIMIT} ${teamBlock}" --auto`;
  }

  return `/cook "${VI_PREFIX}${safe}. ${FILE_LIMIT}" --auto`;
}

/**
 * Full dispatch flow: detect project → build prompt → run via brain
 *
 * @param {string} taskContent - Raw task file content
 * @param {string} taskFile - Task filename (for logging)
 * @param {number} [timeoutMs] - Override timeout from classifier (optional)
 * @returns {Promise<{success: boolean, result: string, elapsed: number}>}
 */
async function executeTask(taskContent, taskFile, timeoutMs) {
  const projectDir = detectProjectDir(taskContent);
  const prompt = buildPrompt(taskContent);
  const finalTimeout = timeoutMs || (isTeamMission(prompt) ? config.AGENT_TEAM_TIMEOUT_MS : config.MISSION_TIMEOUT_MS);
  const mode = isTeamMission(prompt) ? 'AGENT_TEAM' : 'SINGLE';
  log(`PROMPT [${mode}]: ${prompt.slice(0, 150)}... [timeout=${Math.round(finalTimeout / 60000)}min]`);

  return runMission(prompt, projectDir, finalTimeout);
}

module.exports = { executeTask, buildPrompt, detectProjectDir };
