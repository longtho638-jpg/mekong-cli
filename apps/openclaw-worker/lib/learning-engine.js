/**
 * Learning Engine — CTO Self-Improvement via Mission Analysis
 * AGI Level 8: Self-Learning Loop
 *
 * 📜 Binh Pháp Ch.6 虛實: 「因敵變化而取勝」
 *    "Adapt your strategy based on the enemy's changes to achieve victory"
 *
 * Tracks mission outcomes, calculates success rates per task type,
 * and provides adaptive recommendations for the Strategic Brain.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

const DATA_DIR = path.join(config.MEKONG_DIR, 'apps/openclaw-worker/data');
const OUTCOMES_FILE = path.join(DATA_DIR, 'mission-outcomes.json');
const LESSONS_FILE = path.join(DATA_DIR, 'cto-lessons.json');

// Ensure data dir
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function log(msg) {
  const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
  const line = `[${ts}] [tom-hum] [LEARNING] ${msg}`;
  try { fs.appendFileSync('/Users/macbookprom1/tom_hum_cto.log', line + '\n'); } catch (e) { }
}

function loadOutcomes() {
  try {
    if (fs.existsSync(OUTCOMES_FILE)) return JSON.parse(fs.readFileSync(OUTCOMES_FILE, 'utf-8'));
  } catch (e) { }
  return [];
}

function saveOutcomes(outcomes) {
  if (outcomes.length > 200) outcomes = outcomes.slice(-200);
  try { fs.writeFileSync(OUTCOMES_FILE, JSON.stringify(outcomes, null, 2)); } catch (e) { }
}

function loadLessons() {
  try {
    if (fs.existsSync(LESSONS_FILE)) return JSON.parse(fs.readFileSync(LESSONS_FILE, 'utf-8'));
  } catch (e) { }
  return { rules: [], patterns: {}, updatedAt: null };
}

function saveLessons(lessons) {
  lessons.updatedAt = new Date().toISOString();
  try { fs.writeFileSync(LESSONS_FILE, JSON.stringify(lessons, null, 2)); } catch (e) { }
}

/**
 * Record a mission outcome.
 */
function recordOutcome(taskId, project, result, elapsedSec, missionSummary = null) {
  const outcomes = loadOutcomes();
  // 🧬 FIX: Accept 'done' OR 'success' as success indicators (brain-mission-runner returns 'done')
  const isSuccess = result === 'done' || result === 'success' || result === true;
  const outcome = {
    taskId, project, result,
    success: isSuccess,
    elapsedSec,
    summary: missionSummary?.summary || '',
    filesChanged: missionSummary?.filesChanged || 0,
    timestamp: new Date().toISOString()
  };
  outcomes.push(outcome);
  saveOutcomes(outcomes);
  analyzePatterns(outcomes);
  log(`Recorded: ${taskId} → ${result} (${isSuccess ? '✅' : '❌'}) (${elapsedSec}s)${outcome.filesChanged ? ` [${outcome.filesChanged} files]` : ''}`);
  return outcome;
}

/**
 * Get success rate per task type with time-decay weighting.
 * Missions older than 7 days get 50% weight, older than 14 days get 25%.
 */
function getSuccessRates() {
  const outcomes = loadOutcomes();
  const rates = {};
  const now = Date.now();
  const DAY_MS = 86400000;

  for (const o of outcomes) {
    if (!rates[o.taskId]) rates[o.taskId] = { runs: 0, successes: 0, rate: 0, avgTime: 0, totalTime: 0, filesChanged: 0, avgFilesPerRun: 0, lastRun: null };
    const r = rates[o.taskId];

    // Time-decay: recent missions matter more
    const ageMs = now - new Date(o.timestamp).getTime();
    const weight = ageMs > 14 * DAY_MS ? 0.25 : ageMs > 7 * DAY_MS ? 0.5 : 1.0;

    r.runs += weight;
    if (o.success) r.successes += weight;
    r.totalTime += (o.elapsedSec || 0) * weight;
    r.avgTime = r.runs > 0 ? Math.round(r.totalTime / r.runs) : 0;
    r.filesChanged += o.filesChanged || 0;
    r.avgFilesPerRun = r.runs > 0 ? Math.round(r.filesChanged / r.runs) : 0;
    r.rate = r.runs > 0 ? Math.round((r.successes / r.runs) * 100) : 0;
    r.lastRun = o.timestamp;
  }
  return rates;
}

/**
 * Analyze patterns and generate lessons.
 */
