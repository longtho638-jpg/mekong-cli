const fs = require('fs');
const path = require('path');
const config = require('../config');
const { log } = require('./brain-tmux');
const { executeTask } = require('./mission-dispatcher');
const { pauseIfOverheating, waitForSafeTemperature } = require('./m1-cooling-daemon');

let isProcessing = false;
let currentTaskFile = null;
const queue = [];
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
  const filePath = path.join(config.WATCH_DIR, taskFile);

  try {
    if (!fs.existsSync(filePath)) {
      log(`Ghost file ignored: ${taskFile}`);
      return;
    }
    const content = fs.readFileSync(filePath, 'utf-8').trim();
    log(`EXECUTING: ${taskFile}`);
    await executeTask(content, taskFile);
    fs.renameSync(filePath, path.join(config.PROCESSED_DIR, taskFile));
    log(`Archived: ${taskFile}`);
  } catch (error) {
    log(`Error processing ${taskFile}: ${error.message}`);
  } finally {
    currentTaskFile = null;
    isProcessing = false;
    processQueue();
  }
}

function enqueue(filename) {
  if (filename && config.TASK_PATTERN.test(filename)) {
    const filePath = path.join(config.WATCH_DIR, filename);
    if (fs.existsSync(filePath) && !queue.includes(filename) && filename !== currentTaskFile) {
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
    } catch (e) {}
  }, 5000);
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
