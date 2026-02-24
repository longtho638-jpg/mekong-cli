/**
 * evolution-engine.js — AGI Level 6: Self-Evolving CTO
 * 
 * 九地 Ch.11: 投之亡地然後存 — Throw into danger, then survive
 * 
 * Makes CTO capable of:
 * 1. Creating new skills from failure patterns
 * 2. Optimizing token routing based on history
 * 3. Triggering brain surgery when health degrades
 * 4. Scoring AGI maturity (0-100)
 * 
 * @version 1.0.0
 * @since 2026-02-18
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

const DATA_DIR = path.join(__dirname, '..', 'data');
const EVOLUTION_STATE_FILE = path.join(DATA_DIR, 'evolution-state.json');
const HISTORY_FILE = path.join(DATA_DIR, 'mission-history.json');
const INSIGHTS_FILE = path.join(DATA_DIR, 'learning-insights.json');
const SKILLS_DIR = path.join(__dirname, '..', '..', '..', '.claude', 'skills');
const TASKS_DIR = config.TASKS_DIR || path.join(__dirname, '..', '..', '..', 'tasks');

function log(msg) {
  const ts = new Date().toLocaleTimeString('en-GB');
  const line = `[${ts}] [tom-hum] [EVOLUTION] ${msg}`;
  console.log(line);
  try {
    const logFile = process.env.TOM_HUM_LOG || path.join(process.env.HOME, 'tom_hum_cto.log');
    fs.appendFileSync(logFile, line + '\n');
  } catch { }
}

// --- State Management ---

function loadState() {
  try {
    if (fs.existsSync(EVOLUTION_STATE_FILE)) {
      return JSON.parse(fs.readFileSync(EVOLUTION_STATE_FILE, 'utf-8'));
    }
  } catch { }
  return {
    lastEvolutionCheck: null,
    skillsCreated: 0,
    brainSurgeriesTriggered: 0,
    tokenOptimizations: 0,
    evolutionScore: 0,
    failurePatterns: {},
    createdSkills: [],
  };
}

function saveState(state) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(EVOLUTION_STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) {
    log(`Failed to save state: ${e.message}`);
  }
}

function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    }
  } catch { }
  return [];
}

function loadInsights() {
  try {
    if (fs.existsSync(INSIGHTS_FILE)) {
      return JSON.parse(fs.readFileSync(INSIGHTS_FILE, 'utf-8'));
    }
  } catch { }
  return {};
}

// --- Evolution Triggers ---

/**
 * Check if self-improvement is needed (runs every 2h)
 * Analyzes mission history for degradation patterns
 */
function checkEvolutionTriggers() {
  const state = loadState();
  const now = Date.now();
  const TWO_HOURS = 2 * 60 * 60 * 1000;

  // Gate: only run every 2 hours
  if (state.lastEvolutionCheck && (now - new Date(state.lastEvolutionCheck).getTime()) < TWO_HOURS) {
    return { triggered: false, reason: 'cooldown' };
  }

  const history = loadHistory();
  if (history.length < 5) {
    return { triggered: false, reason: 'insufficient_data' };
  }

  const triggers = [];

  // 🧬 BRAIN SURGERY v32: Exclude benign failures from all metrics
  // duplicate_rejected = dedup working correctly (not a bug worth tracking)
  const BENIGN_FAILURES = new Set(['duplicate_rejected', 'all_workers_busy', 'mission_locked', 'busy_blocked']);

  // 1. Check overall success rate (exclude benign failures from denominator)
  const recent = history.slice(-20);
  const recentActual = recent.filter(m => {
    if (m.success) return true;
    const key = m.failureType || m.resultCode || m.buildResult?.output || '';
    return !BENIGN_FAILURES.has(key);
  });
  const successes = recentActual.filter(m => m.success).length;
  const successRate = recentActual.length > 0 ? successes / recentActual.length : 1;

  if (successRate < 0.7 && recentActual.length >= 5) {
    triggers.push({
      type: 'low_success_rate',
      severity: Math.round((1 - successRate) * 100),
      detail: `Success rate ${Math.round(successRate * 100)}% (${successes}/${recentActual.length} actual missions, excl. benign)`,
    });
  }

  // 2. Check for repeated failure patterns
  // Reuse BENIGN_FAILURES from above — only track actionable failures
  const failureCounts = {};
  recent.filter(m => !m.success).forEach(m => {
    // 🧬 BRAIN SURGERY v32: Priority failureType → resultCode → buildResult.output → 'unknown'
    // Most history entries only have buildResult.output (not failureType) — must read it too
    const key = m.failureType || m.resultCode || m.buildResult?.output || m.task?.split('_')[0] || 'unknown';
    if (!BENIGN_FAILURES.has(key)) {
      failureCounts[key] = (failureCounts[key] || 0) + 1;
    }
  });

  for (const [pattern, count] of Object.entries(failureCounts)) {
    if (count >= 3) {
      triggers.push({
        type: 'repeated_failure',
        severity: count * 20,
        detail: `"${pattern}" failed ${count} times in last ${recent.length} missions`,
        pattern,
      });
    }
  }

  // 3. Check token efficiency trend
  const tokensUsed = recent.filter(m => m.tokens > 0).map(m => m.tokens);
  if (tokensUsed.length >= 5) {
    const avgRecent = tokensUsed.slice(-5).reduce((a, b) => a + b, 0) / 5;
    const avgOlder = tokensUsed.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
    if (avgOlder > 0 && avgRecent > avgOlder * 1.5) {
      triggers.push({
        type: 'token_bloat',
        severity: 40,
        detail: `Token usage increased ${Math.round((avgRecent / avgOlder - 1) * 100)}%`,
      });
    }
  }

  state.lastEvolutionCheck = new Date().toISOString();
  state.failurePatterns = failureCounts;

  if (triggers.length > 0) {
    log(`🧬 ${triggers.length} evolution triggers detected:`);
    triggers.forEach(t => log(`  → ${t.type}: ${t.detail} (severity: ${t.severity})`));

    // Auto-generate brain surgery if severe
    const maxSeverity = Math.max(...triggers.map(t => t.severity));
    if (maxSeverity >= 60) {
      triggerBrainSurgery(triggers, state);
    }

    // Auto-generate skills for repeated failures
    triggers.filter(t => t.type === 'repeated_failure' && t.pattern).forEach(t => {
      generateSkill(t.pattern, state);
    });
  }

  // Update evolution score
  state.evolutionScore = getEvolutionScore(history, state);
  saveState(state);

  return { triggered: triggers.length > 0, triggers, score: state.evolutionScore };
}

