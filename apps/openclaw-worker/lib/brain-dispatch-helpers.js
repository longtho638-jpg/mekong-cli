/**
 * brain-dispatch-helpers.js
 *
 * Pre-dispatch guard and question auto-approver used by brain-mission-runner.js.
 *
 * Exports: preDispatchGuard, autoApproveQuestion
 */

const { log } = require('./brain-logger');
const {
  tmuxExec, capturePane, sendEnter, sendCtrlC,
  getCleanTail, waitForPrompt,
} = require('./brain-tmux-controller');
const { isBusy, detectState, PRO_LIMIT_PATTERNS, BUSY_PATTERNS } = require('./brain-state-machine');
const { killBrain } = require('./brain-spawn-manager');
const { setProLimitHit } = require('./system-status-registry');

const COMPACTION_TIMEOUT_MS = 3 * 60 * 1000;

/**
 * preDispatchGuard — waits up to 10 attempts for the worker to become idle.
 * Handles: pro-limit liquidation, queued-messages, interrupted state,
 * compaction stall, anti-stack, post-compact cooldown.
 *
 * @returns {object|null} early-abort result, or null if safe to dispatch
 */
async function preDispatchGuard(workerIdx, TMUX_SESSION, startTime) {
  let wasCompacting = false;
  let compactionStartTime = 0;

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
      tmuxExec(`tmux send-keys -t ${TMUX_SESSION} Escape`, TMUX_SESSION);
      await new Promise(r => setTimeout(r, 3000)); continue;
    }
    if (!isBusy(snap) && /Interrupted/i.test(full)) {
      log(`🩺 SELF-HEAL: Interrupted — Escape x3 (attempt ${attempt + 1})`);
      for (let i = 0; i < 3; i++) {
        tmuxExec(`tmux send-keys -t ${TMUX_SESSION} Escape`, TMUX_SESSION);
        await new Promise(r => setTimeout(r, 500));
      }
      await new Promise(r => setTimeout(r, 2000)); continue;
    }

    if (state === 'busy') {
      const isCompacting = /Compacting/i.test(recent) || /Compacting/i.test(full);
      if (isCompacting) {
        if (!wasCompacting) {
          wasCompacting = true; compactionStartTime = Date.now();
          log(`⏱️ COMPACTION STARTED`);
        }
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
          log(`🆘 ANTI-HANG: 0% compaction — Enter (attempt ${attempt + 1})`);
          await new Promise(r => setTimeout(r, 1000)); sendEnter(workerIdx, TMUX_SESSION);
          await new Promise(r => setTimeout(r, 10000));
        }
      } else {
        const m = BUSY_PATTERNS.find(p => p.test(recent));
        log(`ANTI-STACK: busy (attempt ${attempt + 1}/10) — ${m || 'NONE'} — waiting 5s`);
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
      tmuxExec(`tmux send-keys -t ${TMUX_SESSION} y Enter`, TMUX_SESSION);
      await new Promise(r => setTimeout(r, 2000)); continue;
    }
    break;
  }

  // Final safety checks
  const snap2 = capturePane(workerIdx, TMUX_SESSION);
  if (isBusy(snap2)) {
    log(`ANTI-STACK: P${workerIdx} still busy — ABORTING`);
    return { success: false, result: 'busy_blocked', elapsed: 0 };
  }
  if (/queued messages/i.test(snap2) || /Press up to edit queued/i.test(snap2)) {
    tmuxExec(`tmux send-keys -t ${TMUX_SESSION} Escape`, TMUX_SESSION);
    return { success: false, result: 'queued_abort', elapsed: 0 };
  }
  if (/Background tasks/i.test(snap2) || /Esc to close/i.test(snap2)) {
    tmuxExec(`tmux send-keys -t ${TMUX_SESSION} Escape`, TMUX_SESSION);
    await new Promise(r => setTimeout(r, 1000));
  }
  if (/0:\s*Dismiss/i.test(snap2) || /How is Claude doing/i.test(snap2)) {
    tmuxExec(`tmux send-keys -t ${TMUX_SESSION} 0`, TMUX_SESSION);
    await new Promise(r => setTimeout(r, 1000));
  }
  return null;
}

/**
 * autoApproveQuestion — handles CC CLI question/approval prompts automatically.
 */
async function autoApproveQuestion(output, workerIdx, TMUX_SESSION) {
  log(`QUESTION: auto-approving on P${workerIdx}`);
  const t = TMUX_SESSION;
  if (/2\.\s+No\s+\(recommended\)/i.test(output)) {
    log(`QUESTION: API Key — selecting '1. Yes'`);
    for (let i = 0; i < 3; i++) {
      tmuxExec(`tmux send-keys -t ${t} 1`, TMUX_SESSION); await new Promise(r => setTimeout(r, 500));
      tmuxExec(`tmux send-keys -t ${t} Enter`, TMUX_SESSION); await new Promise(r => setTimeout(r, 500));
    }
  } else if (
    /By proceeding, you accept all responsibility/i.test(output) ||
    /Yes, I accept/i.test(output) ||
    /⏵⏵\s+bypass\s+permissions/i.test(output)
  ) {
    tmuxExec(`tmux send-keys -t ${t} Down`, TMUX_SESSION);
    await new Promise(r => setTimeout(r, 500));
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

module.exports = { preDispatchGuard, autoApproveQuestion };
