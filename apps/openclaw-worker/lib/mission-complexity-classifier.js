/**
 * Mission Complexity Classifier — Routes missions to appropriate execution format
 *
 * ALL levels use /cook ClaudeKit command to ensure proper workflow activation.
 *
 * SIMPLE  → /cook "task" --auto                     (single agent, fast)
 * MEDIUM  → /cook "task" --auto --parallel           (sub-agents, parallel)
 * COMPLEX → /cook with Agent Team instructions       (4+ parallel Task subagents)
 */

const config = require('../config');

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
 * Generate the mission prompt in the format appropriate for the complexity level.
 * @param {object} task - Task object ({id, cmd, complexity?})
 * @param {string} project - Target project name
 * @param {'simple'|'medium'|'complex'} complexity - Classified complexity
 * @returns {string} Formatted mission prompt for CC CLI
 */
function generateMissionPrompt(task, project, complexity) {
  const mission = `${task.cmd} in ${project}`;

  if (complexity === 'complex') {
    const teamBlock = buildAgentTeamBlock(task.id);
    return `/cook "${mission}. ${teamBlock}" use context7`;
  }

  if (complexity === 'medium') {
    return `/cook "${mission}" --auto --parallel use context7`;
  }

  return `/cook "${mission}" --auto use context7`;
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

module.exports = { classifyComplexity, generateMissionPrompt, isTeamMission, buildAgentTeamBlock };
