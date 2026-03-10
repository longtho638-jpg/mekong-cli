/**
 * brain-tmux-controller.js
 *
 * All tmux session operations: exec, capture, send keys, throttle guard.
 * Exports: tmuxExec, isSessionAlive, capturePane, pasteText,
 *          sendEnter, sendCtrlC, waitForPrompt, logVision,
 *          getCleanTail, stripAnsi, TMUX_SESSION_PRO, TMUX_SESSION_API
 */

const { execSync } = require('child_process');
const fs = require('fs');
const config = require('../config');
const { log } = require('./brain-logger');

const TMUX_SESSION_PRO = `${config.TMUX_SESSION}:brain.0`; // Pane 0: Claude Pro (Planner)
const TMUX_SESSION_API = `${config.TMUX_SESSION}:brain.1`; // Pane 1: Gemini Proxy (Executor)

// 🦞 OPTIMIZATION 2026-02-26: 5s → 1.5s (Sub-5s response mandate)
const TMUX_MIN_GAP_MS = 1500;

// 🦞 FIX 2026-02-23: Centralized tmux throttle guard
// ALL modules go through capturePane() → tmuxExec() → this guard
// Prevents tmux socket contention that causes freezing
let _lastTmuxCallTime = 0;
let _lastTmuxResult = '';
let _lastTmuxCacheKey = '';

/** Strip ANSI escape codes + control characters from captured tmux text */
function stripAnsi(text) {
  return text
    .replace(/\x1B\[[0-9;?]*[A-Za-z]/g, '')         // CSI sequences (colors, cursor)
    .replace(/\x1B\][^\x07\x1B]*(?:\x07|\x1B\\)/g, '') // OSC sequences (BEL or ST)
    .replace(/\x1B[()][A-Za-z0-9]/g, '')              // Character set selection
    .replace(/\x1B[A-Za-z]/g, '')                      // Simple ESC sequences
    .replace(/[\x00-\x08\x0E-\x1F\x7F]/g, '');        // Control chars (keep \t \n \r)
}

function tmuxExec(cmd, sessionName = TMUX_SESSION_PRO) {
  try {
    return execSync(cmd, { encoding: 'utf-8', timeout: 10000 }).trim();
  } catch (e) {
    log(`TMUX ERROR [session=${sessionName}]: ${e.message}`);
    return '';
  }
}

function isSessionAlive(sessionName = TMUX_SESSION_PRO) {
  try {
    // Strip :window.pane suffix — only check if SESSION exists
    // e.g. "tom_hum:brain.1" → "tom_hum"
    const cleanSession = sessionName.split(':')[0];
    execSync(`tmux has-session -t ${cleanSession} 2>/dev/null`, { timeout: 5000 });
    return true;
  } catch (e) { return false; }
}

function capturePane(workerIdx, sessionName = TMUX_SESSION_PRO) {
  const now = Date.now();
  const elapsed = now - _lastTmuxCallTime;

  // Throttle: return cached result ONLY if same worker and session and called too soon
  const cacheKey = `${sessionName}:${workerIdx}`;
  if (elapsed < TMUX_MIN_GAP_MS && _lastTmuxResult && _lastTmuxCacheKey === cacheKey) {
    return _lastTmuxResult;
  }

  // 🦞 FIX 2026-02-28: Detect if sessionName already includes pane index (e.g., 'tom_hum:brain.1')
  // If so, use it directly. Otherwise append .${idx} as before.
  // This prevents double-nested references like 'tom_hum:brain.1.1' → "can't find pane: 1.1"
  const alreadyHasPane = /\.\d+$/.test(sessionName);
  const idx = workerIdx !== undefined ? workerIdx : 1;
  const target = alreadyHasPane ? sessionName : `${sessionName}.${idx}`;

  _lastTmuxCallTime = now;
  _lastTmuxCacheKey = cacheKey;

  try {
    const rawTmux = tmuxExec(`tmux capture-pane -t ${target} -p -S -50`, sessionName);
    _lastTmuxResult = stripAnsi(rawTmux);
  } catch (e) {
    _lastTmuxResult = '';
  }
  return _lastTmuxResult;
}

/** Get clean last N lines from captured tmux output, ignoring trailing empty lines */
function getCleanTail(output, n) {
  const lines = stripAnsi(output).split('\n');
  let last = lines.length - 1;
  while (last >= 0 && lines[last].trim() === '') {
    last--;
  }
  return lines.slice(Math.max(0, last - n + 1), last + 1);
}

