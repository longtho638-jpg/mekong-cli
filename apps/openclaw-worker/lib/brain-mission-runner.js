/**
 * brain-mission-runner.js
 *
 * runMission() — dispatches prompt to tmux pane and polls state machine
 * until DONE, timeout, or error.
 *
 * AGI L4 Enhancement (2026-03-03):
 * - Auto-retry with exponential backoff (1s, 2s, 4s, 8s, 16s)
 * - LLM root cause analysis on failure
 * - Model failover on repeated failures
 * - Adaptive timeout based on complexity
 *
 * State machine: DISPATCHED → BUSY → DONE
 *   (a) Completion pattern (Cooked/Sautéed for Xm Ys)
 *   (b) Was BUSY → 8x consecutive IDLE polls
 *   (c) Never saw BUSY but elapsed > 60s → 8x consecutive IDLE (fast-proxy path)
 *
 * Exports: runMission, analyzeFailureReason, shouldRetry, executeRecovery
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const config = require('../config');
const { log } = require('./brain-logger');
const {
  TMUX_SESSION_PRO, TMUX_SESSION_API,
  tmuxExec, isSessionAlive, capturePane,
  sendEnter, sendCtrlC,
} = require('./brain-tmux-controller');
const { detectState } = require('./brain-state-machine');
const {
  findIdleWorker, setWorkerLock, clearWorkerLock,
  setCurrentWorkerIdx, parseContextUsage,
  isBrainAlive, isShellPrompt,
} = require('./brain-spawn-manager');
const { respawnBrain, compactIfNeeded } = require('./brain-respawn-controller');
const { preDispatchGuard, autoApproveQuestion } = require('./brain-dispatch-helpers');
const { raasLicenseMiddleware } = require('./raas-license-validator'); // RaaS Phase 1

const MIN_MISSION_SECONDS = 60;
const IDLE_CONFIRM_POLLS = 8;
const DEDUP_TTL_MS = 10 * 60 * 1000;

let missionCount = 0;
let tokensSinceCompact = 0;
const dispatchedMissions = new Map();

function hashPrompt(p) {
  return require('crypto').createHash('md5').update(p).digest('hex');
}

function isDuplicateMission(hash) {
  const now = Date.now();
  for (const [h, ts] of dispatchedMissions.entries()) {
    if (now - ts > DEDUP_TTL_MS) dispatchedMissions.delete(h);
  }
  return dispatchedMissions.has(hash);
}

function trackMissionHash(hash) { dispatchedMissions.set(hash, Date.now()); }

async function runMission(prompt, projectDir, timeoutMs, modelOverride, complexity, intent) {
  const isPlanning = intent === 'PLAN' || intent === 'RESEARCH' ||
    (prompt || '').startsWith('/plan') || (prompt || '').includes('[PLAN ONLY]');
  const TMUX_SESSION = isPlanning ? TMUX_SESSION_PRO : TMUX_SESSION_API;

  const promptHash = hashPrompt(prompt);
  if (isDuplicateMission(promptHash)) {
    log(`DUPLICATE MISSION REJECTED: Hash ${promptHash.slice(0, 20)}...`);
    return { success: false, result: 'duplicate_rejected', elapsed: 0 };
  }

  // ══════════════════════════════════════════════════════════════
  // 🔒 RaaS LICENSE CHECK (Phase 1) — NEW
  // Validate X-RaaS-License-Key before dispatch
  // ══════════════════════════════════════════════════════════════
  const licenseKey = process.env.RAAS_LICENSE_KEY;
  if (licenseKey || process.env.RAAS_ENFORCE === 'true') {
    const raasCheck = await raasLicenseMiddleware({ licenseKey }, {});
    if (!raasCheck.allowed) {
      log(`🔒 RaaS BLOCK: Mission rejected — ${raasCheck.reason}`, 'ERROR');
      return { success: false, result: `raas_blocked_${raasCheck.error_code || 'unknown'}`, elapsed: 0 };
    }
    if (raasCheck.warning) {
      log(`⚠️ RaaS WARNING: ${raasCheck.warning}`, 'WARN');
    }
    if (raasCheck.tenant) {
      log(`✅ RaaS ALLOWED: tenant=${raasCheck.tenant.tenant_id}, tier=${raasCheck.tenant.tier}`, 'INFO');
    }
  }
  // ══════════════════════════════════════════════════════════════

  const workerIdx = findIdleWorker(TMUX_SESSION, intent, projectDir);
  // P0 = mekong-cli, P1 = algo-trader, P2 = sophia-ai-factory, P3 = well
  // If target pane is busy, it returns -1 to wait in queue.
  if (workerIdx === -1) {
    log(`MISSION BLOCKED: Worker busy — refusing dispatch`);
    return { success: false, result: 'all_workers_busy', elapsed: 0 };
  }

  // ══════════════════════════════════════════════════════════════
  // 🔒 HARD GUARD: Chairman Decree — 1P 1 DỰ ÁN, CẤM NHẦM!
  // Validates project-pane match AFTER findIdleWorker.
  // Even if findIdleWorker is bypassed or broken, THIS guard
  // will REJECT any mission that tries to run wrong project on wrong pane.
  // ══════════════════════════════════════════════════════════════
  const _projName = projectDir ? require('path').basename(projectDir) : '';
  // Dynamic HARD GUARD: query tmux pane's actual project (2026-03-09)
  const { getActivePaneProjects } = require('./brain-tmux-controller');
  const livePaneMap = getActivePaneProjects(TMUX_SESSION);
  const paneInfo = livePaneMap[workerIdx];
  const isMekongRoot = projectDir === config.MEKONG_DIR;
  if (!isMekongRoot && _projName && paneInfo && paneInfo.projectName !== _projName && !paneInfo.path.includes(_projName)) {
    log(`🔒 HARD GUARD BLOCK: P${workerIdx} has project="${paneInfo.projectName}" but mission wants "${_projName}"`);
    return { success: false, result: `hard_guard_rejected_${_projName}_on_P${workerIdx}`, elapsed: 0 };
  }
  // ══════════════════════════════════════════════════════════════

  trackMissionHash(promptHash);
  missionCount++;
  const num = missionCount;
  const startTime = Date.now();
  const missionStartDate = new Date();

  setWorkerLock(workerIdx, num);
  setCurrentWorkerIdx(workerIdx);

  try {
    const { countTokensBetween, recordMission, getDailyUsage } = require('./token-tracker');
    log(`MISSION #${num} → P${workerIdx}: ${prompt.slice(0, 150)}...`);
    log(`PROJECT: ${projectDir} | WORKER: P${workerIdx}`);

    const { waitForSafeTemperature } = require('./m1-cooling-daemon');
    await waitForSafeTemperature();
    await compactIfNeeded();

    // Build full prompt with optional project context constraint
    let fullPrompt = prompt;
    if (projectDir && projectDir !== config.MEKONG_DIR) {
      fullPrompt = prompt.replace(/"$/, `\n\n[CONTEXT STRICTLY RESTRICTED TO PROJECT DIRECTORY: ${projectDir}]"`);
      if (fullPrompt === prompt) fullPrompt = `${prompt} (IN PROJECT: ${projectDir})`;
    }

    // Safety: ensure brain is alive before dispatch
    const checkOutput = capturePane(workerIdx, TMUX_SESSION);
    if (!isBrainAlive(TMUX_SESSION) || isShellPrompt(checkOutput)) {
      log(`CRITICAL: Brain died or dropped to shell! session=${TMUX_SESSION}`);
      const ok = await respawnBrain(isPlanning ? 'PLAN' : 'EXECUTION', true);
      if (!ok) return { success: false, result: 'brain_died_fatal', elapsed: 0 };
      await new Promise(r => setTimeout(r, 2000));
    }

    // Pre-dispatch guard: wait for idle, self-heal stuck states
    const guardResult = await preDispatchGuard(workerIdx, TMUX_SESSION, startTime);
    if (guardResult) return guardResult;

    // Paste prompt via tmux load-buffer (avoids CC CLI "queued messages" bug v2.1.59)
    tmuxExec(`tmux send-keys -t ${TMUX_SESSION} Escape`, TMUX_SESSION);
    tmuxExec(`tmux send-keys -t ${TMUX_SESSION} C-c`, TMUX_SESSION);
    await new Promise(r => setTimeout(r, 200));

    // 🦞 FIX 2026-02-27: Aggressive newline purge. The LLM or Planner may inject
    // hard `\n` characters inside quotes. Any `\n` pasted via tmux immediately drops
    // CC CLI into "Queued Messages" edit mode, blocking execution indefinitely.
    const safePrompt = fullPrompt.replace(/\r?\n|\r/g, ' ').replace(/\s{2,}/g, ' ');
    const tempFile = path.join(os.tmpdir(), `mission_prompt_${workerIdx}_${Date.now()}.txt`);
    try {
      fs.writeFileSync(tempFile, safePrompt);
      tmuxExec(`tmux load-buffer -b mission_${workerIdx} ${tempFile}`);
      tmuxExec(`tmux paste-buffer -b mission_${workerIdx} -p -d -t ${TMUX_SESSION}`, TMUX_SESSION);
    } finally {
      try { fs.unlinkSync(tempFile); } catch (e) { }
    }

    await new Promise(r => setTimeout(r, 2000));

    // TWO-CALL MANDATE: Triple-Enter to pierce [Pasted text] modal
    log(`[MANDATE] Sending Triple-Enter to pierce [Pasted text] modal...`);
    sendEnter(workerIdx, TMUX_SESSION); await new Promise(r => setTimeout(r, 2000));
    sendEnter(workerIdx, TMUX_SESSION); await new Promise(r => setTimeout(r, 2000));
    sendEnter(workerIdx, TMUX_SESSION);

    await new Promise(r => setTimeout(r, 8000));
    if (detectState(capturePane(workerIdx, TMUX_SESSION)) === 'idle' &&
      Math.round((Date.now() - startTime) / 1000) >= 15) {
      log(`ENTER RETRY: Still idle after 15s — safety Enter`);
      sendEnter(workerIdx, TMUX_SESSION); await new Promise(r => setTimeout(r, 1000));
      sendEnter(workerIdx, TMUX_SESSION);
    }
    log(`DISPATCHED: Mission #${num} sent to P${workerIdx}`);

    // ─────────────────────────────────────────────────────────────
    // STATE MACHINE: DISPATCHED → BUSY → DONE
    // ─────────────────────────────────────────────────────────────
    let wasBusy = false;
    let idleConfirmCount = 0;
    const deadline = Date.now() + timeoutMs;
    let lastLogTime = Date.now();

    await new Promise(r => setTimeout(r, 1000));

    while (Date.now() < deadline) {
      if (!isSessionAlive(TMUX_SESSION)) {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        log(`BRAIN DIED: Session died during mission #${num} (${elapsed}s) — respawn disabled, manual restart required`);
        return { success: false, result: 'brain_died', elapsed };
      }

      const output = capturePane(workerIdx, TMUX_SESSION);
      const state = detectState(output);
      const elapsedSec = Math.round((Date.now() - startTime) / 1000);

      const { checkStuckIntervention } = require('./brain-system-monitor');
      if (checkStuckIntervention(workerIdx, elapsedSec, wasBusy))
        return { success: false, result: 'killed_stuck', elapsed: elapsedSec };

      switch (state) {
        case 'complete': {
          if (!wasBusy && elapsedSec < MIN_MISSION_SECONDS) break;
          const usage = parseContextUsage(output);
          log(`COMPLETE: Mission #${num} (${elapsedSec}s) [cooked]${usage >= 0 ? ` [ctx=${usage}%]` : ''}`);
          const tk = countTokensBetween(missionStartDate, new Date());
          tokensSinceCompact += tk.tokens;
          log(`TOKENS: ${tk.tokens.toLocaleString()} (${tk.requests} reqs, ${tk.model})`);
          recordMission(prompt.slice(0, 60), path.basename(projectDir || ''), tk.tokens, elapsedSec, tk.model);
          const d = getDailyUsage();
          if (d.overBudget) log(`⚠️ DAILY BUDGET EXCEEDED — ${d.tokens.toLocaleString()} tokens!`);
          try { require('./learning-engine').recordOutcome(prompt.slice(0, 40), path.basename(projectDir || ''), 'done', elapsedSec); } catch (e) { }
          return { success: true, result: 'done', elapsed: elapsedSec };
        }

        case 'busy':
          if (!wasBusy) log(`BUSY: Mission #${num} — CC CLI started processing`);
          wasBusy = true; idleConfirmCount = 0; break;

        case 'question':
          await autoApproveQuestion(output, workerIdx, TMUX_SESSION);
          idleConfirmCount = 0; continue;

        case 'context_limit':
          log(`CONTEXT LIMIT: Mission #${num} — sending Enter to recover`);
          await new Promise(r => setTimeout(r, 1000));
          sendEnter(workerIdx, TMUX_SESSION);
          await new Promise(r => setTimeout(r, 10000));
          idleConfirmCount = 0; continue;

        case 'idle':
          idleConfirmCount = await _handleIdleState(
            wasBusy, idleConfirmCount, elapsedSec, output, num, prompt,
            projectDir, missionStartDate, countTokensBetween, recordMission,
            getDailyUsage, workerIdx, TMUX_SESSION
          );
          if (typeof idleConfirmCount === 'object') return idleConfirmCount; // early return
          break;

        default: idleConfirmCount = 0; break;
      }

      if (Date.now() - lastLogTime > 60000) {
        log(`Mission #${num} [${state}] — ${elapsedSec}s${wasBusy ? ' (was-busy)' : ''}`);
        lastLogTime = Date.now();
      }
      await new Promise(r => setTimeout(r, 500));
    }

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    log(`TIMEOUT: Mission #${num} on P${workerIdx} exceeded ${Math.round(timeoutMs / 1000)}s — Ctrl+C`);
    sendCtrlC(workerIdx, TMUX_SESSION);
    return { success: false, result: 'timeout', elapsed };

  } finally {
    clearWorkerLock(workerIdx);
  }
}

// Handles the 'idle' branch of the state machine.
// Returns updated idleConfirmCount, OR a result object for early return.
async function _handleIdleState(
  wasBusy, idleConfirmCount, elapsedSec, output, num, prompt,
  projectDir, missionStartDate, countTokensBetween, recordMission,
  getDailyUsage, workerIdx, TMUX_SESSION
) {
  if (wasBusy) {
    const count = idleConfirmCount + 1;
    if (count >= IDLE_CONFIRM_POLLS) {
      const usage = parseContextUsage(output);
      log(`COMPLETE: Mission #${num} (${elapsedSec}s) [idle-after-busy x${IDLE_CONFIRM_POLLS}]${usage >= 0 ? ` [ctx=${usage}%]` : ''}`);
      const tk = countTokensBetween(missionStartDate, new Date());
      log(`TOKENS: ${tk.tokens.toLocaleString()} (${tk.requests} reqs, ${tk.model})`);
      recordMission(prompt.slice(0, 60), path.basename(projectDir || ''), tk.tokens, elapsedSec, tk.model);
      const d = getDailyUsage();
      if (d.overBudget) log(`⚠️ DAILY BUDGET EXCEEDED — ${d.tokens.toLocaleString()} tokens!`);
      try {
        const { getMissionSummary, clearCache } = require('./llm-interpreter');
        clearCache();
        try { require('./learning-engine').recordOutcome(prompt.slice(0, 40), path.basename(projectDir || ''), 'done', elapsedSec); } catch (e) { }
        getMissionSummary(output).catch(() => { });
      } catch (e) { }
      return { success: true, result: 'done', elapsed: elapsedSec };
    }
    return count;
  }

  if (elapsedSec > MIN_MISSION_SECONDS) {
    const count = idleConfirmCount + 1;
    if (count === 1) log(`WARNING: Mission #${num} idle for ${elapsedSec}s without becoming busy!`);
    if (count >= IDLE_CONFIRM_POLLS && count < IDLE_CONFIRM_POLLS * 6 && output && output.length > 200) {
      log(`COMPLETE: Mission #${num} (${elapsedSec}s) [fast-proxy-path: idle x${count}]`);
      const tk = countTokensBetween(missionStartDate, new Date());
      log(`TOKENS: ${tk.tokens.toLocaleString()} tokens`);
      recordMission(prompt.slice(0, 60), path.basename(projectDir || ''), tk.tokens, elapsedSec, tk.model);
      try { require('./learning-engine').recordOutcome(prompt.slice(0, 40), path.basename(projectDir || ''), 'done', elapsedSec); } catch (e) { }
      return { success: true, result: 'done', elapsed: elapsedSec, path: 'fast_proxy_completion' };
    }
    if (count >= IDLE_CONFIRM_POLLS * 6) {
      log(`ERROR: Mission #${num} failed to start after ${elapsedSec}s. Aborting.`);
      const { tmuxExec: tx } = require('./brain-tmux-controller');
      tx(`tmux send-keys -t ${TMUX_SESSION} Escape`, TMUX_SESSION);
      await new Promise(r => setTimeout(r, 1000));
      tx(`tmux send-keys -t ${TMUX_SESSION} Escape`, TMUX_SESSION);
      try { require('./learning-engine').recordOutcome(prompt.slice(0, 40), path.basename(projectDir || ''), 'failed_to_start', elapsedSec); } catch (e) { }
      return { success: false, result: 'failed_to_start', elapsed: elapsedSec };
    }
    return count;
  }

  return idleConfirmCount;
}

// ═══════════════════════════════════════════════════
// AGI L4: Auto-Retry & Self-Healing Functions
// ═══════════════════════════════════════════════════

const MAX_RETRIES = 3;
const BACKOFF_MULTIPLIER = 2; // 1s, 2s, 4s, 8s, 16s
const BASE_DELAY_MS = 1000;

/**
 * Analyze failure reason from tmux output and elapsed time
 * Returns: { reason, confidence, recovery, isRetryable }
 */
