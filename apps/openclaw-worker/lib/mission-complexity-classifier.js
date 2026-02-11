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

const VI_PREFIX = 'Trả lời bằng TIẾNG VIỆT. ';
const FILE_LIMIT = 'Chỉ sửa TỐI ĐA 5 file mỗi mission. Nếu cần sửa nhiều hơn, báo cáo danh sách còn lại.';

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
  if (config.COMPLEXITY.COMPLEX_KEYWORDS.some(kw => lower.includes(kw))) {
    return { complexity: 'complex', timeout: config.TIMEOUT_COMPLEX };
  }
  if (config.COMPLEXITY.MEDIUM_KEYWORDS.some(kw => lower.includes(kw))) {
    return { complexity: 'medium', timeout: config.TIMEOUT_MEDIUM };
  }
  return { complexity: 'simple', timeout: config.TIMEOUT_SIMPLE };
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
    'AGENT TEAM: You MUST use Claude Code native Agent Teams.',
    `Spawn ${roles.length} parallel Task subagents via the Task tool: ${roleList}.`,
    'Each subagent works independently on its scope.',
    'Launch ALL subagents in a single message with multiple Task tool calls.',
    'Wait for all to complete, then consolidate findings.',
  ].join(' ');
}

/**
 * Generate the mission prompt with appropriate complexity settings.
 * @param {object} task - Task object ({id, cmd, complexity?})
 * @param {string} project - Target project name
 * @param {'simple'|'medium'|'complex'} complexity - Classified complexity
 * @returns {{ prompt: string, timeout: number }} Formatted mission prompt + timeout
 */
function generateMissionPrompt(task, project, complexity) {
  const mission = `${VI_PREFIX}${task.cmd} in ${project}. ${FILE_LIMIT}`;
  const timeout = getTimeoutForComplexity(complexity);

  if (complexity === 'complex') {
    const teamBlock = buildAgentTeamBlock(task.id);
    return { prompt: `/cook "${mission} ${teamBlock}"`, timeout };
  }

  if (complexity === 'medium') {
    return { prompt: `/cook "${mission}" --auto`, timeout };
  }

  // SIMPLE: --auto BẮT BUỘC vì Tôm Hùm chạy tự trị, không có người approve
  return { prompt: `/cook "${mission}" --auto`, timeout };
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

module.exports = { classifyComplexity, generateMissionPrompt, isTeamMission, buildAgentTeamBlock, classifyContentTimeout, getTimeoutForComplexity };
