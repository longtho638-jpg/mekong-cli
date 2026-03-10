/**
 * cto-tmux-helpers.js
 * Safe tmux operations: capture, send buffer, send keys, respawn, detect real project.
 * All operations include P0 IRON GUARD — P0 (paneIdx 0) is untouchable.
 */

'use strict';

const { execSync } = require('child_process');
const path = require('path');

const CLAUDE_BIN = '/Users/macbookprom1/.local/bin/claude';

/**
 * Capture last N lines from a tmux pane.
 * @param {string} session - e.g. "tom_hum:0"
 * @param {number} paneIdx
 * @param {number} lines
 * @returns {string}
 */
function tmuxCapture(session, paneIdx, lines = 15) {
	try {
		return execSync(`tmux capture-pane -t ${session}.${paneIdx} -p -S -${lines} 2>/dev/null`, { encoding: 'utf-8', timeout: 5000 });
	} catch {
		return '';
	}
}

/**
 * Detect the real project from tmux pane's current working directory.
 * @param {string} session
 * @param {number} paneIdx
 * @returns {{ project: string, dir: string }|null}
 */
function detectRealProject(session, paneIdx) {
	try {
		const panePath = execSync(`tmux display-message -t ${session}.${paneIdx} -p '#{pane_current_path}' 2>/dev/null`, {
			encoding: 'utf-8',
			timeout: 3000,
		}).trim();
		if (!panePath) return null;

		const match = panePath.match(/\/apps\/([^\/]+)/);
		if (match) return { project: match[1], dir: panePath };
		if (panePath.endsWith('/mekong-cli') || panePath.includes('/mekong-cli/packages')) return { project: 'mekong-cli', dir: panePath };
		return { project: path.basename(panePath), dir: panePath };
	} catch {
		return null;
	}
}

/**
 * Respawn a tmux pane with CC CLI.
 * P0 IRON GUARD: always blocked.
 * @param {string} session
 * @param {number} paneIdx
 * @param {string} dir
 * @param {string} flags - e.g. '--continue'
 * @param {boolean} isOpus - use Opus config dir
 * @param {Function} log
 * @returns {boolean}
 */
function respawnPane(session, paneIdx, dir, flags, isOpus, log) {
	if (paneIdx === 0) {
		log('P0: IRON GUARD — BLOCKED respawnPane (Chairman pane protected)');
		return false;
	}
	const prefix = isOpus ? 'CLAUDE_CONFIG_DIR=~/.claude-opus ' : '';
	const cmd = `${prefix}${CLAUDE_BIN} --dangerously-skip-permissions${flags ? ' ' + flags : ''}`;
	try {
		execSync(`tmux respawn-pane -k -t ${session}.${paneIdx} -c '${dir}' '${cmd}'`);
		return true;
	} catch {
		return false;
	}
}

/**
 * Send text to a tmux pane via buffer (safe, handles escaping).
 * P0 IRON GUARD: always blocked.
 * @param {string} session
 * @param {number} paneIdx
 * @param {string} text
 * @param {Function} log
 * @returns {boolean}
 */
function tmuxSendBuffer(session, paneIdx, text, log) {
	if (paneIdx === 0) {
		log('P0: IRON GUARD — BLOCKED tmuxSendBuffer (Chairman pane protected)');
		return false;
	}
	try {
		execSync(`tmux send-keys -t ${session}.${paneIdx} C-u`);
		execSync('sleep 0.2');
		const escaped = text.replace(/'/g, "'\\''");
		execSync(`tmux send-keys -l -t ${session}.${paneIdx} '${escaped}'`);
		execSync('sleep 0.8');
		execSync(`tmux send-keys -t ${session}.${paneIdx} Enter`);
		execSync('sleep 0.5');
		execSync(`tmux send-keys -t ${session}.${paneIdx} Enter`);
		return true;
	} catch (e) {
		log(`P${paneIdx}: tmux send FAILED - ${e.message}`);
		return false;
	}
}

/**
 * Send raw key sequence to a pane.
 * P0 IRON GUARD: always blocked silently.
 * @param {string} session
 * @param {number} paneIdx
 * @param {string} keys - e.g. 'Enter', 'Escape', '1'
 */
function tmuxSendKeys(session, paneIdx, keys) {
	if (paneIdx === 0) return;
	try {
		execSync(`tmux send-keys -t ${session}.${paneIdx} ${keys}`);
	} catch {}
}

module.exports = { tmuxCapture, detectRealProject, respawnPane, tmuxSendBuffer, tmuxSendKeys };