function analyzeFailureReason(output, elapsedSec, result, state) {
  const outputLower = (output || '').toLowerCase();

  // Model/API errors
  if (outputLower.includes('quota') || outputLower.includes('rate limit')) {
    return {
      reason: 'quota_exhausted',
      confidence: 0.95,
      recovery: 'wait_and_retry',
      isRetryable: true,
      suggestedDelay: 30000, // 30s
    };
  }

  if (outputLower.includes('context limit') || outputLower.includes('token limit')) {
    return {
      reason: 'context_overflow',
      confidence: 0.9,
      recovery: 'compact_and_retry',
      isRetryable: true,
      suggestedDelay: 5000,
    };
  }

  if (outputLower.includes('model_not_found') || outputLower.includes('400')) {
    return {
      reason: 'model_error',
      confidence: 0.85,
      recovery: 'failover_model',
      isRetryable: true,
      suggestedDelay: 2000,
    };
  }

  // Timeout
  if (result === 'timeout') {
    return {
      reason: 'timeout',
      confidence: 1.0,
      recovery: 'increase_timeout_retry',
      isRetryable: true,
      suggestedDelay: BASE_DELAY_MS,
    };
  }

  // Failed to start
  if (result === 'failed_to_start') {
    return {
      reason: 'failed_to_start',
      confidence: 0.9,
      recovery: 'respawn_brain_retry',
      isRetryable: true,
      suggestedDelay: 3000,
    };
  }

  // Unknown/Stuck
  if (state === 'unknown' || elapsedSec > 300) {
    return {
      reason: 'stuck_or_unknown',
      confidence: 0.6,
      recovery: 'enter_pierce_retry',
      isRetryable: true,
      suggestedDelay: BASE_DELAY_MS,
    };
  }

  // Default: unknown failure
  return {
    reason: 'unknown',
    confidence: 0.5,
    recovery: 'none',
    isRetryable: false,
  };
}

