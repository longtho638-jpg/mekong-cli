const fs = require('fs');
const path = require('path');
const config = require('../config');
const { log } = require('./brain-tmux');
const { executeTask, detectProjectDir } = require('./mission-dispatcher');
const { classifyContentTimeout } = require('./mission-complexity-classifier');
const { pauseIfOverheating, waitForSafeTemperature } = require('./m1-cooling-daemon');
const { runFullGate } = require('./post-mission-gate');

let isProcessing = false;
let currentTaskFile = null;
const queue = [];
const processingSet = new Set(); // 🔒 Track files being processed to prevent re-enqueue
let pollIntervalRef = null;
let watcher = null;

async function processQueue() {
  if (isProcessing || queue.length === 0) return;
  isProcessing = true;

  // Thermal gate: block until system is cool enough
  await pauseIfOverheating();
  await waitForSafeTemperature();

  const taskFile = queue.shift();
  currentTaskFile = taskFile;
  processingSet.add(taskFile); // 🔒 Mark as processing
  const filePath = path.join(config.WATCH_DIR, taskFile);

  try {
    if (!fs.existsSync(filePath)) {
      log(`Ghost file ignored: ${taskFile}`);
      return;
    }
    const content = fs.readFileSync(filePath, 'utf-8').trim();
    const { complexity, timeout } = classifyContentTimeout(content);
    log(`EXECUTING [${complexity.toUpperCase()}/${Math.round(timeout / 60000)}min]: ${taskFile}`);
    // 🔒 If mission was BLOCKED (not executed), keep file for retry
    if (result && (result.result === 'mission_locked' || result.result === 'busy_blocked')) {
      log(`RETRY: ${taskFile} — mission was blocked, keeping in queue for next cycle`);
      // DO NOT archive — file stays in tasks/ for next dispatch
    } else {
      // === 軍形 CI/CD GATE (Ch.4: 先為不可勝) ===
      if (result && result.success) {
        const projectMatch = taskFile.match(/^(?:HIGH_|MEDIUM_|LOW_|CRITICAL_)?mission_([a-z0-9_-]+?)_(?:auto_)?/i);
        const project = projectMatch ? projectMatch[1].replace(/_/g, '-') : null;
        const missionId = taskFile.replace(/^.*?_auto_/, '').replace('.txt', '');
        if (project) {
          log(`GATE: 軍形 verify for ${project}/${missionId}...`);
          const gate = runFullGate(project, missionId);
          if (gate.build) {
            log(`GATE: ✅ GREEN — ${gate.pushed ? 'PUSHED' : 'no changes'}`);
          } else {
            log(`GATE: ❌ RED — build failed, NOT pushing`);
          }
        }
      }
      fs.renameSync(filePath, path.join(config.PROCESSED_DIR, taskFile));
      log(`Archived: ${taskFile}`);
    }
  } catch (error) {
    log(`Error processing ${taskFile}: ${error.message}`);
  } finally {
    processingSet.delete(taskFile); // 🔒 Remove from processing set
    currentTaskFile = null;
    isProcessing = false;
    processQueue();
  }
}

function enqueue(filename) {
  if (filename && config.TASK_PATTERN.test(filename)) {
    const filePath = path.join(config.WATCH_DIR, filename);
    if (fs.existsSync(filePath) && !queue.includes(filename) && filename !== currentTaskFile && !processingSet.has(filename)) {
      log(`DETECTED: ${filename}`);
      queue.push(filename);
      processQueue();
    }
  }
}

function startWatching() {
  // Ensure processed dir exists
  if (!fs.existsSync(config.PROCESSED_DIR)) {
    fs.mkdirSync(config.PROCESSED_DIR, { recursive: true });
  }

  // fs.watch for instant detection
  if (fs.existsSync(config.WATCH_DIR)) {
    watcher = fs.watch(config.WATCH_DIR, (eventType, filename) => enqueue(filename));
  }

  // Periodic poll as backup (every 5s) — only log genuinely new tasks
  pollIntervalRef = setInterval(() => {
    try {
      const files = fs.readdirSync(config.WATCH_DIR);
      const tasks = files.filter(f => config.TASK_PATTERN.test(f));
      const newTasks = tasks.filter(f => !queue.includes(f) && f !== currentTaskFile);
      if (newTasks.length > 0) {
        log(`Poll found new: ${newTasks.join(', ')}`);
      }
      tasks.forEach(enqueue);
    } catch (e) { }
  }, config.POLL_INTERVAL_MS); // PROJECT FLASH: 1s Backup Poll
}

function stopWatching() {
  if (pollIntervalRef) {
    clearInterval(pollIntervalRef);
    pollIntervalRef = null;
  }
  if (watcher) {
    watcher.close();
    watcher = null;
  }
}

function isQueueEmpty() { return queue.length === 0 && !isProcessing; }

module.exports = { startWatching, stopWatching, isQueueEmpty, enqueue };
