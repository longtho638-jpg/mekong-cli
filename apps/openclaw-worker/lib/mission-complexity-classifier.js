/**
 * Mission Complexity Classifier — Routes missions to appropriate execution format
 *
 * ALL levels use /cook ClaudeKit command to ensure proper workflow activation.
 *
 * SIMPLE  → /cook "task"                        (single agent, 15 phút)
 * MEDIUM  → /cook "task" --auto                  (sub-agents, 30 phút)
 * COMPLEX → /cook with Agent Team instructions   (4+ parallel Task subagents, 45 phút)
 */

const config = require('../config');
const fs = require('fs');
const path = require('path');

const VI_PREFIX = 'Trả lời bằng TIẾNG VIỆT. ';
const FILE_LIMIT = 'Chỉ sửa TỐI ĐA 5 file mỗi mission. Nếu cần sửa nhiều hơn, báo cáo danh sách còn lại.';
const NO_GIT = 'CRITICAL: DO NOT run git commit, git push, or /check-and-commit. The CI/CD gate handles git operations.';

const HISTORY_FILE = path.join(config.MEKONG_DIR, 'apps/openclaw-worker/data/mission-history.json');

/**
 * Safe JSON parse with backup for corrupted files
 * @param {string} filePath
 * @returns {Array}
 */
function safeLoadHistory(filePath) {
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    try {
      const backupPath = `${filePath}.bak.${Date.now()}`;
      fs.copyFileSync(filePath, backupPath);
    } catch (copyErr) { /* ignore */ }
    return [];
  }
}

/**
 * Adjust timeout based on project history (Self-Learning Feedback Loop)
 * @param {string} project
 * @param {number} baseTimeout
 * @returns {number} Adjusted timeout in ms
 */
function adjustTimeout(project, baseTimeout) {
  try {
    let adjusted = baseTimeout || config.TIMEOUT_SIMPLE;

    const history = safeLoadHistory(HISTORY_FILE);
    const projectMissions = history.filter(m => m.project === project).slice(-10);

    if (projectMissions.length > 0) {
      // Logic: Nếu thường xuyên timeout (thất bại và chạy > 90% timeout) -> +20%
        const timeouts = projectMissions.filter(m => !m.success && m.durationMs > (adjusted * 0.9)).length;
        if (timeouts > 3) {
          adjusted = Math.floor(adjusted * 1.2);
        }

        // Logic: Nếu luôn chạy nhanh (thành công và < 60% timeout) -> -20%
        const fastRuns = projectMissions.filter(m => m.success && m.durationMs < (adjusted * 0.6)).length;
        if (fastRuns > 6) {
          adjusted = Math.floor(adjusted * 0.8);
        }

        // Logic: Nếu luôn chạy RẤT nhanh (thành công và < 30% timeout) -> -20%
        const veryFastRuns = projectMissions.filter(m => m.success && m.durationMs < (adjusted * 0.3)).length;
        if (veryFastRuns > 5) {
          adjusted = Math.floor(adjusted * 0.8);
        }
      }

    // Range: 5 min to 60 min
    const MIN_TIMEOUT = 5 * 60 * 1000;
    const MAX_TIMEOUT = 60 * 60 * 1000;

    return Math.min(Math.max(adjusted, MIN_TIMEOUT), MAX_TIMEOUT);
  } catch (e) {
    return baseTimeout || config.TIMEOUT_SIMPLE;
  }
}

/**
 * Classify mission complexity based on task metadata and keyword analysis.
 * @param {object} task - Task object from BINH_PHAP_TASKS ({id, cmd, complexity?})
 * @param {string} project - Project name for scope context
 * @returns {'simple'|'medium'|'complex'}
 */
function classifyComplexity(task, project) {
  if (task.complexity) return task.complexity;
  const text = `${task.cmd} ${task.id}`.toLowerCase();
  if (config.COMPLEXITY.COMPLEX_KEYWORDS.some(kw => text.includes(kw))) return 'complex';
  if (config.COMPLEXITY.MEDIUM_KEYWORDS.some(kw => text.includes(kw))) return 'medium';
  return 'simple';
}

/**
 * Get timeout for a given complexity level.
 * @param {'simple'|'medium'|'complex'} complexity
 * @returns {number} Timeout in milliseconds
 */