// --- Skill Generator ---

/**
 * Create a new skill from a repeated failure pattern
 * Maps failure → knowledge → prevention
 */
function generateSkill(failurePattern, state) {
  const skillName = `auto-fix-${failurePattern.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;

  // Don't create duplicate skills
  if (state.createdSkills && state.createdSkills.includes(skillName)) {
    log(`Skill "${skillName}" already exists — skipping`);
    return;
  }

  const skillDir = path.join(SKILLS_DIR, skillName);
  const skillFile = path.join(skillDir, 'SKILL.md');

  try {
    if (!fs.existsSync(skillDir)) fs.mkdirSync(skillDir, { recursive: true });

    const insights = loadInsights();
    const relatedInsight = insights[failurePattern] || {};

    const content = `---
name: ${skillName}
description: Auto-generated skill to prevent "${failurePattern}" failures. Created by AGI Level 6 Evolution Engine.
---

# ${skillName}

> 🧬 Auto-generated by Evolution Engine on ${new Date().toISOString().split('T')[0]}
> Pattern: "${failurePattern}" — detected ${state.failurePatterns[failurePattern] || 0} failures

## Problem
Repeated "${failurePattern}" failures detected in mission history.

## Prevention Rules
1. Before starting a "${failurePattern}" task, check prerequisites
2. Use \`/plan:hard\` instead of \`/cook\` for complex ${failurePattern} tasks
3. Run build verification BEFORE making changes
4. If the first attempt fails, analyze the error before retrying

## Known Gotchas
${relatedInsight.lessons ? relatedInsight.lessons.map(l => `- ${l}`).join('\n') : '- No specific lessons recorded yet'}

## Recovery
If "${failurePattern}" mission fails:
1. Check build output for specific error
2. Revert changes: \`git checkout .\`
3. Re-analyze with smaller scope
`;

    fs.writeFileSync(skillFile, content);
    state.skillsCreated = (state.skillsCreated || 0) + 1;
    if (!state.createdSkills) state.createdSkills = [];
    state.createdSkills.push(skillName);
    log(`🧬 New skill created: ${skillName} (total: ${state.skillsCreated})`);
  } catch (e) {
    log(`Failed to create skill: ${e.message}`);
  }
}

// --- Token Optimizer ---

/**
 * Analyze history and recommend model downgrades for simple tasks
 */
