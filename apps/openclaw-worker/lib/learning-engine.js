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
  const outcome = {
    taskId, project, result,
    success: result === 'done',
    elapsedSec,
    summary: missionSummary?.summary || '',
    filesChanged: missionSummary?.filesChanged || 0,
    timestamp: new Date().toISOString()
  };
  outcomes.push(outcome);
  saveOutcomes(outcomes);
  analyzePatterns(outcomes);
  log(`Recorded: ${taskId} → ${result} (${elapsedSec}s)${outcome.filesChanged ? ` [${outcome.filesChanged} files]` : ''}`);
  return outcome;
}

/**
 * Get success rate per task type.
 */
function getSuccessRates() {
  const outcomes = loadOutcomes();
  const rates = {};
  for (const o of outcomes) {
    if (!rates[o.taskId]) rates[o.taskId] = { runs: 0, successes: 0, rate: 0, avgTime: 0, totalTime: 0, filesChanged: 0, lastRun: null };
    const r = rates[o.taskId];
    r.runs++;
    if (o.success) r.successes++;
    r.totalTime += o.elapsedSec || 0;
    r.avgTime = Math.round(r.totalTime / r.runs);
    r.filesChanged += o.filesChanged || 0;
    r.rate = Math.round((r.successes / r.runs) * 100);
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
 */
function getTaskAdjustments() {
  const rates = getSuccessRates();
  const adjustments = {};
  for (const [taskId, stats] of Object.entries(rates)) {
    let mult = 1.0;
    if (stats.runs >= 3 && stats.rate < 30) mult = 0.1;
    else if (stats.runs >= 3 && stats.rate < 50) mult = 0.3;
    if (stats.runs >= 3 && stats.rate > 80 && stats.filesChanged === 0) mult = 0.2;
    if (stats.runs < 2) mult = 1.5;
    if (stats.filesChanged > 3) mult = Math.min(mult * 1.3, 2.0);
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

module.exports = { recordOutcome, getSuccessRates, getTaskAdjustments, getReport, analyzePatterns, startLearningEngine, stopLearningEngine, getAvoidPatterns };
