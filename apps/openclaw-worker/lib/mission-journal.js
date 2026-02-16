/**
 * Mission Journal — Binh Pháp Self-Learning (Level 5 AGI)
 *
 * Records mission data to data/mission-history.json
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');
const { log } = require('./brain-tmux');

const HISTORY_FILE = path.join(config.MEKONG_DIR, 'apps/openclaw-worker/data/mission-history.json');
const DATA_DIR = path.dirname(HISTORY_FILE);

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
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
      duration: data.duration,
      success: data.success,
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

    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
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

module.exports = { recordMission, getStats, getHistory, countTokensBetween };