function analyzePatterns(outcomes) {
  const lessons = loadLessons();
  const rates = getSuccessRates();

  // Pattern 1: Tasks that fail > 70% (after 3+ runs) → AVOID
  for (const [taskId, stats] of Object.entries(rates)) {
    if (stats.runs >= 3 && stats.rate < 30) {
      const rule = `AVOID: ${taskId} — ${stats.rate}% success (${stats.successes}/${stats.runs})`;
      if (!lessons.rules.some(r => r.startsWith(`AVOID: ${taskId}`))) {
        lessons.rules.push(rule);
        log(`LESSON: ${rule}`);
      }
    }
  }

  // Pattern 2: 0 file changes 3x in a row → diminishing returns
  const taskGroups = {};
  for (const o of outcomes) {
    if (!taskGroups[o.taskId]) taskGroups[o.taskId] = [];
    taskGroups[o.taskId].push(o);
  }
  for (const [taskId, runs] of Object.entries(taskGroups)) {
    const last3 = runs.slice(-3);
    if (last3.length >= 3 && last3.every(r => r.success && (r.filesChanged || 0) === 0)) {
      const rule = `DEPRIORITIZE: ${taskId} — 0 changes 3x in a row`;
      if (!lessons.rules.some(r => r.startsWith(`DEPRIORITIZE: ${taskId}`))) {
        lessons.rules.push(rule);
        log(`LESSON: ${rule}`);
      }
    }
  }

  lessons.patterns = rates;
  saveLessons(lessons);
  return lessons;
}

/**
 * Get priority adjustments from learned patterns.
 * Returns: { taskId: multiplier (0.1 - 2.0) }
 * 🧬 FIX: Use avgFilesPerRun instead of total filesChanged for diminishing returns check
 */
function getTaskAdjustments() {
  const rates = getSuccessRates();
  const adjustments = {};
  for (const [taskId, stats] of Object.entries(rates)) {
    let mult = 1.0;
    if (stats.runs >= 3 && stats.rate < 30) mult = 0.1;
    else if (stats.runs >= 3 && stats.rate < 50) mult = 0.3;
    // Diminishing returns: high success but no file changes per run
    if (stats.runs >= 3 && stats.rate > 80 && stats.avgFilesPerRun === 0) mult = 0.2;
    if (stats.runs < 2) mult = 1.5;
    // Reward productive tasks (avg files changed per run > 3)
    if (stats.avgFilesPerRun > 3) mult = Math.min(mult * 1.3, 2.0);
    adjustments[taskId] = mult;
  }
  return adjustments;
}

/**
 * Get learning engine report.
 */
function getReport() {
  const rates = getSuccessRates();
  const lessons = loadLessons();
  const outcomes = loadOutcomes();
  return {
    totalMissions: outcomes.length,
    totalSuccess: outcomes.filter(o => o.success).length,
    overallRate: outcomes.length > 0 ? Math.round((outcomes.filter(o => o.success).length / outcomes.length) * 100) : 0,
    taskRates: rates,
    lessons: lessons.rules,
    adjustments: getTaskAdjustments()
  };
}

let learningInterval = null;
const LEARNING_INTERVAL_MS = 60 * 60 * 1000; // 60 phút

function runLearningCycle() {
  try {
    const outcomes = loadOutcomes();
    if (outcomes.length === 0) { log('No outcomes yet — skipping'); return; }
    const lessons = analyzePatterns(outcomes);
    const rates = getSuccessRates();
    const taskCount = Object.keys(rates).length;
    const ok = outcomes.filter(o => o.success).length;
    const rate = Math.round((ok / outcomes.length) * 100);
    log(`Cycle: ${outcomes.length} missions, ${rate}% success, ${taskCount} types, ${lessons.rules.length} lessons`);
  } catch (e) {
    log(`Learning cycle error: ${e.message}`);
  }
}

function startLearningEngine() {
  if (learningInterval) return;
  log('Learning Engine started (AGI L5 — Yong Jian 用間)');
  runLearningCycle();
  learningInterval = setInterval(runLearningCycle, LEARNING_INTERVAL_MS);
}

function stopLearningEngine() {
  if (learningInterval) { clearInterval(learningInterval); learningInterval = null; log('Learning Engine stopped'); }
}

/**
 * Get avoid patterns list for AGI scoring.
 * Returns array of task IDs that should be avoided (< 30% success, 3+ runs).
 */
function getAvoidPatterns() {
  const lessons = loadLessons();
  return (lessons.rules || []).filter(r => r.startsWith('AVOID:')).map(r => r.split('—')[0].replace('AVOID:', '').trim());
}

