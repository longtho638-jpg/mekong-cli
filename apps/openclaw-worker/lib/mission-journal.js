/**
 * Mission Journal — Binh Pháp Self-Learning (Level 5 AGI)
 *
 * 第十三篇 用間: "Minh quân hiền tướng, sở dĩ động nhi thắng nhân"
 * (The enlightened ruler and wise general conquer through foreknowledge)
 *
 * Records mission data to data/mission-history.json
 * Analyzes patterns to improve future strategy
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
 * Record a completed mission
 * @param {Object} data
 * @param {string} data.project
 * @param {string} data.missionId
 * @param {string} data.taskFile
 * @param {boolean} data.success
 * @param {number} data.durationMs
 * @param {number} data.tokensUsed
 * @param {string} data.model
 * @param {Object} data.buildResult { build: boolean, pushed: boolean }
 */
function recordMission(data) {
  try {
    const entry = {
      ts: new Date().toISOString(),
      ...data,
      // Calculate efficiency score (lower is better)
      efficiency: data.success ? (data.tokensUsed / 1000) * (data.durationMs / 60000) : 999
    };

    let history = safeLoadHistory(HISTORY_FILE);

    history.push(entry);

    // Keep last 1000 missions
    if (history.length > 1000) history = history.slice(-1000);

    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
    log(`JOURNAL: Recorded mission ${data.missionId} (Efficiency: ${entry.efficiency.toFixed(2)})`);

    // Trigger analysis every 5 missions
    if (history.length % 5 === 0) {
      analyzePatterns(history);
    }

  } catch (error) {
    log(`JOURNAL ERROR: Failed to record mission: ${error.message}`);
  }
}

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
    log(`JOURNAL: ❌ Corrupt JSON in ${path.basename(filePath)}. Backing up and resetting.`);
    try {
      const backupPath = `${filePath}.bak.${Date.now()}`;
      fs.copyFileSync(filePath, backupPath);
    } catch (copyErr) { /* ignore */ }
    return [];
  }
}

/**
 * Analyze history for patterns and insights
 * @param {Array} history
 */
function analyzePatterns(history) {
  try {
    const recent = history.slice(-20);
    const failures = recent.filter(m => !m.success);

    // 1. Detect consecutive failures on same project
    const projectFailures = {};
    failures.forEach(m => {
      projectFailures[m.project] = (projectFailures[m.project] || 0) + 1;
    });

    Object.entries(projectFailures).forEach(([proj, count]) => {
      if (count >= 3) {
        log(`🧠 INSIGHT: Project ${proj} failed ${count} times. Triggering Deep Audit.`);
        createAuditMission(proj, `Project failed ${count} times in recent history.`);
      }
    });

    // 2. Detect build failures vs logic failures
    const buildFailures = recent.filter(m => m.buildResult && m.buildResult.build === false).length;
    if (buildFailures > 5) {
      log(`🧠 INSIGHT: High build failure rate (${buildFailures}/20). Check CI/CD pipeline or type definitions.`);
    }

  } catch (error) {
    log(`JOURNAL ERROR: Analysis failed: ${error.message}`);
  }
}

/**
 * Create an audit mission file
 * @param {string} project
 * @param {string} reason
 */
function createAuditMission(project, reason) {
  try {
    const missionFile = `MEDIUM_mission_${project}_audit_${Date.now()}.txt`;
    // FIX: Use config.WATCH_DIR (global tasks dir) instead of local worker tasks dir
    const tasksDir = config.WATCH_DIR;
    if (!fs.existsSync(tasksDir)) {
      fs.mkdirSync(tasksDir, { recursive: true });
    }
    const missionPath = path.join(tasksDir, missionFile);

    // Check if an audit is already pending to avoid spam
    if (fs.existsSync(tasksDir)) {
      const existing = fs.readdirSync(tasksDir).find(f => f.includes(`mission_${project}_audit`));
      if (existing) {
        log(`JOURNAL: ⏸️ Audit mission for ${project} already exists, skipping creation.`);
        return;
      }
    }

    const content = `
MISSION: Deep Audit for ${project}
MISSION_ID: audit_${Date.now()}
PROJECT: ${project}
PRIORITY: MEDIUM

REASON: ${reason}

TASK:
1. Review recent build failures and error logs in .gate-results.json.
2. Analyze code for systemic issues (types, infinite loops, memory leaks).
3. Recommend structural fixes.
4. Verify if "fix" missions are creating loops.
`.trim();

    fs.writeFileSync(missionPath, content);
    log(`JOURNAL: 🛡️ SELF-PLANNING: Created audit mission ${missionFile}`);
  } catch (e) {
    log(`JOURNAL: ❌ Failed to create audit mission: ${e.message}`);
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
    // Capture output từ tmux with timeout to prevent hang
    const output = execSync('tmux capture-pane -p -S -2000 -t tom-hum-brain 2>/dev/null', {
      encoding: 'utf-8',
      timeout: 2000
    });

    // Parse regex /Tokens: ([\d,]+)/ theo yêu cầu
    const regex = /Tokens: ([\d,]+)/g;
    let match;
    let tokens = 0;
    while ((match = regex.exec(output)) !== null) {
      // Loại bỏ dấu phẩy và cộng dồn token
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
 * Get stats for dashboard
 */
function getStats() {
  try {
    const history = safeLoadHistory(HISTORY_FILE);
    const total = history.length;
    const success = history.filter(m => m.success).length;
    const durations = history.filter(m => typeof m.durationMs === 'number').map(m => m.durationMs);
    const avgDuration = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
    return {
      totalMissions: total,
      successRate: total ? Math.round((success / total) * 100) : 0,
      avgDuration,
      lastMission: history[history.length - 1]
    };
  } catch (e) {
    return { total: 0, successRate: 0 };
  }
}

/**
 * Get full mission history
 */
function getHistory() {
  try {
    return safeLoadHistory(HISTORY_FILE);
  } catch (e) {
    return [];
  }
}

/**
 * Get project priority based on success rate
 * @param {string} project
 * @returns {number} Priority score (1-10)
 */
function getProjectPriority(project) {
  try {
    const history = safeLoadHistory(HISTORY_FILE);
    if (history.length === 0) return 5;

    const projectMissions = history.filter(m => m.project === project).slice(-20); // Last 20 missions

    if (projectMissions.length === 0) return 5;

    const successCount = projectMissions.filter(m => m.success).length;
    const rate = successCount / projectMissions.length;

    // Base priority
    let priority = 5;

    if (rate > 0.8) {
      priority = 8; // Boost high performers
    } else if (rate < 0.3) {
      priority = 2; // Deprioritize low performers (waste)
    }

    // Boost if recent missions were successful (momentum)
    const recent = projectMissions.slice(-3);
    if (recent.every(m => m.success)) priority += 1;

    // Cap at 1-10
    return Math.max(1, Math.min(10, priority));
  } catch (e) {
    return 5;
  }
}

module.exports = { recordMission, getHistory, getStats, countTokensBetween, getProjectPriority };
