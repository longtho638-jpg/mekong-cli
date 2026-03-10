/**
 * Mission Journal — Binh Pháp Self-Learning (Level 5 AGI)
 *
 * Records mission data to data/mission-history.json
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');
const { log } = require('./brain-process-manager');

const HISTORY_FILE = path.join(config.MEKONG_DIR, 'apps/openclaw-worker/data/mission-history.json');
const DATA_DIR = path.dirname(HISTORY_FILE);

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Classify mission task type from missionId or content.
 * Maps to categories: build, test, fix, refactor, scan, deploy, docs, security, perf, i18n.
 * @param {string} missionId
 * @param {string} [project]
 * @returns {string} task type category
 */
function classifyTaskType(missionId, project) {
  const id = (missionId || '').toLowerCase();
  if (/test|spec|vitest|jest/.test(id)) return 'test';
  if (/fix|bug|patch|heal|recover/.test(id)) return 'fix';
  if (/build|compile|gate|ci|cd/.test(id)) return 'build';
  if (/refactor|clean|debt|console|todo/.test(id)) return 'refactor';
  if (/scan|hunt|audit|score|recon/.test(id)) return 'scan';
  if (/deploy|ship|push|release/.test(id)) return 'deploy';
  if (/doc|readme|changelog/.test(id)) return 'docs';
  if (/secur|auth|csp|xss|rls/.test(id)) return 'security';
  if (/perf|speed|lighthouse|lcp/.test(id)) return 'perf';
  if (/i18n|locale|translate/.test(id)) return 'i18n';
  if (/trading|revenue|license/.test(id)) return 'revenue';
  if (/evolve|learn|synth/.test(id)) return 'evolution';
  return project || 'general';
}

/**
 * Record a completed mission (AGI Level 3 & 5)
 * @param {Object} data
 * @param {string} data.project
 * @param {string} data.missionId
 * @param {number} data.duration - duration in ms
 * @param {boolean} data.success
 * @param {Object} data.buildResult - { build: boolean, output: string }
 * @param {number} data.tokensUsed
 */
async function recordMission(data) {
  try {
    const entry = {
      timestamp: new Date().toISOString(),
      project: data.project,
      missionId: data.missionId,
      taskType: classifyTaskType(data.missionId, data.project),
      duration: data.duration,
      success: data.success,
      failureType: data.failureType,
      buildResult: data.buildResult,
      tokensUsed: data.tokensUsed || 0
    };

    let history = [];
    if (fs.existsSync(HISTORY_FILE)) {
      try {
        history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
      } catch (e) {
        history = [];
      }
    }

    history.push(entry);

    // Keep last 1000 missions
    if (history.length > 1000) history = history.slice(-1000);

    const tempFile = `${HISTORY_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(history, null, 2));
    fs.renameSync(tempFile, HISTORY_FILE);
    log(`JOURNAL: Recorded mission ${data.missionId} for project ${data.project}`);

  } catch (error) {
    log(`JOURNAL ERROR: Failed to record mission: ${error.message}`);
  }
}

/**
 * Get stats for dashboard
 * @returns {Object}
 */
function getStats() {
  try {
    if (!fs.existsSync(HISTORY_FILE)) return { totalMissions: 0, successRate: 0, avgDuration: 0 };
    const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));

    const totalMissions = history.length;
    if (totalMissions === 0) return { totalMissions: 0, successRate: 0, avgDuration: 0 };

    const successCount = history.filter(m => m.success).length;
    const durations = history.map(m => m.duration).filter(d => typeof d === 'number');
    const totalDuration = durations.reduce((a, b) => a + b, 0);
    const avgDuration = durations.length ? Math.round(totalDuration / durations.length) : 0;

    return {
      totalMissions,
      successRate: Math.round((successCount / totalMissions) * 100),
      avgDuration
    };
  } catch (e) {
    log(`JOURNAL ERROR: Failed to get stats: ${e.message}`);
    return { totalMissions: 0, successRate: 0, avgDuration: 0 };
  }
}

/**
 * Count tokens from tmux output
 * @param {number} startTime
 * @param {number} endTime
 * @returns {{ tokens: number, model: string }}
 */
function countTokensBetween(startTime, endTime) {
  try {
    const { execSync } = require('child_process');
    // Capture output from tmux with timeout to prevent hang
    const output = execSync('tmux capture-pane -p -S -2000 -t tom_hum_brain 2>/dev/null', {
      encoding: 'utf-8',
      timeout: 2000
    });

    // Parse regex /Tokens: ([\d,]+)/
    const regex = /Tokens: ([\d,]+)/g;
    let match;
    let tokens = 0;
    while ((match = regex.exec(output)) !== null) {
      tokens += parseInt(match[1].replace(/,/g, ''));
    }

    return {
      tokens,
      model: 'claude-opus-4-6-thinking'
    };
  } catch (e) {
    return { tokens: 0, model: 'unknown' };
  }
}

/**
 * Get full history
 * @returns {Array}
 */
function getHistory() {
  try {
    if (!fs.existsSync(HISTORY_FILE)) return [];
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

/**
 * Get mission stats for AGI score calculation.
 * Returns successRate (0-1), totalProcessed, recentTaskTypes.
 */
function getMissionStats() {
  try {
    const history = getHistory();
    if (history.length === 0) return { successRate: 0, totalProcessed: 0, recentTaskTypes: [] };
    const recent = history.slice(-50);
    const successes = recent.filter(m => m.success).length;
    const taskTypes = recent.map(m => m.taskType || classifyTaskType(m.missionId, m.project));
    return {
      successRate: successes / recent.length,
      totalProcessed: history.length,
      recentTaskTypes: taskTypes,
    };
  } catch (e) {
    return { successRate: 0, totalProcessed: 0, recentTaskTypes: [] };
  }
}

module.exports = { recordMission, getStats, getHistory, countTokensBetween, getMissionStats, classifyTaskType };
