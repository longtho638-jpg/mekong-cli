/**
 * Brain Process Manager v24.0 — Tmux-based visible CC CLI brain
 *
 * Spawns CC CLI inside a tmux session so the user can watch it work.
 * Missions injected via `tmux send-keys`, completion detected via
 * `tmux capture-pane` polling for the prompt character.
 *
 * Exports (unchanged API surface):
 *   spawnBrain()  — Create tmux session + start CC CLI
 *   killBrain()   — Destroy tmux session
 *   isBrainAlive()— Check tmux session exists
 *   runMission()  — Inject prompt, poll for completion
 *   log()         — Timestamped logger
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../config');

let missionCount = 0;

// --- Helpers ---

function getApiKey() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  const keyFile = path.join(process.env.HOME || '', '.mekong', 'api-key');
  try { return fs.readFileSync(keyFile, 'utf-8').trim(); } catch (e) { return ''; }
}

function log(msg) {
  const timestamp = new Date().toISOString().slice(11, 19);
  const formatted = `[${timestamp}] [tom-hum] ${msg}\n`;
  process.stderr.write(formatted);
  try { fs.appendFileSync(config.LOG_FILE, formatted); } catch (e) {}
}

function tmux(cmd) {
  return execSync(`tmux ${cmd}`, { encoding: 'utf-8', timeout: 10000 }).trim();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Pane capture & prompt detection ---

function capturePane() {
  try {
    return tmux(`capture-pane -t ${config.TMUX_SESSION} -p`);
  } catch (e) { return ''; }
}

function isPromptVisible(paneText) {
  const lines = paneText.split('\n').filter((l) => l.trim());
  if (!lines.length) return false;
  const last = lines[lines.length - 1];
  return last.includes('\u276f') || />\s*$/.test(last);
}

// --- Core API ---

function spawnBrain() {
  log('BRAIN v24.0: Tmux-based visible CC CLI session');

  // Kill existing session if any
  try { tmux(`kill-session -t ${config.TMUX_SESSION}`); } catch (e) {}

  // Clean legacy IPC files
  try { fs.unlinkSync(config.MISSION_FILE); } catch (e) {}
  try { fs.unlinkSync(config.DONE_FILE); } catch (e) {}

  // Create new tmux session
  tmux(
    `new-session -d -s ${config.TMUX_SESSION} ` +
    `-x ${config.TMUX_WIDTH} -y ${config.TMUX_HEIGHT}`
  );
  log(`Tmux session "${config.TMUX_SESSION}" created`);

  // Build CC CLI launch command with env vars
  const apiKey = getApiKey();
  const cliCmd = [
    `cd ${config.MEKONG_DIR}`,
    `&&`,
    `ANTHROPIC_BASE_URL=http://127.0.0.1:${config.PROXY_PORT}`,
    `ANTHROPIC_API_KEY=${apiKey}`,
    `claude`,
    `--model ${config.MODEL_NAME}`,
    `--dangerously-skip-permissions`,
  ].join(' ');

  // Send CC CLI command into tmux session (literal to avoid char interpretation)
  tmux(`send-keys -t ${config.TMUX_SESSION} -l ${JSON.stringify(cliCmd)}`);
  tmux(`send-keys -t ${config.TMUX_SESSION} Enter`);
  log('CC CLI spawned inside tmux — waiting for prompt...');
}

function killBrain() {
  log('Killing tmux brain session');
  try { tmux(`kill-session -t ${config.TMUX_SESSION}`); } catch (e) {}
}

function isBrainAlive() {
  try {
    execSync(`tmux has-session -t ${config.TMUX_SESSION}`, { timeout: 5000 });
    return true;
  } catch (e) { return false; }
}

/**
 * Wait for the CC CLI prompt to appear in the tmux pane.
 * Used both after initial spawn and after mission completion.
 */
async function waitForPrompt(timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const pane = capturePane();
    if (isPromptVisible(pane)) {
      // Debounce: wait, then confirm prompt is still there
      await sleep(config.PROMPT_DEBOUNCE_MS);
      const pane2 = capturePane();
      if (isPromptVisible(pane2)) return true;
    }
    await sleep(config.POLL_INTERVAL_MS);
  }
  return false;
}

/**
 * Run a mission by injecting the prompt into the tmux session and
 * polling capture-pane for the CC CLI prompt to return.
 *
 * @param {string} prompt - Mission prompt text
 * @param {string} projectDir - Working directory (cd first)
 * @param {number} timeoutMs - Max execution time in milliseconds
 * @returns {Promise<{success: boolean, result: string, elapsed: number}>}
 */
async function runMission(prompt, projectDir, timeoutMs) {
  missionCount++;
  const num = missionCount;
  const startTime = Date.now();

  if (!isBrainAlive()) {
    log(`Brain dead before mission #${num} — respawning`);
    spawnBrain();
    const ready = await waitForPrompt();
    if (!ready) {
      return { success: false, result: 'brain_spawn_timeout', elapsed: 0 };
    }
  }

  log(`MISSION #${num}: ${prompt.slice(0, 150)}...`);
  log(`PROJECT: ${projectDir}`);

  // cd to project dir first, then send the mission prompt
  tmux(`send-keys -t ${config.TMUX_SESSION} -l ${JSON.stringify(`cd ${projectDir}`)}`);
  tmux(`send-keys -t ${config.TMUX_SESSION} Enter`);
  await sleep(1000);

  // Send mission prompt (literal mode for special chars)
  tmux(`send-keys -t ${config.TMUX_SESSION} -l ${JSON.stringify(prompt)}`);
  tmux(`send-keys -t ${config.TMUX_SESSION} Enter`);

  // Poll for prompt return (mission completion)
  // First, wait a bit so the prompt disappears while CC CLI is working
  await sleep(5000);

  // Status logging interval
  const statusInterval = setInterval(() => {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    log(`Mission #${num} working -- ${elapsed}s`);
  }, 60000);

  const completed = await waitForPrompt(timeoutMs);
  clearInterval(statusInterval);

  const elapsed = Math.round((Date.now() - startTime) / 1000);

  if (completed) {
    log(`COMPLETE: Mission #${num} (${elapsed}s)`);
    return { success: true, result: 'done', elapsed };
  }

  log(`TIMEOUT: Mission #${num} exceeded ${Math.round(timeoutMs / 1000)}s`);
  return { success: false, result: 'timeout', elapsed };
}

module.exports = { spawnBrain, killBrain, isBrainAlive, runMission, log };