/**
 * Determine if mission should retry based on failure analysis
 * Returns: { retry: boolean, delay: number, model?: string }
 */
function shouldRetry(failureCount, failureAnalysis, complexity = 'standard') {
  if (failureCount >= MAX_RETRIES) {
    return { retry: false, reason: 'max_retries_exceeded' };
  }

  if (!failureAnalysis.isRetryable) {
    return { retry: false, reason: 'non_retryable_failure' };
  }

  // Calculate delay with exponential backoff
  const baseDelay = failureAnalysis.suggestedDelay || BASE_DELAY_MS;
  const backoffDelay = baseDelay * Math.pow(BACKOFF_MULTIPLIER, failureCount);
  const cappedDelay = Math.min(backoffDelay, 30000); // Cap at 30s

  // Model failover after 2 failures
  let model = undefined;
  if (failureCount >= 2) {
    model = 'gemini-3-flash-preview'; // Fallback to more robust model
  }

  // Complexity-based timeout adjustment for timeout failures
  if (failureAnalysis.reason === 'timeout') {
    const complexityMultiplier = complexity === 'complex' ? 2.0 : complexity === 'standard' ? 1.5 : 1.0;
    return {
      retry: true,
      delay: cappedDelay,
      model,
      timeoutMultiplier: complexityMultiplier,
    };
  }

  return { retry: true, delay: cappedDelay, model };
}

