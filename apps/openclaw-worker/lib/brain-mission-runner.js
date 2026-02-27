/**
 * brain-mission-runner.js
 *
 * runMission() — dispatches prompt to tmux pane and polls state machine
 * until DONE, timeout, or error.
 *
 * State machine: DISPATCHED → BUSY → DONE
 *   (a) Completion pattern (Cooked/Sautéed for Xm Ys)
 *   (b) Was BUSY → 8x consecutive IDLE polls
 *   (c) Never saw BUSY but elapsed > 60s → 8x consecutive IDLE (fast-proxy path)
 *
 * Exports: runMission
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
const { compactIfNeeded } = require('./brain-respawn-controller');
const { preDispatchGuard, autoApproveQuestion } = require('./brain-dispatch-helpers');

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

  const workerIdx = findIdleWorker(TMUX_SESSION, intent);
  // CHAIRMAN OVERRIDE removed — routing by intent is sufficient.
  // P0 only receives PLAN/RESEARCH intents (via findIdleWorker).
  // P1 receives all EXECUTION/COOK intents. No prompt-content check needed.
  if (workerIdx === -1) {
    log(`MISSION BLOCKED: Worker busy — refusing dispatch`);
    return { success: false, result: 'all_workers_busy', elapsed: 0 };
  }

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
    tmuxExec(`tmux send-keys -t ${TMUX_SESSION}.${workerIdx} Escape`, TMUX_SESSION);
    tmuxExec(`tmux send-keys -t ${TMUX_SESSION}.${workerIdx} C-c`, TMUX_SESSION);
    await new Promise(r => setTimeout(r, 200));

    // 🦞 FIX 2026-02-27: Aggressive newline purge. The LLM or Planner may inject
    // hard `\n` characters inside quotes. Any `\n` pasted via tmux immediately drops
    // CC CLI into "Queued Messages" edit mode, blocking execution indefinitely.
    const safePrompt = fullPrompt.replace(/\r?\n|\r/g, ' ').replace(/\s{2,}/g, ' ');
    const tempFile = path.join(os.tmpdir(), `mission_prompt_${workerIdx}_${Date.now()}.txt`);
    try {
      fs.writeFileSync(tempFile, safePrompt);
      tmuxExec(`tmux load-buffer -b mission_${workerIdx} ${tempFile}`);
      tmuxExec(`tmux paste-buffer -b mission_${workerIdx} -p -d -t ${TMUX_SESSION}.${workerIdx}`, TMUX_SESSION);
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
      tx(`tmux send-keys -t ${TMUX_SESSION}.${workerIdx} Escape`, TMUX_SESSION);
      await new Promise(r => setTimeout(r, 1000));
      tx(`tmux send-keys -t ${TMUX_SESSION}.${workerIdx} Escape`, TMUX_SESSION);
      try { require('./learning-engine').recordOutcome(prompt.slice(0, 40), path.basename(projectDir || ''), 'failed_to_start', elapsedSec); } catch (e) { }
      return { success: false, result: 'failed_to_start', elapsed: elapsedSec };
    }
    return count;
  }

  return idleConfirmCount;
}

module.exports = { runMission };
