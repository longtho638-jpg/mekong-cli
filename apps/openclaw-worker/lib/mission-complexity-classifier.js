/**
 * Mission Complexity Classifier — Routes missions to appropriate execution format
 *
 * ALL levels use /cook ClaudeKit command to ensure proper workflow activation
 * (research → plan → implement → test → review → finalize).
 *
 * SIMPLE  → /cook "task" --auto                    (single agent, fast)
 * MEDIUM  → /cook "task" --auto --parallel          (sub-agents, parallel)
 * COMPLEX → /cook "task" --auto --parallel          (sub-agents, deep scope)
 */

const config = require('../config');

/**
 * Classify mission complexity based on task metadata and keyword analysis.
 * @param {object} task - Task object from BINH_PHAP_TASKS ({id, cmd, complexity?})
 * @param {string} project - Project name for scope context
 * @returns {'simple'|'medium'|'complex'}
 */
function classifyComplexity(task, project) {
  // Explicit complexity from task config takes priority
  if (task.complexity) return task.complexity;

  // Keyword-based fallback classification
  const text = `${task.cmd} ${task.id}`.toLowerCase();

  if (config.COMPLEXITY.COMPLEX_KEYWORDS.some(kw => text.includes(kw))) return 'complex';
  if (config.COMPLEXITY.MEDIUM_KEYWORDS.some(kw => text.includes(kw))) return 'medium';
  return 'simple';
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

  // All levels use /cook to ensure ClaudeKit workflow activation
  // Complex gets extended scope description for deeper analysis
  if (complexity === 'complex') {
    return `/cook "${mission}. Scope: thorough — scan all files, fix all issues found, run tests, verify build passes" --auto --parallel use context7`;
  }

  if (complexity === 'medium') {
    return `/cook "${mission}" --auto --parallel use context7`;
  }

  // simple
  return `/cook "${mission}" --auto use context7`;
}

/**
 * Check if a mission prompt is a complex/deep-scope mission (for timeout decisions).
 * Complex missions get extended timeout even though they now use /cook.
 * @param {string} prompt - The full mission prompt text
 * @returns {boolean}
 */
function isTeamMission(prompt) {
  const lower = prompt.toLowerCase();
  return lower.includes('scope: thorough') || lower.includes('agent team') || lower.includes('teammates');
}

module.exports = { classifyComplexity, generateMissionPrompt, isTeamMission };
