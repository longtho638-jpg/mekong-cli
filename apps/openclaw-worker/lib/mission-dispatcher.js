/**
 * 🚀 Mission Dispatcher v2 — Direct claude -p execution
 *
 * Routes tasks to project directories, builds prompts, and executes
 * missions via brain-process-manager's runMission() (claude -p).
 *
 * v1: Wrote mission to /tmp file → expect brain read it → file IPC polling
 * v2: Calls runMission() directly → Node.js child_process → exit code
 */

const path = require('path');
const config = require('../config');
const { log, runMission } = require('./brain-process-manager');

// Project routing: detect project from task content keywords
function detectProjectDir(taskContent) {
  const lower = taskContent.toLowerCase();
  const routes = {
    '84tea': 'apps/84tea', tea: 'apps/84tea',
    apex: 'apps/apex-os',
    anima: 'apps/anima119',
    sophia: 'apps/sophia-ai-factory',
    well: 'apps/well',
  };
  for (const [keyword, dir] of Object.entries(routes)) {
    if (lower.includes(keyword)) return path.join(config.MEKONG_DIR, dir);
  }
  return config.MEKONG_DIR;
}

// Build clean prompt from raw task content
function buildPrompt(taskContent) {
  const clean = taskContent.replace(/\\!/g, '!').replace(/\\"/g, '"').trim();
  const safe = clean.replace(/[()$`\\!]/g, ' ').replace(/\s+/g, ' ').trim();
  return `/binh-phap implement: ${safe} /cook`;
}

/**
 * Full dispatch flow: detect project → build prompt → run via claude -p
 *
 * @param {string} taskContent - Raw task file content
 * @param {string} taskFile - Task filename (for logging)
 * @returns {Promise<{success: boolean, result: string, elapsed: number}>}
 */
async function executeTask(taskContent, taskFile) {
  const projectDir = detectProjectDir(taskContent);
  const prompt = buildPrompt(taskContent);
  log(`PROJECT: ${projectDir}`);
  log(`PROMPT: ${prompt.slice(0, 120)}...`);

  return runMission(prompt, projectDir, config.MISSION_TIMEOUT_MS);
}

module.exports = { executeTask, buildPrompt, detectProjectDir };
