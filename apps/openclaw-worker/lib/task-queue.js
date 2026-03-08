const fs = require('fs');
const path = require('path');
const config = require('../config');

const DLQ_DIR = path.join(config.WATCH_DIR, 'dead-letter');
const { log } = require('./brain-process-manager');
const { executeTask, detectProjectDir } = require('./mission-dispatcher');
const { classifyContentTimeout } = require('./mission-complexity-classifier');
const { pauseIfOverheating, waitForSafeTemperature } = require('./m1-cooling-daemon');
const { runPostMissionGate } = require('./post-mission-gate');
const { sendRewardSignal } = require('./openclaw-rl-client');
const { recordMission, countTokensBetween } = require('./mission-journal');
const { reflectOnMission } = require('./post-mortem-reflector');
const { updateSessionStats } = require('./self-analyzer');
const { recordEconomicCompletion } = require('./clawwork-integration');
const { postMissionSummary } = require('./moltbook-integration');
const { isTradingMission } = require('./trading-cadence-scheduler');
const { handleTradingMissionCompletion } = require('./trading-post-mission-report-handler');
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
let pollFailCount = 0; // 🦞 FIX BUG #7 2026-02-27: Track poll failures for recovery

function initDLQ() {
  if (!fs.existsSync(DLQ_DIR)) {
    fs.mkdirSync(DLQ_DIR, { recursive: true });
    log(`[QUEUE] Dead letter directory created: ${DLQ_DIR}`);
  }
}

function moveToDeadLetter(taskFile, reason, lastError) {
  const src = path.join(config.WATCH_DIR, taskFile);
  const timestamp = Date.now();
  const dlqName = `dead_${timestamp}_${taskFile}`;
  const dst = path.join(DLQ_DIR, dlqName);
  try {
    const originalContent = fs.readFileSync(src, 'utf8');
    const metadata = JSON.stringify({ originalFile: taskFile, movedAt: new Date().toISOString(), reason, lastError: lastError || 'unknown', retryCount: retryCounts.get(taskFile) || 0 }, null, 2);
    fs.writeFileSync(dst, `--- DEAD LETTER METADATA ---\n${metadata}\n--- ORIGINAL CONTENT ---\n${originalContent}`);
    fs.unlinkSync(src);
    retryCounts.delete(taskFile);
    queuedSet.delete(taskFile);
    processingSet.delete(taskFile);
    log(`[QUEUE] Task moved to dead letter: ${taskFile} → ${dlqName} (reason: ${reason})`);
  } catch (e) {
    log(`[QUEUE] Failed to move to DLQ: ${e.message}`);
  }
}

function getQueueStats() {
  let dlqCount = 0;
  try { dlqCount = fs.readdirSync(DLQ_DIR).filter(f => f.startsWith('dead_')).length; } catch (e) { /* dir may not exist yet */ }
  return { pending: queue.length, active: activeCount, dlqCount };
}

let _processing = false; // 🧬 FIX: Mutex guard against concurrent processQueue() calls