/**
 * Get adaptive dispatch hints based on learned patterns.
 * Returns timeout/complexity adjustments for a given task type.
 * @param {string} taskContent - Mission content text
 * @returns {{ timeoutMultiplier: number, shouldSkip: boolean, preferredIntent: string|null, reason: string }}
 */
function getDispatchHints(taskContent) {
  const lowerContent = (taskContent || '').toLowerCase().slice(0, 100);
  const adjustments = getTaskAdjustments();
  const lessons = loadLessons();

  // Check if any AVOID rules match this task content
  const avoidPatterns = getAvoidPatterns();
  for (const pattern of avoidPatterns) {
    if (lowerContent.includes(pattern.toLowerCase())) {
      return { timeoutMultiplier: 0, shouldSkip: true, preferredIntent: null, reason: `AVOID: ${pattern} — historical success <30%` };
    }
  }

  // Check if any DEPRIORITIZE rules match (0 changes repeatedly)
  const deprioritized = (lessons.rules || []).filter(r => r.startsWith('DEPRIORITIZE:'));
  for (const rule of deprioritized) {
    const taskId = rule.split('—')[0].replace('DEPRIORITIZE:', '').trim();
    if (lowerContent.includes(taskId.toLowerCase())) {
      return { timeoutMultiplier: 0.5, shouldSkip: false, preferredIntent: null, reason: `DEPRIORITIZE: ${taskId} — diminishing returns` };
    }
  }

  // Success rate-based timeout adjustment
  const rates = getSuccessRates();
  for (const [taskId, stats] of Object.entries(rates)) {
    if (lowerContent.includes(taskId.toLowerCase())) {
      if (stats.runs >= 3 && stats.rate > 80) {
        return { timeoutMultiplier: 0.8, shouldSkip: false, preferredIntent: null, reason: `High success (${stats.rate}%) — optimized timeout` };
      }
      if (stats.runs >= 3 && stats.avgTime > 1800) {
        return { timeoutMultiplier: 1.5, shouldSkip: false, preferredIntent: 'PLAN', reason: `Slow task (avg ${stats.avgTime}s) — extended timeout + PLAN intent` };
      }
    }
  }

  return { timeoutMultiplier: 1.0, shouldSkip: false, preferredIntent: null, reason: 'No learned pattern' };
}

/**
 * Get project health score (0-100) based on mission outcomes per project.
 * @param {string} project - Project name
 * @returns {{ score: number, totalMissions: number, successRate: number, avgTime: number }}
 */
function getProjectHealthScore(project) {
  const outcomes = loadOutcomes().filter(o => o.project === project);
  if (outcomes.length === 0) return { score: 50, totalMissions: 0, successRate: 0, avgTime: 0 };

  const recent = outcomes.slice(-20); // Last 20 missions
  const successes = recent.filter(o => o.success).length;
  const successRate = Math.round((successes / recent.length) * 100);
  const avgTime = Math.round(recent.reduce((sum, o) => sum + (o.elapsedSec || 0), 0) / recent.length);
  const avgFiles = Math.round(recent.reduce((sum, o) => sum + (o.filesChanged || 0), 0) / recent.length);

  // Score = weighted: 50% success rate + 30% productivity (files) + 20% efficiency (time < 30min)
  const timeScore = avgTime < 1800 ? 100 : avgTime < 3600 ? 60 : 30;
  const fileScore = Math.min(avgFiles * 20, 100);
  const score = Math.round(successRate * 0.5 + fileScore * 0.3 + timeScore * 0.2);

  return { score, totalMissions: recent.length, successRate, avgTime };
}

/**
 * Record post-mission feedback for strategy refinement.
 * Called after task completion with build status + git diff summary.
 * @param {string} taskId
 * @param {{ buildPassed: boolean, filesChanged: number, linesChanged: number }} feedback
 */
function recordMissionFeedback(taskId, feedback) {
  const lessons = loadLessons();
  if (!lessons.feedback) lessons.feedback = [];
  lessons.feedback.push({
    taskId, ...feedback,
    timestamp: new Date().toISOString()
  });
  // Keep last 100 feedbacks
  if (lessons.feedback.length > 100) lessons.feedback = lessons.feedback.slice(-100);
  saveLessons(lessons);
  log(`FEEDBACK: ${taskId} — build:${feedback.buildPassed ? '✅' : '❌'} files:${feedback.filesChanged} lines:${feedback.linesChanged}`);
}

module.exports = { recordOutcome, getSuccessRates, getTaskAdjustments, getReport, analyzePatterns, startLearningEngine, stopLearningEngine, getAvoidPatterns, getDispatchHints, getProjectHealthScore, recordMissionFeedback };