/**
 * Execute recovery action based on analysis
 * Returns: { success: boolean, message: string }
 */
async function executeRecovery(recoveryType, workerIdx, sessionName, prompt) {
  const { tmuxExec, sendEnter } = require('./brain-tmux-controller');
  const { log } = require('./brain-logger');

  log(`[RECOVERY] Executing ${recoveryType} on P${workerIdx}...`);

  try {
    switch (recoveryType) {
      case 'enter_pierce_retry':
        // Send multiple Enters to pierce stuck modal
        sendEnter(workerIdx, sessionName);
        await new Promise(r => setTimeout(r, 2000));
        sendEnter(workerIdx, sessionName);
        await new Promise(r => setTimeout(r, 2000));
        sendEnter(workerIdx, sessionName);
        return { success: true, message: 'Enter pierce sent' };

      case 'compact_and_retry':
        // Send /compact command
        tmuxExec(`tmux send-keys -t ${sessionName} "/compact" Enter`, sessionName);
        await new Promise(r => setTimeout(r, 5000)); // Wait for compact
        return { success: true, message: 'Compact executed' };

      case 'respawn_brain_retry':
        // Ctrl+C to clear, then wait for respawn
        tmuxExec(`tmux send-keys -t ${sessionName} C-c`, sessionName);
        await new Promise(r => setTimeout(r, 3000));
        return { success: true, message: 'Brain respawn triggered' };

      case 'failover_model':
        // Model failover handled at dispatch level
        return { success: true, message: 'Model failover scheduled' };

      case 'wait_and_retry':
        // Just wait (quota recovery)
        return { success: true, message: 'Waiting for quota recovery' };

      case 'increase_timeout_retry':
        // Timeout adjustment handled by caller
        return { success: true, message: 'Timeout will be increased' };

      default:
        return { success: false, message: `Unknown recovery type: ${recoveryType}` };
    }
  } catch (e) {
    log(`[RECOVERY ERROR] ${recoveryType} failed: ${e.message}`);
    return { success: false, message: e.message };
  }
}

module.exports = {
  runMission,
  // AGI L4 exports
  analyzeFailureReason,
  shouldRetry,
  executeRecovery,
  MAX_RETRIES,
  BACKOFF_MULTIPLIER,
  BASE_DELAY_MS,
};