async function processQueue() {
  // 🧬 FIX Bug #13: Prevent race condition — only one processQueue at a time
  if (_processing) return;
  _processing = true;

  try {
    // 🧬 FIX Bug #3: Sort queue by priority before processing
    queue.sort((a, b) => getPriority(a) - getPriority(b));

    // 🥪 DUAL-STREAM FLYWHEEL: Allow 2 concurrent missions (P0 and P1)
    // 🔒 FIX Bug #13: Atomic increment to prevent race condition
    if (incrementingActive || activeCount >= 2 || queue.length === 0) {
      _processing = false;
      return;
    }
    incrementingActive = true;
    activeCount++;
    incrementingActive = false;
  } finally {
    _processing = false;
  }

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

    // 🧬 v32 FIX: Helper to extract project/missionId for journal recording in early-return branches
    const stripped = taskFile.replace(/^(?:HIGH_|MEDIUM_|LOW_|CRITICAL_)/, '').replace(/^mission_/, '');
    const segments = stripped.split('_');
    const projectShortNameEarly = segments[0] && segments[0].length > 1 ? segments[0] : (segments[1] || 'openclaw');
    const missionIdEarly = taskFile.replace(/^.*?_auto_/, '').replace('.txt', '');

    // 🦞 FIX 2026-02-24: Handle CC CLI startup failures and queued message states
    // 💣 FIX 2026-02-27: Handle Nuclear Liquidation (pro_limit_hit)
    if (result && (result.result === 'failed_to_start' || result.result === 'queued_abort' || result.result === 'pro_limit_hit')) {
      const qaRetries = retryCounts.get(taskFile) || 0;
      if (qaRetries >= 3) {
        log(`${result.result.toUpperCase()}: ${taskFile} — max retries (3) exhausted. Archiving.`);
        retryCounts.delete(taskFile);
        // 🧬 v32: Record terminal failures so evolution-engine sees them (not 'unknown')
        await recordMission({ project: projectShortNameEarly, missionId: missionIdEarly, taskFile, success: false, failureType: result.result, duration: durationMs, buildResult: { build: false, output: result.result }, tokensUsed: 0 });
        if (fs.existsSync(filePath)) fs.renameSync(filePath, path.join(config.PROCESSED_DIR, taskFile));
      } else {
        retryCounts.set(taskFile, qaRetries + 1);
        const waitTime = result.result === 'pro_limit_hit' ? 30000 : 120000;
        log(`${result.result.toUpperCase()}: ${taskFile} — CC CLI not ready or rotated. Waiting ${waitTime / 1000}s then retry (${qaRetries + 1}/3).`);
        queuedSet.add(taskFile);
        await sleep(waitTime);
        queue.push(taskFile);
      }
    }

    // 🔒 If mission was BLOCKED (not executed), wait for active mission to finish
    else if (result && (result.result === 'mission_locked' || result.result === 'busy_blocked' || result.result === 'all_workers_busy')) {
      const retries = retryCounts.get(taskFile) || 0;

      if (retries >= MAX_RETRIES) {
        log(`BLOCKED: ${taskFile} — MAX RETRIES EXCEEDED (${MAX_RETRIES}). Archiving.`);
        retryCounts.delete(taskFile);
        // 🧬 v32: Record blocked missions so they appear in journal (benign, not 'unknown')
        await recordMission({ project: projectShortNameEarly, missionId: missionIdEarly, taskFile, success: false, failureType: result.result, duration: durationMs, buildResult: { build: false, output: result.result }, tokensUsed: 0 });
        updateSessionStats({ dispatched: true, lesson: result.result });

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
      const projectIdMatch = taskFile.match(/mission_([^0-9_]+)/i);
      const projectShortName = projectIdMatch ? projectIdMatch[1] : (segments[0] && segments[0].length > 1 ? segments[0] : (segments[1] || 'openclaw'));
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
        failureType: result ? (result.result || 'unknown_failure') : 'no_result',
        duration: durationMs,
        buildResult,
        tokensUsed: tokens
      });

      // === 🧠 CROSS-SESSION MEMORY (AGI L10 — FIX 2026-02-28) ===
      const missionSuccess = !!(result && result.success);
      const isBugFix = /fix|bug|error|broken/i.test(content || '');
      updateSessionStats({
        dispatched: true,
        succeeded: missionSuccess,
        bugFixed: missionSuccess && isBugFix,
        lesson: missionSuccess ? null : (result ? result.result : 'no_result')
      });

      // === 作戰 CLAWWORK: Record economic completion if applicable ===
      const clawworkMatch = (content || '').match(/\[ClawWork:(gdp-\d+)\]/);
      if (clawworkMatch) {
        recordEconomicCompletion(clawworkMatch[1], missionSuccess, Math.round(durationMs / 1000));
      }

      // === 用間 MOLTBOOK: Post mission summary (rate-limited) ===
      postMissionSummary(missionId, projectShortName, missionSuccess, Math.round(durationMs / 1000)).catch(e => {
        log(`[MOLTBOOK] Post failed: ${e.message}`);
      });

      // === 回光返照 POST-MORTEM (AGI Evolution — Persistent Learning) ===
      await reflectOnMission({
        project: projectShortName || 'unknown',
        missionId,
        success: missionSuccess,
        duration: durationMs,
        tokensUsed: tokens,
        buildResult,
        content,
        resultCode: result ? (result.result || '') : ''  // 🧬 FIX: pass result code for accurate failure classification
      });

      // 🏢 TRADING COMPANY: Post-mission report analysis → decision engine
      if (isTradingMission(content)) {
        try {
          const tradingResult = handleTradingMissionCompletion(content, missionSuccess);
          log(`[TRADING-PMH] /trading mission → ${tradingResult.action}: ${tradingResult.reason}${tradingResult.followUpDispatched ? ' [follow-up queued]' : ''}`);
        } catch (e) {
          log(`[TRADING-PMH] Error: ${e.message}`);
        }
      }

      // 🧠 OpenClaw-RL: Send reward signal for continuous learning
      sendRewardSignal({
        project: projectShortName || 'unknown',
        missionId,
        success: missionSuccess,
        failureType: result ? (result.result || '') : 'no_result',
        duration: durationMs,
        buildResult,
        prompt: content,
      }).catch(e => log(`[OPENCLAW-RL] Reward error: ${e.message}`));

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

// 🦞 FIX BUG #7 2026-02-27: Recovery function for poll failures
function restartWatcher() {
  try {
    if (watcher) { watcher.close(); watcher = null; }
  } catch (e) { /* ignore */ }
  try {
    watcher = fs.watch(config.WATCH_DIR, (eventType, filename) => enqueue(filename));
    log('[QUEUE] Watcher restarted successfully');
  } catch (e) {
    log(`[QUEUE] Failed to restart watcher: ${e.message}`);
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
      const newTasks = tasks.filter(f => !queuedSet.has(f) && !processingSet.has(f) && f !== currentTaskFile
        && !fs.existsSync(path.join(config.PROCESSED_DIR, f))); // 🧬 FIX #17: Skip already-processed
      if (newTasks.length > 0) {
        log(`Poll found new: ${newTasks.join(', ')}`);
      }
      newTasks.forEach(enqueue); // 🧬 FIX #17: Only enqueue truly new tasks (not all matched)
    } catch (e) {
      log(`[QUEUE] Poll error (will retry): ${e.message}`);
      pollFailCount = (pollFailCount || 0) + 1;
      if (pollFailCount > 5) {
        log('[QUEUE] CRITICAL: Poll failing repeatedly, restarting watcher');
        pollFailCount = 0;
        restartWatcher();
      }
    }
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

module.exports = { startWatching, stopWatching, isQueueEmpty, enqueue, initDLQ, moveToDeadLetter, getQueueStats };