/**
 * Diagnostics: Log the visual tail to the CTO log.
 * Only logs when state is 'unknown' or stuck for a while.
 */
function logVision(output, label = 'UNKNOWN') {
  const tail = getCleanTail(output, 8).join('\n');
  log(`[👀 VISION] (${label}) captured tail:\n------------------\n${tail}\n------------------`);
}

/**
 * pasteText — TWO-CALL MANDATE (Chairman Rule 2026-02-03)
 * Writes to temp file, loads into tmux buffer, pastes without bracketed paste mode.
 */
function pasteText(text, workerIdx, sessionName = TMUX_SESSION_PRO) {
  const idx = workerIdx !== undefined ? workerIdx : 1;
  const alreadyHasPane = /\.\d+$/.test(sessionName);
  const target = alreadyHasPane ? sessionName : `${sessionName}.${idx}`;

  const cleanText = text.replace(/\n+$/, ''); // Strip ALL trailing newlines
  const promptFile = `/tmp/tom_hum_prompt_P${idx}.txt`;
  fs.writeFileSync(promptFile, cleanText); // NO trailing newline in file
  tmuxExec(`tmux load-buffer ${promptFile}`, sessionName);
  // 🦞 FIX: Do NOT use `-p` (bracketed paste).
  // Bracketed paste tells CC CLI to queue the messages visually.
  tmuxExec(`tmux paste-buffer -d -t ${target}`, sessionName);
  try { fs.unlinkSync(promptFile); } catch (e) { }
}

function sendEnter(workerIdx, sessionName = TMUX_SESSION_PRO) {
  const alreadyHasPane = /\.\d+$/.test(sessionName);
  const target = alreadyHasPane ? sessionName : `${sessionName}.${workerIdx}`;
  tmuxExec(`tmux send-keys -t ${target} Enter`, sessionName);
}

function sendCtrlC(workerIdx, sessionName = TMUX_SESSION_PRO) {
  const alreadyHasPane = /\.\d+$/.test(sessionName);
  const target = alreadyHasPane ? sessionName : `${sessionName}.${workerIdx}`;
  tmuxExec(`tmux send-keys -t ${target} C-c`, sessionName);
}

/** Poll until prompt appears (used by spawnBrain/respawn/context management) */
async function waitForPrompt(timeoutMs = 120000, workerIdx = 0, sessionName = TMUX_SESSION_PRO) {
  const { hasPrompt } = require('./brain-state-machine');
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (hasPrompt(capturePane(workerIdx, sessionName))) return true;
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

/**
 * 🎯 DYNAMIC PANE ROUTING — Live project discovery from tmux panes.
 * Queries tmux for each pane's current working directory, extracts project name.
 * Returns: { 0: { path: '/path/to/mekong-cli', projectName: 'mekong-cli' }, ... }
 *
 * This is the SINGLE SOURCE OF TRUTH for pane→project mapping.
 * No more hardcoded PANE_PROJECT_MAP. The CTO reads reality.
 */
function getActivePaneProjects(sessionName = config.TMUX_SESSION) {
  const paneMap = {};
  try {
    const raw = execSync(
      `tmux list-panes -t ${sessionName}:0 -F "#{pane_index}:#{pane_current_path}" 2>/dev/null`,
      { encoding: 'utf-8', timeout: 5000 }
    ).trim();

    if (!raw) return paneMap;

    for (const line of raw.split('\n')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const idx = parseInt(line.slice(0, colonIdx), 10);
      const panePath = line.slice(colonIdx + 1).trim();
      if (isNaN(idx) || !panePath) continue;

      // Extract project name = last segment of the path
      const projectName = require('path').basename(panePath);
      paneMap[idx] = { path: panePath, projectName };
    }

    log(`[DYNAMIC ROUTING] Discovered ${Object.keys(paneMap).length} panes: ${Object.entries(paneMap).map(([k, v]) => `P${k}=${v.projectName}`).join(', ')}`);
  } catch (e) {
    log(`[DYNAMIC ROUTING] Error querying tmux panes: ${e.message}`);
  }
  return paneMap;
}

module.exports = {
  TMUX_SESSION_PRO,
  TMUX_SESSION_API,
  stripAnsi,
  tmuxExec,
  isSessionAlive,
  capturePane,
  getCleanTail,
  logVision,
  pasteText,
  sendEnter,
  sendCtrlC,
  waitForPrompt,
  getActivePaneProjects,
};
