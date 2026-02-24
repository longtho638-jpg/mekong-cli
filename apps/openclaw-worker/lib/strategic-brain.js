/**
 * AGI Level 6: Strategic Brain — 始計 Proactive Mission Generation
 *
 * 📜 Binh Pháp Ch.1 始計: 「未戰而廟算勝者」
 *    "Win before battle through superior planning"
 *
 * When all projects scan GREEN, the CTO doesn't idle — it IMPROVES:
 *   1. Consult learning insights (Level 5 feedback)
 *   2. Pick strategic task weighted by history + priority
 *   3. Generate proactive improvement mission
 *   4. Track outcomes for future optimization
 *
 * Cooldown: 30 min per project prevents token waste (Ch.2 作戰: 日費千金)
 */

const { isQueueEmpty } = require('./task-queue');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { log } = require('./brain-process-manager');

const STRATEGIC_STATE_FILE = path.join(config.MEKONG_DIR, 'apps/openclaw-worker/data/strategic-state.json');
const INSIGHTS_FILE = path.join(config.MEKONG_DIR, 'apps/openclaw-worker/data/learning-insights.json');
const COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes — fast iteration for single-project focus

// Ensure data dir exists
const DATA_DIR = path.dirname(STRATEGIC_STATE_FILE);
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// --- State Management ---

function loadStrategicState() {
  try {
    if (fs.existsSync(STRATEGIC_STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STRATEGIC_STATE_FILE, 'utf-8'));
    }
  } catch (e) { }
  return {};
}

