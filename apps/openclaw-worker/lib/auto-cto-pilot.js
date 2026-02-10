/**
 * Auto-CTO Pilot — Sequential per-project Binh Phap task generation
 *
 * When queue is empty for AUTO_CTO_EMPTY_THRESHOLD polls:
 *   1. Find current project (first with incomplete tasks)
 *   2. Generate next incomplete task for that project
 *   3. Only move to next project when ALL 9 tasks complete
 *   4. Skip non-existent project dirs, skip inapplicable tasks
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');
const { log, isBrainAlive } = require('./brain-tmux');
const { isQueueEmpty } = require('./task-queue');
const { classifyComplexity, generateMissionPrompt } = require('./mission-complexity-classifier');
const { isOverheating } = require('./m1-cooling-daemon');

let emptyQueueCount = 0;
let intervalRef = null;

function loadState() {
  try {
    if (fs.existsSync(config.STATE_FILE)) {
      return JSON.parse(fs.readFileSync(config.STATE_FILE, 'utf-8'));
    }
  } catch(e) {}
  return { completedTasks: {}, currentProjectIdx: 0 };
}

function saveState(state) {
  try { fs.writeFileSync(config.STATE_FILE, JSON.stringify(state, null, 2)); } catch(e) {}
}

// Check if project uses TypeScript (has tsconfig.json or .ts/.tsx files)
function hasTypeScript(projectDir) {
  if (fs.existsSync(path.join(projectDir, 'tsconfig.json'))) return true;
  try {
    const src = path.join(projectDir, 'src');
    if (fs.existsSync(src)) {
      const files = fs.readdirSync(src, { recursive: true });
      return files.some(f => /\.(ts|tsx)$/.test(f));
    }
  } catch(e) {}
  return false;
}

// Check if project uses i18n (has locales/i18n dir or i18n packages)
function hasI18n(projectDir) {
  const i18nDirs = ['locales', 'i18n', 'src/locales', 'src/i18n', 'src/lib/i18n'];
  for (const dir of i18nDirs) {
    if (fs.existsSync(path.join(projectDir, dir))) return true;
  }
  try {
    const pkgPath = path.join(projectDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      return Object.keys(deps).some(d => d.includes('i18n') || d.includes('intl'));
    }
  } catch(e) {}
  return false;
}

// Check if a task is applicable to a project
function isTaskApplicable(taskId, projectDir) {
  if (taskId === 'type_safety' && !hasTypeScript(projectDir)) return false;
  if (taskId === 'i18n_sync' && !hasI18n(projectDir)) return false;
  return true;
}

function startAutoCTO() {
  intervalRef = setInterval(() => {
    try {
      const tasks = fs.readdirSync(config.WATCH_DIR).filter(f => config.TASK_PATTERN.test(f));
      if (tasks.length === 0 && isQueueEmpty()) {
        emptyQueueCount++;
        if (emptyQueueCount >= config.AUTO_CTO_EMPTY_THRESHOLD) {
          emptyQueueCount = 0;
          if (!isBrainAlive()) {
            log('AUTO-CTO: Brain not alive — skipping task generation');
            return;
          }
          if (isOverheating()) {
            log('AUTO-CTO: System overheating — skipping task generation');
            return;
          }
          generateNextTask();
        }
      } else {
        emptyQueueCount = 0;
      }
    } catch (e) {}
  }, 5000);
}

function stopAutoCTO() {
  if (intervalRef) {
    clearInterval(intervalRef);
    intervalRef = null;
  }
}

function generateNextTask() {
  try {
    const state = loadState();
    if (!state.completedTasks) state.completedTasks = {};
    if (typeof state.currentProjectIdx !== 'number') state.currentProjectIdx = 0;

    // Sequential: find first project with incomplete tasks
    const startIdx = state.currentProjectIdx;
    let searched = 0;

    while (searched < config.PROJECTS.length) {
      const idx = (startIdx + searched) % config.PROJECTS.length;
      const project = config.PROJECTS[idx];
      const projectDir = path.join(config.MEKONG_DIR, 'apps', project);

      // Skip non-existent projects
      if (!fs.existsSync(projectDir)) {
        log(`AUTO-CTO: Skipping ${project} — directory not found`);
        searched++;
        continue;
      }

      if (!state.completedTasks[project]) state.completedTasks[project] = [];

      // Find next incomplete, applicable task for this project
      const nextTask = config.BINH_PHAP_TASKS.find(t => {
        if (state.completedTasks[project].includes(t.id)) return false;
        if (!isTaskApplicable(t.id, projectDir)) {
          // Mark inapplicable tasks as completed so we skip them
          state.completedTasks[project].push(t.id);
          log(`AUTO-CTO: Skipping ${t.id} for ${project} — not applicable`);
          return false;
        }
        return true;
      });

      if (nextTask) {
        // Found a task — generate mission file
        state.currentProjectIdx = idx;
        const complexity = classifyComplexity(nextTask, project);
        const missionPrompt = generateMissionPrompt(nextTask, project, complexity);
        const filename = `mission_${project.replace(/-/g, '_')}_auto_${nextTask.id}.txt`;
        fs.writeFileSync(path.join(config.WATCH_DIR, filename), missionPrompt);
        state.completedTasks[project].push(nextTask.id);
        log(`AUTO-CTO: Generated ${nextTask.id} for ${project} [${complexity.toUpperCase()}] (${state.completedTasks[project].length}/${config.BINH_PHAP_TASKS.length} done)`);
        saveState(state);
        return;
      }

      // All tasks done for this project — move to next
      log(`AUTO-CTO: All tasks complete for ${project} — advancing to next project`);
      state.currentProjectIdx = (idx + 1) % config.PROJECTS.length;
      searched++;
    }

    // All projects, all tasks done
    log('AUTO-CTO: All Binh Phap tasks complete for all projects!');
    saveState(state);
  } catch (error) {
    log(`AUTO-CTO error: ${error.message}`);
  }
}

module.exports = { startAutoCTO, stopAutoCTO };
