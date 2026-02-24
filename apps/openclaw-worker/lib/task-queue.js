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

// 🧬 FIX Bug #3: Priority sorting CRITICAL > HIGH > MEDIUM > LOW > (no prefix)
function getPriority(filename) {
  if (filename.startsWith('CRITICAL_')) return 0;
  if (filename.startsWith('HIGH_')) return 1;
  if (filename.startsWith('MEDIUM_')) return 2;
  if (filename.startsWith('LOW_')) return 3;
  return 4; // No prefix = lowest priority
}

const MAX_RETRIES = 5;
const retryCounts = new Map();

let activeCount = 0;
let currentTaskFile = null;
const queue = [];
const queuedSet = new Set(); // 🔒 O(1) Lookup for queued items (Bug #2)
const processingSet = new Set(); // 🔒 Track files being processed to prevent re-enqueue
let pollIntervalRef = null;
let watcher = null;

async function processQueue() {
  // 🧬 FIX Bug #3: Sort queue by priority before processing
  queue.sort((a, b) => getPriority(a) - getPriority(b));

  // Allow up to MAX_CONCURRENT_MISSIONS parallel tasks
  if (activeCount >= config.MAX_CONCURRENT_MISSIONS || queue.length === 0) return;
  activeCount++;

  // NOTE: Thermal gate removed here — brain-process-manager.runMission() handles it.
  // Double thermal gate caused CTO to freeze indefinitely.

  const taskFile = queue.shift();
  queuedSet.delete(taskFile); // 🔒 Remove from deduplication set
  currentTaskFile = taskFile;
  processingSet.add(taskFile); // 🔒 Mark as processing
  const filePath = path.join(config.WATCH_DIR, taskFile);

  try {
    if (!fs.existsSync(filePath)) {
      log(`Ghost file ignored: ${taskFile}`);
      retryCounts.delete(taskFile);
      return;
    }

    // 🧬 BRAIN SURGERY: Recursion Limit (stop infinite fix loops)
    const fixDepth = (taskFile.match(/_fix_/g) || []).length;
    if (fixDepth > 3) {
      log(`🛑 RECURSION LIMIT EXCEEDED: ${taskFile} (Depth ${fixDepth}). Archiving to prevent infinite loop.`);
      fs.renameSync(filePath, path.join(config.PROCESSED_DIR, taskFile));
      retryCounts.delete(taskFile);
      return;
    }
    const content = fs.readFileSync(filePath, 'utf-8').trim();
    const { complexity, timeout } = classifyContentTimeout(content);
    log(`EXECUTING [${complexity.toUpperCase()}/${Math.round(timeout / 60000)}min]: ${taskFile}`);
    const startTime = Date.now();
    const result = await executeTask(content, taskFile, timeout, complexity);
    const durationMs = Date.now() - startTime;

    // 🔒 If mission was BLOCKED (not executed), wait for active mission to finish
    if (result && (result.result === 'mission_locked' || result.result === 'busy_blocked' || result.result === 'all_workers_busy')) {
      const retries = retryCounts.get(taskFile) || 0;

      if (retries >= MAX_RETRIES) {
        log(`BLOCKED: ${taskFile} — MAX RETRIES EXCEEDED (${MAX_RETRIES}). Archiving.`);
        retryCounts.delete(taskFile);

        // Treat as processed (archived) to unblock queue
        if (fs.existsSync(filePath)) {
           fs.renameSync(filePath, path.join(config.PROCESSED_DIR, taskFile));
        }
      } else {
        // RE-ENQUEUE instead of archive — task was never executed!
        retryCounts.set(taskFile, retries + 1);
        log(`BLOCKED: ${taskFile} — re-enqueueing (attempt ${retries + 1}/${MAX_RETRIES}) (will retry in 30s)`);

        // processingSet.delete(taskFile); // REMOVED: Let finally block handle cleanup to avoid ghost state
        await sleep(30000); // Wait 30s before retry
        queue.push(taskFile); // Put back in queue
        queuedSet.add(taskFile); // 🔒 Re-add to set
      }
    } else {
      retryCounts.delete(taskFile); // Reset retries on success/execution

      // 🧬 FIX: init buildResult with actual result reason, not 'not_run' for real failures
      const failReason = (result && !result.success) ? (result.result || 'unknown_failure') : 'not_run';
      let buildResult = { build: false, output: result && result.success ? 'not_run' : failReason };
      // 🧬 FIX: Extract project name — strip priority prefix + 'mission' keyword + trailing identifiers
      const stripped = taskFile.replace(/^(?:HIGH_|MEDIUM_|LOW_|CRITICAL_)/, '').replace(/^mission_/, '');
      // Take first meaningful segment (before numeric IDs or known suffixes)
      const segments = stripped.split('_');
      const projectShortName = segments[0] && segments[0].length > 1 ? segments[0].replace(/-/g, '-') : (segments[1] || 'openclaw');
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
        content,
        resultCode: result ? (result.result || '') : ''  // 🧬 FIX: pass result code for accurate failure classification
      });

      if (fs.existsSync(filePath)) {
        fs.renameSync(filePath, path.join(config.PROCESSED_DIR, taskFile));
        log(`Archived: ${taskFile}`);
      }
    }
  } catch (error) {
    log(`Error processing ${taskFile}: ${error.message}`);
  } finally {
    processingSet.delete(taskFile); // 🔒 Remove from processing set
    currentTaskFile = null;
    activeCount--;
    // Trigger next task if queue has more
    if (queue.length > 0) processQueue();
  }
}

function enqueue(filename) {
  if (filename && config.TASK_PATTERN.test(filename)) {
    const filePath = path.join(config.WATCH_DIR, filename);
    const processedPath = path.join(config.PROCESSED_DIR, filename);
    
    // 🧬 FIX Bug #2: Use queuedSet for O(1) atomic deduplication
    const isDuplicate = queuedSet.has(filename) || processingSet.has(filename) || filename === currentTaskFile;

    if (fs.existsSync(filePath) && !isDuplicate && !fs.existsSync(processedPath)) {
      log(`DETECTED: ${filename}`);
      queue.push(filename);
      queuedSet.add(filename); // 🔒 Add to deduplication set
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
      // 🧬 FIX Bug #2: Check queuedSet instead of O(n) array includes
      const newTasks = tasks.filter(f => !queuedSet.has(f) && !processingSet.has(f) && f !== currentTaskFile);
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

function isQueueEmpty() { return queue.length === 0 && activeCount === 0; }

module.exports = { startWatching, stopWatching, isQueueEmpty, enqueue };