function saveStrategicState(state) {
  try {
    fs.writeFileSync(STRATEGIC_STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) {
    log(`[STRATEGIC] Failed to save state: ${e.message}`);
  }
}

// --- Learning Insights Integration ---

function getFailedTaskIds() {
  try {
    if (!fs.existsSync(INSIGHTS_FILE)) return [];
    const insights = JSON.parse(fs.readFileSync(INSIGHTS_FILE, 'utf-8'));
    // Extract task IDs that frequently fail from insights
    const failureReasons = insights.stats?.failureReasons || [];
    return failureReasons;
  } catch (e) {
    return [];
  }
}

// --- Task Selection (Weighted Random) ---

async function selectStrategicTask(project, projectState, capabilityFilter = () => true) {
  const tasks = config.BINH_PHAP_TASKS.filter(capabilityFilter);
  const taskHistory = projectState.taskHistory || {};
  const failedIds = getFailedTaskIds();

  if (tasks.length === 0) return null;

  // Weight each task: lower count = higher weight, failed tasks get lower weight
  // 🧠 LLM VISION: Try intelligent task selection first
  try {
    const { selectNextTask } = require('./llm-interpreter');
    const llmPick = await selectNextTask(
      state?.currentProject || 'well',
      taskHistory,
      tasks.map(t => ({ id: t.id, cmd: t.cmd, complexity: t.complexity }))
    );
    if (llmPick?.taskId) {
      const found = tasks.find(t => t.id === llmPick.taskId);
      if (found) return found;
    }
  } catch (e) {
    // LLM failed — fall back to weighted random
  }

  // 🧠 LEARNING: Apply adaptive adjustments from past mission outcomes
  let adjustments = {};
  try { adjustments = require('./learning-engine').getTaskAdjustments(); } catch (e) { }

  // Fallback: Weighted random selection (augmented by learning)
  const weighted = tasks.map(task => {
    const runCount = taskHistory[task.id] || 0;
    const isFailed = failedIds.includes(task.id);
    let weight = Math.max(1, 10 - runCount);
    if (isFailed) weight *= 0.3;
    if (task.complexity === 'strategic') weight *= 0.5;
    // Apply learning adjustment (0.1 - 2.0)
    if (adjustments[task.id]) weight *= adjustments[task.id];
    return { task, weight };
  });

  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;

  for (const { task, weight } of weighted) {
    random -= weight;
    if (random <= 0) return task;
  }

  return tasks[0];
}

// --- Claude Engineer Workflow (injected into every mission) ---
const WORKFLOW_RULES = `
WORKFLOW ORCHESTRATION (MANDATORY):
1. PLAN MODE DEFAULT: Enter plan mode for ANY non-trivial task (3+ steps). If something goes sideways, STOP and re-plan. Write detailed specs upfront.
2. SUBAGENT STRATEGY: Use subagents liberally. Offload research/exploration/analysis to subagents. One task per subagent for focused execution.
3. SELF-IMPROVEMENT LOOP: After ANY correction, update tasks/lessons.md. Write rules that prevent the same mistake. Review lessons at session start.
4. VERIFICATION BEFORE DONE: Never mark a task complete without proving it works. Run tests, check logs, demonstrate correctness. Ask "Would a staff engineer approve this?"
5. DEMAND ELEGANCE: For non-trivial changes, pause and ask "is there a more elegant way?" If a fix feels hacky, implement the elegant solution. Skip this for simple, obvious fixes.
6. AUTONOMOUS BUG FIXING: When given a bug report, just fix it. Point at logs/errors/failing tests then resolve them. Zero context switching from the user.

TASK MANAGEMENT:
1. Plan First: Write plan to tasks/todo.md with checkable items
2. Track Progress: Mark items complete as you go
3. Explain Changes: High-level summary at each step
4. Document Results: Add review section to tasks/todo.md
5. Capture Lessons: Update tasks/lessons.md after corrections

CORE PRINCIPLES:
- Simplicity First: Make every change as simple as possible. Minimal code impact.
- No Laziness: Find root causes. No temporary fixes. Senior developer standards.
- Minimal Impact: Changes should only touch what is necessary. Avoid introducing bugs.
`.trim();

// --- Mission Generation ---

function generateStrategicMission(task, project) {
  const timestamp = Date.now();
  const filename = `HIGH_mission_strategic_${task.id}_${project}_${timestamp}.txt`;
  const prompt = `COMPLEXITY: ${task.complexity || 'complex'}
PROJECT: ${project}

AGI LEVEL 6 — STRATEGIC MISSION (Proactive Improvement)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${WORKFLOW_RULES}

/cook "${task.cmd}

Project: ${project}
Context: Autonomously generated by Strategic Brain (Level 6 AGI).
This is a PROACTIVE improvement — no errors triggered this mission.
Focus on measurable improvements. Report findings clearly.
Respond in TIẾNG VIỆT." --auto
`;

  return { filename, prompt };
}

// --- Main Entry Point ---

/**
 * Try to dispatch a strategic mission for a GREEN project.
 * Called by auto-cto-pilot when handleScan finds 0 errors.
 *
 * @param {Object} state - auto-cto state object
 * @param {string} project - project name
 * @param {string} projectDir - project directory path
 * @returns {boolean} true if a mission was dispatched
 */
async function tryStrategicMission(state, project, projectDir) {
  const strategicState = loadStrategicState();
  const projectState = strategicState[project] || {
    lastStrategicAt: null,
    taskHistory: {},
    totalStrategic: 0
  };

  // Cooldown gate: 30 min between strategic missions per project
  if (projectState.lastStrategicAt) {
    const elapsed = Date.now() - new Date(projectState.lastStrategicAt).getTime();
    if (elapsed < COOLDOWN_MS) {
      const remaining = Math.round((COOLDOWN_MS - elapsed) / 60000);
      log(`[STRATEGIC] ${project} — cooldown active (${remaining}min remaining). Skipping.`);
      return false;
    }
  }

  // 🦞 FIX 2026-02-24: Check BOTH filesystem tasks AND active missions in queue
  const tasks = fs.readdirSync(config.WATCH_DIR).filter(f => config.TASK_PATTERN.test(f));
  if (tasks.length > 0 || !isQueueEmpty()) {
    log(`[STRATEGIC] ${project} — queue busy (${tasks.length} files, queueEmpty=${isQueueEmpty()}). Skipping.`);
    return false;
  }

  // Check project capabilities (e.g. skip test_suite if no test script)
  const pkgPath = path.join(projectDir, 'package.json');
  let projectScripts = {};
  try {
    if (fs.existsSync(pkgPath)) {
      projectScripts = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')).scripts || {};
    }
  } catch (e) { }

  // Select best task for this project (filter by capability)
  const capabilityFilter = (task) => {
    if (task.id === 'test_suite' && !projectScripts.test) return false;
    if (task.id === 'i18n_sync' && !fs.existsSync(path.join(projectDir, 'src/i18n')) && !fs.existsSync(path.join(projectDir, 'i18n'))) return false;
    return true;
  };
  const selectedTask = await selectStrategicTask(project, projectState, capabilityFilter);
  if (!selectedTask) {
    log(`[STRATEGIC] ${project} — no applicable tasks for this project's capabilities. Skipping.`);
    return false;
  }

  // 🧠 AGI Level 9: Every 5th mission, generate a CUSTOM mission via LLM
  const useCustomMission = (projectState.totalStrategic + 1) % 5 === 0;
  let filename, prompt;

  if (useCustomMission) {
    try {
      const { generateCustomMission } = require('./mission-generator');
      const { getReport } = require('./learning-engine');
      const learningReport = getReport();
      const customTask = await generateCustomMission(projectDir, learningReport);
      if (customTask?.cmd) {
        const ts = Date.now();
        filename = `HIGH_mission_custom_${project}_${ts}.txt`;
        prompt = `COMPLEXITY: medium
PROJECT: ${project}

AGI LEVEL 9 — CUSTOM MISSION (LLM-Generated)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${WORKFLOW_RULES}

/cook "${customTask.cmd}

Project: ${project}
Context: Generated by CTO's Mission Generator (Level 9 AGI).
Reason: ${customTask.reason || 'LLM-identified improvement'}
Focus on measurable improvements. Max 5 files.
Respond in TIẾNG VIỆT." --auto
`;
        log(`[STRATEGIC] 🧠 Level 9 — CUSTOM MISSION: "${customTask.cmd}" for ${project}`);
      }
    } catch (e) {
      log(`[STRATEGIC] Custom mission gen failed: ${e.message}`);
    }
  }

  // Fallback: use static task selection
  if (!filename) {
    ({ filename, prompt } = generateStrategicMission(selectedTask, project));
  }

  // 🌐 GOOGLE ULTRA: Gather ecosystem intel before dispatching
  let googleIntel = '';
  try {
    const { gatherProjectIntel } = require('./google-ultra');
    const intel = await gatherProjectIntel(project);
    if (intel && !intel.error) {
      const driveFiles = (intel.drive || []).map(f => `📄 ${f.name} (${f.mimeType})`).join(', ');
      const emails = (intel.emails || []).length;
      const events = (intel.calendar || []).length;
      if (driveFiles || emails || events) {
        googleIntel = `
GOOGLE ULTRA INTEL (searched Drive/Gmail/Calendar):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${driveFiles ? `DRIVE: ${driveFiles}` : ''}
${emails ? `GMAIL: ${emails} relevant discussions found` : ''}
${events ? `CALENDAR: ${events} upcoming events` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
        log(`[STRATEGIC] [GOOGLE-ULTRA] Intel gathered: ${(intel.drive || []).length} drive files, ${emails} emails, ${events} events`);
      }
    }
  } catch (e) {
    log(`[STRATEGIC] Google Ultra intel failed: ${e.message}`);
  }

  // Inject Google intel into mission prompt
  if (googleIntel) prompt = prompt + '\n' + googleIntel;

  // 🦞 RE-ENABLED 2026-02-24: Deep 10x scanning for WellNexus zero-bug target
  const missionPath = path.join(config.WATCH_DIR, filename);
  fs.writeFileSync(missionPath, prompt);

  // Update strategic state
  projectState.lastStrategicAt = new Date().toISOString();
  projectState.taskHistory[selectedTask.id] = (projectState.taskHistory[selectedTask.id] || 0) + 1;
  projectState.totalStrategic++;
  strategicState[project] = projectState;
  saveStrategicState(strategicState);

  log(`[STRATEGIC] 🧠 Level ${useCustomMission ? '9' : '8'} — Dispatched: ${useCustomMission ? 'CUSTOM' : selectedTask.id} for ${project} (total: ${projectState.totalStrategic})`);

  return true;
}

module.exports = { tryStrategicMission };