function getTimeoutForComplexity(complexity) {
  if (complexity === 'complex') return config.TIMEOUT_COMPLEX;
  if (complexity === 'medium') return config.TIMEOUT_MEDIUM;
  return config.TIMEOUT_SIMPLE;
}

/**
 * Classify raw mission text and return appropriate timeout.
 * Used by task-queue for dynamic timeout on any mission content.
 * @param {string} text - Raw mission file content
 * @returns {{ complexity: string, timeout: number }}
 */
function classifyContentTimeout(text) {
  const lower = text.toLowerCase();
  let complexity = 'simple';
  if (config.COMPLEXITY.COMPLEX_KEYWORDS.some(kw => lower.includes(kw))) {
    complexity = 'complex';
  } else if (config.COMPLEXITY.MEDIUM_KEYWORDS.some(kw => lower.includes(kw))) {
    complexity = 'medium';
  }

  const baseTimeout = getTimeoutForComplexity(complexity);
  return { complexity, timeout: baseTimeout };
}

/**
 * Build Agent Team instruction block for complex missions.
 * Tells CC CLI to spawn parallel Task subagents via the native Task tool.
 * @param {string} taskId - Task identifier for role lookup
 * @returns {string} Agent Team instruction text
 */
function buildAgentTeamBlock(taskId) {
  const roles = config.AGENT_TEAM_ROLES[taskId] || config.AGENT_TEAM_ROLES.default;
  const roleList = roles.map((r, i) => `(${i + 1}) ${r}`).join(', ');
  return [
    'AGENT TEAM: Activate Agent Teams.',
    `Spawn ${roles.length} parallel subagents: ${roleList}.`,
    'Launch them in parallel.',
    'Wait for all to complete, then consolidate findings.',
    'IMPORTANT: DO NOT use XML tags like <invoke>. Use natural language or slash commands only.',
  ].join(' ');
}

/**
 * Generate the mission prompt with Phong Lâm Hỏa Sơn (風林火山) token optimization.
 *
 * 🌪️ GIÓ (SIMPLE):  --fast --no-test  → 30% tokens, speed run
 * 🌲 RỪNG (MEDIUM): --auto            → 60% tokens, standard quality
 * 🔥 LỬA (COMPLEX): --parallel teams  → 100% tokens, maximum power
 * ⛰️ NÚI (IDLE):    queue scan        → 0 tokens
 *
 * @param {object} task - Task object ({id, cmd, complexity?})
 * @param {string} project - Target project name
 * @param {'simple'|'medium'|'complex'} complexity - Classified complexity
 * @returns {{ prompt: string, timeout: number, mode: string }} Formatted mission prompt + timeout + binh phap mode
 */
function generateMissionPrompt(task, project, complexity) {
  const mission = `${VI_PREFIX}${task.cmd} in ${project}. ${FILE_LIMIT} ${NO_GIT}`;

  // Get base timeout based on complexity
  const baseTimeout = getTimeoutForComplexity(complexity);

  // Apply adaptive learning adjustment
  const timeout = adjustTimeout(project, baseTimeout);

  // 🔥 LỬA mode — Complex: Agent Teams parallel, max token burn, max output
  if (complexity === 'complex') {
    const teamBlock = buildAgentTeamBlock(task.id);
    return { prompt: `/cook "${mission} ${teamBlock}" --auto`, timeout, mode: '🔥LỬA' };
  }

  // 🌲 RỪNG mode — Medium: standard /cook with auto, balanced
  if (complexity === 'medium') {
    return { prompt: `/cook "${mission}" --auto`, timeout, mode: '🌲RỪNG' };
  }

  // 🌪️ GIÓ mode — Simple: fast + no-test, minimum token burn, maximum speed
  return { prompt: `/cook "${mission}" --fast --no-test --auto`, timeout, mode: '🌪️GIÓ' };
}

/**
 * Check if a mission prompt is a team/complex mission (for timeout decisions).
 * @param {string} prompt - The full mission prompt text
 * @returns {boolean}
 */
function isTeamMission(prompt) {
  const lower = prompt.toLowerCase();
  return lower.includes('agent team') ||
    lower.includes('parallel task subagents') ||
    lower.includes('scope: thorough') ||
    lower.includes('teammates');
}

module.exports = { classifyComplexity, generateMissionPrompt, isTeamMission, buildAgentTeamBlock, classifyContentTimeout, getTimeoutForComplexity, adjustTimeout };