function optimizeTokenRouting() {
  const history = loadHistory();
  if (history.length < 10) return null;

  const recommendations = [];

  // Group by complexity
  const byComplexity = {};
  history.forEach(m => {
    const c = m.complexity || 'unknown';
    if (!byComplexity[c]) byComplexity[c] = [];
    byComplexity[c].push(m);
  });

  // Check if simple tasks use expensive models
  const simple = byComplexity['simple'] || [];
  const simpleWithOpus = simple.filter(m => m.model && m.model.includes('opus'));
  if (simpleWithOpus.length > 3) {
    recommendations.push({
      action: 'downgrade_simple',
      detail: `${simpleWithOpus.length} simple tasks used Opus — switch to Sonnet/Flash`,
      savings: `~${simpleWithOpus.length * 5000} tokens saved`,
    });
  }

  // Check if any task type consistently under-uses timeout
  for (const [complexity, missions] of Object.entries(byComplexity)) {
    const avgDuration = missions.reduce((a, m) => a + (m.duration || 0), 0) / missions.length;
    const timeout = config.TIMEOUTS?.[complexity] || config.DEFAULT_TIMEOUT_MS || 1800000;
    if (avgDuration < timeout * 0.3 && missions.length >= 5) {
      recommendations.push({
        action: 'reduce_timeout',
        detail: `${complexity} missions avg ${Math.round(avgDuration / 60000)}min but timeout is ${Math.round(timeout / 60000)}min`,
        savings: `Faster failure detection`,
      });
    }
  }

  if (recommendations.length > 0) {
    log(`💰 Token optimizations found:`);
    recommendations.forEach(r => log(`  → ${r.action}: ${r.detail}`));
  }

  return recommendations;
}

/**
 * Generate CRITICAL brain surgery mission when health is degraded
 * 🔥LỬA (風林火山): /cook --parallel --auto — Agent Teams parallel execution
 * CẤM raw text — PHẢI dùng ClaudeKit command (IRON RULE Chairman 2026-02-17)
 */
function triggerBrainSurgery(triggers, state) {
  // 始計: Concise trigger summary for ClaudeKit prompt
  const triggerSummary = triggers.map(t => `${t.type}: ${t.detail} (sev ${t.severity})`).join('; ');

  // 🔥LỬA ClaudeKit format: /cook --parallel --auto (Agent Teams 10+ subagents)
  const missionContent = `/cook "Trả lời bằng TIẾNG VIỆT. 🧬 BRAIN SURGERY — AGI Level 6 Evolution Engine detected degradation: ${triggerSummary}. Working dir: /Users/macbookprom1/mekong-cli/apps/openclaw-worker. TASKS: (1) Read knowledge/memory.md for post-mortem insights, (2) Identify root cause per trigger in lib/ code, (3) Implement targeted fix — NOT full rewrite, (4) npm run build to verify, (5) git commit '🧬 EVOLUTION: fix summary'. SCOPE: Max 5 files, max 200 lines. Chỉ sửa TỐI ĐA 5 file mỗi mission." --parallel --auto`;

  const taskFile = path.join(TASKS_DIR, `CRITICAL_mission_evolution_surgery_${Date.now()}.txt`);
  try {
    fs.writeFileSync(taskFile, missionContent);
    state.brainSurgeriesTriggered = (state.brainSurgeriesTriggered || 0) + 1;
    log(`🧬 Brain surgery triggered! 🔥LỬA /cook --parallel --auto (total: ${state.brainSurgeriesTriggered}) → ${path.basename(taskFile)}`);
  } catch (e) {
    log(`Failed to trigger brain surgery: ${e.message}`);
  }
}

// --- AGI Maturity Score ---

/**
 * Calculate 0-100 AGI evolution score
 * Based on: success rate, learning, token efficiency, skill count
 */
function getEvolutionScore(history, state) {
  if (!history || history.length === 0) return 0;

  let score = 0;

  // Success rate (0-30 points)
  const recent = history.slice(-50);
  const successRate = recent.filter(m => m.success).length / recent.length;
  score += Math.round(successRate * 30);

  // Learning depth (0-20 points)
  const insights = loadInsights();
  const insightCount = Object.keys(insights).length;
  score += Math.min(20, insightCount * 2);

  // Token efficiency (0-20 points) — lower avg = better
  const tokensUsed = recent.filter(m => m.tokens > 0).map(m => m.tokens);
  if (tokensUsed.length > 0) {
    const avg = tokensUsed.reduce((a, b) => a + b, 0) / tokensUsed.length;
    if (avg < 10000) score += 20;
    else if (avg < 30000) score += 15;
    else if (avg < 50000) score += 10;
    else score += 5;
  }

  // Skills created (0-15 points)
  score += Math.min(15, (state.skillsCreated || 0) * 3);

  // Self-improvement count (0-15 points)
  score += Math.min(15, (state.brainSurgeriesTriggered || 0) * 5);

  return Math.min(100, score);
}

// --- Public API ---

module.exports = {
  checkEvolutionTriggers,
  generateSkill,
  optimizeTokenRouting,
  triggerBrainSurgery,
  getEvolutionScore: () => {
    const state = loadState();
    const history = loadHistory();
    return getEvolutionScore(history, state);
  },
  loadState,
};
