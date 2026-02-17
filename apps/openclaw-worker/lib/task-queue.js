const fs = require('fs');
const path = require('path');
const config = require('../config');
const { log } = require('./brain-process-manager');
const { executeTask, detectProjectDir } = require('./mission-dispatcher');
const { classifyContentTimeout } = require('./mission-complexity-classifier');
const { pauseIfOverheating, waitForSafeTemperature } = require('./m1-cooling-daemon');
const { runPostMissionGate } = require('./post-mission-gate');
const { recordMission, countTokensBetween } = require('./mission-journal');
const { reflectOnMission } = require('./post-mortem-reflector');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

let isProcessing = false;
let currentTaskFile = null;
const queue = [];
const processingSet = new Set(); // 🔒 Track files being processed to prevent re-enqueue
let pollIntervalRef = null;
let watcher = null;

async function processQueue() {
  if (isProcessing || queue.length === 0) return;
  isProcessing = true;

  // NOTE: Thermal gate removed here — brain-tmux.runMission() handles it.
  // Double thermal gate caused CTO to freeze indefinitely.

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
    const startTime = Date.now();
    const result = await executeTask(content, taskFile, timeout, complexity);
    const durationMs = Date.now() - startTime;

    // 🔒 If mission was BLOCKED (not executed), wait for active mission to finish
    if (result && (result.result === 'mission_locked' || result.result === 'busy_blocked')) {
      // RE-ENQUEUE instead of archive — task was never executed!
      log(`BLOCKED: ${taskFile} — re-enqueueing (will retry in 30s)`);
      processingSet.delete(taskFile);
      await sleep(30000); // Wait 30s before retry
      queue.push(taskFile); // Put back in queue
    } else {
      let buildResult = { build: false, output: 'not_run' };
      const projectMatch = taskFile.match(/^(?:HIGH_|MEDIUM_|LOW_|CRITICAL_)?mission_([a-z0-9_-]+?)_(?:auto_)?/i);
      const projectShortName = projectMatch ? projectMatch[1].replace(/_/g, '-') : null;
      const projectDir = detectProjectDir(content);
      const missionId = taskFile.replace(/^.*?_auto_/, '').replace('.txt', '');

      // === 軍形 CI/CD GATE (Ch.4: 先為不可勝) ===
      if (result && result.success && projectDir) {
        log(`GATE: AGI Level 3 verify for ${missionId} in ${projectDir}...`);
        buildResult = await runPostMissionGate(projectDir, missionId);
      }

      // === 用間 JOURNAL (Ch.13: 知彼知己) ===
      const { tokens } = countTokensBetween(startTime, Date.now());
      await recordMission({
        project: projectShortName || 'unknown',
        missionId,
        taskFile,
        success: !!(result && result.success),
        duration: durationMs,
        buildResult,
        tokensUsed: tokens
      });

      // === 回光返照 POST-MORTEM (AGI Evolution — Persistent Learning) ===
      await reflectOnMission({
        project: projectShortName || 'unknown',
        missionId,
        success: !!(result && result.success),
        duration: durationMs,
        tokensUsed: tokens,
        buildResult,
        content
      });

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
