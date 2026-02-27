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
  sendEnter, sendCtrlC, getCleanTail, waitForPrompt,
} = require('./brain-tmux-controller');
const {
  isBusy, detectState, PRO_LIMIT_PATTERNS, BUSY_PATTERNS,
} = require('./brain-state-machine');
const {
  findIdleWorker, setWorkerLock, clearWorkerLock,
  setCurrentWorkerIdx, parseContextUsage,
  isBrainAlive, isShellPrompt, killBrain,
} = require('./brain-spawn-manager');
const { respawnBrain, compactIfNeeded } = require('./brain-respawn-controller');
const { setProLimitHit } = require('./system-status-registry');

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

// ─────────────────────────────────────────────────────────────────────────────
// runMission — main entry point
// ─────────────────────────────────────────────────────────────────────────────

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
  if (workerIdx === 0 && (prompt.includes('/cook') || prompt.includes('/debug') || prompt.includes('/test'))) {
    log(`🔴 CHAIRMAN OVERRIDE: Pane 0 (PRO) forbidden from /cook /debug /test. Aborted.`);
    return { success: false, result: 'p0_violation', elapsed: 0 };
  }
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

    // Pre-dispatch guard: wait for idle, handle queued messages / compaction
    const guardResult = await _preDispatchGuard(workerIdx, TMUX_SESSION, startTime);
    if (guardResult) return guardResult; // early abort (pro_limit_hit / busy_blocked / queued_abort)

    // Clear input line, then paste prompt via tmux load-buffer (avoids queued messages bug)
    tmuxExec(`tmux send-keys -t ${TMUX_SESSION}.${workerIdx} Escape`, TMUX_SESSION);
    tmuxExec(`tmux send-keys -t ${TMUX_SESSION}.${workerIdx} C-c`, TMUX_SESSION);
    await new Promise(r => setTimeout(r, 200));

    const safePrompt = fullPrompt.replace(/\n/g, ' ');
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
    const postState = detectState(capturePane(workerIdx, TMUX_SESSION));
    if (postState === 'idle' && Math.round((Date.now() - startTime) / 1000) >= 15) {
      log(`ENTER RETRY: Still idle after 15s — sending safety Enter`);
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
        log(`BRAIN DIED: Session died during mission #${num} (${elapsed}s)`);
        await respawnBrain(isPlanning ? 'PLAN' : 'EXECUTION', true);
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
          log(`COMPLETE: Mission #${num} (${elapsedSec}s) [cooked-pattern]${usage >= 0 ? ` [ctx=${usage}%]` : ''}`);
          const tk = countTokensBetween(missionStartDate, new Date());
          tokensSinceCompact += tk.tokens;
          log(`TOKENS: ${tk.tokens.toLocaleString()} (${tk.requests} reqs, ${tk.model})`);
          recordMission(prompt.slice(0, 60), path.basename(projectDir || ''), tk.tokens, elapsedSec, tk.model);
          const d = getDailyUsage(); if (d.overBudget) log(`⚠️ DAILY BUDGET EXCEEDED — ${d.tokens.toLocaleString()} tokens!`);
          try { require('./learning-engine').recordOutcome(prompt.slice(0, 40), path.basename(projectDir || ''), 'done', elapsedSec); } catch (e) { }
          return { success: true, result: 'done', elapsed: elapsedSec };
        }

        case 'busy':
          if (!wasBusy) log(`BUSY: Mission #${num} — CC CLI started processing`);
          wasBusy = true; idleConfirmCount = 0; break;

        case 'question':
          await _autoApproveQuestion(output, workerIdx, TMUX_SESSION);
          idleConfirmCount = 0; continue;

        case 'context_limit':
          log(`CONTEXT LIMIT: Mission #${num} — sending Enter to recover`);
          await new Promise(r => setTimeout(r, 1000));
          sendEnter(workerIdx, TMUX_SESSION);
          await new Promise(r => setTimeout(r, 10000));
          idleConfirmCount = 0; continue;

        case 'idle': {
          if (wasBusy) {
            idleConfirmCount++;
            if (idleConfirmCount >= IDLE_CONFIRM_POLLS) {
              const usage = parseContextUsage(output);
              log(`COMPLETE: Mission #${num} (${elapsedSec}s) [idle-after-busy x${IDLE_CONFIRM_POLLS}]${usage >= 0 ? ` [ctx=${usage}%]` : ''}`);
              const tk = countTokensBetween(missionStartDate, new Date());
              tokensSinceCompact += tk.tokens;
              log(`TOKENS: ${tk.tokens.toLocaleString()} (${tk.requests} reqs, ${tk.model})`);
              recordMission(prompt.slice(0, 60), path.basename(projectDir || ''), tk.tokens, elapsedSec, tk.model);
              const d = getDailyUsage(); if (d.overBudget) log(`⚠️ DAILY BUDGET EXCEEDED — ${d.tokens.toLocaleString()} tokens!`);
              try {
                const { getMissionSummary, clearCache } = require('./llm-interpreter');
                clearCache();
                try { require('./learning-engine').recordOutcome(prompt.slice(0, 40), path.basename(projectDir || ''), 'done', elapsedSec); } catch (e) { }
                getMissionSummary(output).catch(() => { });
              } catch (e) { }
              return { success: true, result: 'done', elapsed: elapsedSec };
            }
          } else if (elapsedSec > MIN_MISSION_SECONDS) {
            if (idleConfirmCount === 0) log(`WARNING: Mission #${num} idle for ${elapsedSec}s without becoming busy!`);
            idleConfirmCount++;
            if (idleConfirmCount >= IDLE_CONFIRM_POLLS && idleConfirmCount < IDLE_CONFIRM_POLLS * 6) {
              if (output && output.length > 200) {
                log(`COMPLETE: Mission #${num} (${elapsedSec}s) [fast-proxy-path: idle x${idleConfirmCount}]`);
                const tk = countTokensBetween(missionStartDate, new Date());
                tokensSinceCompact += tk.tokens;
                log(`TOKENS: ${tk.tokens.toLocaleString()} tokens`);
                recordMission(prompt.slice(0, 60), path.basename(projectDir || ''), tk.tokens, elapsedSec, tk.model);
                try { require('./learning-engine').recordOutcome(prompt.slice(0, 40), path.basename(projectDir || ''), 'done', elapsedSec); } catch (e) { }
                return { success: true, result: 'done', elapsed: elapsedSec, path: 'fast_proxy_completion' };
              }
            }
            if (idleConfirmCount >= IDLE_CONFIRM_POLLS * 6) {
              log(`ERROR: Mission #${num} failed to start after ${elapsedSec}s. Aborting.`);
              tmuxExec(`tmux send-keys -t ${TMUX_SESSION}.${workerIdx} Escape`, TMUX_SESSION);
              await new Promise(r => setTimeout(r, 1000));
              tmuxExec(`tmux send-keys -t ${TMUX_SESSION}.${workerIdx} Escape`, TMUX_SESSION);
              try { require('./learning-engine').recordOutcome(prompt.slice(0, 40), path.basename(projectDir || ''), 'failed_to_start', elapsedSec); } catch (e) { }
              return { success: false, result: 'failed_to_start', elapsed: elapsedSec };
            }
          }
          break;
        }

        default: idleConfirmCount = 0; break;
      }

      if (Date.now() - lastLogTime > 60000) {
        log(`Mission #${num} [${state}] — ${elapsedSec}s${wasBusy ? ' (was-busy)' : ''}`);
        lastLogTime = Date.now();
      }
      await new Promise(r => setTimeout(r, 500));
    }

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    log(`TIMEOUT: Mission #${num} on P${workerIdx} exceeded ${Math.round(timeoutMs / 1000)}s — sending Ctrl+C`);
    sendCtrlC(workerIdx, TMUX_SESSION);
    return { success: false, result: 'timeout', elapsed };

  } finally {
    clearWorkerLock(workerIdx);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Private helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * _preDispatchGuard — waits up to 10 attempts for the worker to become idle.
 * Handles: pro-limit liquidation, queued-messages, interrupted state,
 * compaction stall, anti-stack, post-compact cooldown.
 * Returns an early-abort result object, or null if safe to dispatch.
 */
async function _preDispatchGuard(workerIdx, TMUX_SESSION, startTime) {
  let wasCompacting = false;
  let compactionStartTime = 0;
  const COMPACTION_TIMEOUT_MS = 3 * 60 * 1000;

  for (let attempt = 0; attempt < 10; attempt++) {
    const snap = capturePane(workerIdx, TMUX_SESSION);
    const recent = getCleanTail(snap, 8).join('\n');
    const full = getCleanTail(snap, 20).join('\n');
    const state = detectState(recent);

    if (PRO_LIMIT_PATTERNS.some(p => p.test(full))) {
      log(`🚨 Claude Pro limit hit — NUCLEAR LIQUIDATION on P${workerIdx}`);
      setProLimitHit(true); killBrain();
      return { success: false, result: 'pro_limit_hit', elapsed: Date.now() - startTime };
    }
    if (/queued messages/i.test(recent) || /Press up to edit queued/i.test(recent)) {
      log(`🩺 SELF-HEAL: queued messages — Escape (attempt ${attempt + 1})`);
      tmuxExec(`tmux send-keys -t ${TMUX_SESSION}.${workerIdx} Escape`, TMUX_SESSION);
      await new Promise(r => setTimeout(r, 3000)); continue;
    }
    if (!isBusy(snap) && /Interrupted/i.test(full)) {
      log(`🩺 SELF-HEAL: Interrupted state — Escape x3 (attempt ${attempt + 1})`);
      for (let i = 0; i < 3; i++) {
        tmuxExec(`tmux send-keys -t ${TMUX_SESSION}.${workerIdx} Escape`, TMUX_SESSION);
        await new Promise(r => setTimeout(r, 500));
      }
      await new Promise(r => setTimeout(r, 2000)); continue;
    }
    if (state === 'busy') {
      const isCompacting = /Compacting/i.test(recent) || /Compacting/i.test(full);
      if (isCompacting) {
        if (!wasCompacting) { wasCompacting = true; compactionStartTime = Date.now(); log(`⏱️ COMPACTION STARTED`); }
        const dur = Date.now() - compactionStartTime;
        if (dur > COMPACTION_TIMEOUT_MS) {
          log(`🚨 COMPACTION STALL ${Math.round(dur / 60000)}min — aborting with Ctrl+C`);
          sendCtrlC(workerIdx, TMUX_SESSION); await new Promise(r => setTimeout(r, 3000));
          sendEnter(workerIdx, TMUX_SESSION); await new Promise(r => setTimeout(r, 5000));
          wasCompacting = false; compactionStartTime = 0;
          await waitForPrompt(30000, workerIdx, TMUX_SESSION); break;
        }
        log(`⏱️ COMPACTING: ${Math.round((Date.now() - compactionStartTime) / 1000)}s — waiting...`);
        if (/Compacting[^\n]*0%/i.test(recent) || /0%[^\n]*Compacting/i.test(recent)) {
          log(`🆘 ANTI-HANG: compacting at 0% — sending Enter (attempt ${attempt + 1})`);
          await new Promise(r => setTimeout(r, 1000)); sendEnter(workerIdx, TMUX_SESSION);
          await new Promise(r => setTimeout(r, 10000));
        }
      } else {
        const m = BUSY_PATTERNS.find(p => p.test(recent));
        log(`ANTI-STACK: still busy (attempt ${attempt + 1}/10) — matched: ${m || 'NONE'} — waiting 5s`);
      }
      await new Promise(r => setTimeout(r, 5000)); continue;
    }
    if (state === 'idle' || state === 'complete' || state === 'unknown') {
      if (wasCompacting) {
        log(`POST-COMPACT: cooling 10s before dispatch...`);
        wasCompacting = false; compactionStartTime = 0;
        await new Promise(r => setTimeout(r, 10000)); continue;
      }
      break;
    }
    if (state === 'question') {
      log(`ANTI-STACK: pending question — auto-approving`);
      tmuxExec(`tmux send-keys -t ${TMUX_SESSION}.${workerIdx} y Enter`, TMUX_SESSION);
      await new Promise(r => setTimeout(r, 2000)); continue;
    }
    break;
  }

  // Final checks after guard loop
  const snap2 = capturePane(workerIdx, TMUX_SESSION);
  if (isBusy(snap2)) {
    log(`ANTI-STACK: P${workerIdx} still busy after guard — ABORTING`);
    return { success: false, result: 'busy_blocked', elapsed: 0 };
  }
  if (/queued messages/i.test(snap2) || /Press up to edit queued/i.test(snap2)) {
    log(`🩺 FINAL CHECK: queued messages — Escape + abort`);
    tmuxExec(`tmux send-keys -t ${TMUX_SESSION}.${workerIdx} Escape`, TMUX_SESSION);
    return { success: false, result: 'queued_abort', elapsed: 0 };
  }
  if (/Background tasks/i.test(snap2) || /Esc to close/i.test(snap2)) {
    tmuxExec(`tmux send-keys -t ${TMUX_SESSION}.${workerIdx} Escape`, TMUX_SESSION);
    await new Promise(r => setTimeout(r, 1000));
  }
  if (/0:\s*Dismiss/i.test(snap2) || /How is Claude doing/i.test(snap2)) {
    tmuxExec(`tmux send-keys -t ${TMUX_SESSION}.${workerIdx} 0`, TMUX_SESSION);
    await new Promise(r => setTimeout(r, 1000));
  }
  return null; // safe to dispatch
}

/**
 * _autoApproveQuestion — handles CC CLI question/approval prompts automatically.
 */
async function _autoApproveQuestion(output, workerIdx, TMUX_SESSION) {
  log(`QUESTION: auto-approving on P${workerIdx}`);
  const t = `${TMUX_SESSION}.${workerIdx}`;
  if (/2\.\s+No\s+\(recommended\)/i.test(output)) {
    log(`QUESTION: API Key — selecting '1. Yes'`);
    for (let i = 0; i < 3; i++) {
      tmuxExec(`tmux send-keys -t ${t} 1`, TMUX_SESSION); await new Promise(r => setTimeout(r, 500));
      tmuxExec(`tmux send-keys -t ${t} Enter`, TMUX_SESSION); await new Promise(r => setTimeout(r, 500));
    }
  } else if (/By proceeding, you accept all responsibility/i.test(output) || /Yes, I accept/i.test(output) || /⏵⏵\s+bypass\s+permissions/i.test(output)) {
    log(`QUESTION: Bypass Permissions — Down+Enter`);
    tmuxExec(`tmux send-keys -t ${t} Down`, TMUX_SESSION); await new Promise(r => setTimeout(r, 500));
    tmuxExec(`tmux send-keys -t ${t} Enter`, TMUX_SESSION);
  } else if (/Enter your API key/i.test(output)) {
    tmuxExec(`tmux send-keys -t ${t} Enter`, TMUX_SESSION);
  } else if (/\(Recommended\)/i.test(output)) {
    tmuxExec(`tmux send-keys -t ${t} Enter`, TMUX_SESSION);
  } else if (/Option A/i.test(output)) {
    tmuxExec(`tmux send-keys -t ${t} a Enter`, TMUX_SESSION);
  } else {
    tmuxExec(`tmux send-keys -t ${t} Enter`, TMUX_SESSION);
  }
  await new Promise(r => setTimeout(r, 1000));
}

module.exports = { runMission };
