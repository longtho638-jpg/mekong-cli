/**
 * brain-boot-sequence.js
 *
 * Dual-pane tmux session boot: creates PRO (Planner) + API (Executor) panes,
 * writes sandbox configs, copies oauth creds, waits for CC CLI ready prompts.
 *
 * Exports: spawnBrain
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { getHandForIntent } = require('./hands-registry');
const { log } = require('./brain-logger');
const { tmuxExec, isSessionAlive, capturePane } = require('./brain-tmux-controller');
// Lazy-require to break circular: boot-sequence ↔ spawn-manager
// SINGLE SOURCE OF TRUTH: generateClaudeCommand lives in brain-spawn-manager.js
function generateClaudeCommand(intent) {
  return require('./brain-spawn-manager').generateClaudeCommand(intent);
}

async function spawnBrain() {
  const TMUX_SESSION = `${config.TMUX_SESSION}:brain`;

  if (isSessionAlive(TMUX_SESSION)) {
    try {
      const paneCount = parseInt(
        execSync(`tmux list-panes -t ${TMUX_SESSION} | wc -l`, { encoding: 'utf-8' }).trim()
      );
      if (paneCount >= 2) {
        log(`BRAIN: tmux session exists (Panes: ${paneCount}/2) — reusing`);
        return;
      }
      log(`BRAIN: Session exists but has ${paneCount}/2 panes. REPAIRING...`);
      tmuxExec(`tmux kill-session -t ${TMUX_SESSION}`, TMUX_SESSION);
    } catch (e) {
      log(`BRAIN: Error checking session: ${e.message}`);
    }
  }

  log(`BRAIN: Creating DUAL-PANE SANDWICH tmux session...`);
  _writeSandboxConfigs();
  _persistAuthCredentials();

  const cmdPro = generateClaudeCommand('PRO');
  const cmdApi = generateClaudeCommand('API');
  const bootDir = config.MEKONG_DIR;
  const sessionName = TMUX_SESSION.split(':')[0];

  log(`BRAIN: Creating NEW session [${sessionName}] in ${bootDir}...`);
  tmuxExec(`tmux new-session -d -s ${sessionName} -n brain -x 200 -y 50 -c ${bootDir}`, TMUX_SESSION);
  tmuxExec(`tmux set-option -t ${sessionName} remain-on-exit on`, TMUX_SESSION);
  tmuxExec(`tmux set-option -t ${sessionName} allow-rename off`, TMUX_SESSION);
  tmuxExec(`tmux split-window -h -t ${TMUX_SESSION}.0 -c ${bootDir}`, TMUX_SESSION);

  await new Promise(r => setTimeout(r, 1000));

  tmuxExec(`tmux send-keys -t ${TMUX_SESSION}.0 '${cmdPro}' Enter`, TMUX_SESSION);
  tmuxExec(`tmux select-pane -t ${TMUX_SESSION}.0 -T "PRO: Planner"`, TMUX_SESSION);
  tmuxExec(`tmux send-keys -t ${TMUX_SESSION}.1 '${cmdApi}' Enter`, TMUX_SESSION);
  tmuxExec(`tmux select-pane -t ${TMUX_SESSION}.1 -T "API: Executor"`, TMUX_SESSION);

  log(`BRAIN: Waiting for CC CLI bypass prompts...`);
  await new Promise(r => setTimeout(r, 10000));
  await _acceptBootPrompts(TMUX_SESSION);

  log(`BRAIN: Dual-Pane Sandwich Boot Complete [session=${TMUX_SESSION}]`);
}

// --- Private helpers ---

function _buildMcpConfig() {
  return {
    mcpServers: {
      filesystem: {
        command: 'node',
        args: [
          '/Users/macbookprom1/.npm/_npx/a3241bba59c344f5/node_modules/@modelcontextprotocol/server-filesystem/dist/index.js',
          '/Users/macbookprom1/mekong-cli',
        ],
      },
    },
  };
}

function _writeSandboxConfigs() {
  const mcpConfig = _buildMcpConfig();
  const handPro = getHandForIntent('PLAN');
  const handApi = getHandForIntent('COOK');

  const profilePro = '/Users/macbookprom1/.claude_antigravity_pro';
  const profileApi = '/Users/macbookprom1/.claude_antigravity_api';

  for (const [dir, hand, color] of [[profilePro, handPro, '#A020F0'], [profileApi, handApi, '#00FF00']]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const cfg = {
      primaryColor: color,
      customInstructions: hand.instructions,
      dangerouslySkipPermissions: true,
      bypassPermissions: true,
      agreedToBypassPermissions: true,
    };
    fs.writeFileSync(path.join(dir, 'config.json'), JSON.stringify(cfg, null, 2));
    fs.writeFileSync(path.join(dir, 'mcp.json'), JSON.stringify(mcpConfig, null, 2));
  }
}

function _persistAuthCredentials() {
  try {
    const srcDir = '/Users/macbookprom1/.claude';
    const tokens = fs.readdirSync(srcDir).filter(f => f.startsWith('oauth_creds'));
    for (const token of tokens) {
      const src = path.join(srcDir, token);
      fs.copyFileSync(src, path.join('/Users/macbookprom1/.claude_antigravity_pro', token));
      fs.copyFileSync(src, path.join('/Users/macbookprom1/.claude_antigravity_api', token));
    }
    log(`BRAIN: Persisted Auth Pro credentials to Sandbox Profiles.`);
  } catch (e) {
    log(`BRAIN: Auth persistence warning - ${e.message}`);
  }
}

async function _acceptBootPrompts(TMUX_SESSION) {
  for (let paneIdx = 0; paneIdx < 2; paneIdx++) {
    for (let retry = 0; retry < 30; retry++) {
      const out = capturePane(paneIdx, TMUX_SESSION);
      if (out.includes('accept all responsibility') || out.includes('Permissions mode.')) {
        log(`BRAIN: P${paneIdx} prompt — sending Down+Enter (attempt ${retry + 1})...`);
        tmuxExec(`tmux send-keys -t ${TMUX_SESSION}.${paneIdx} Down`, TMUX_SESSION);
        await new Promise(r => setTimeout(r, 1000));
        tmuxExec(`tmux send-keys -t ${TMUX_SESSION}.${paneIdx} Enter`, TMUX_SESSION);
      } else if (
        out.includes('Choose the text style') ||
        out.includes('Press Enter to continue') ||
        out.includes('Yes, I trust this folder')
      ) {
        tmuxExec(`tmux send-keys -t ${TMUX_SESSION}.${paneIdx} Enter`, TMUX_SESSION);
      } else if (out.includes('❯')) {
        log(`BRAIN: P${paneIdx} Native Boot Complete!`);
        break;
      }
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

module.exports = { spawnBrain };
