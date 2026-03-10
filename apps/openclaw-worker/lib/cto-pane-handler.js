/**
 * cto-pane-handler.js
 * Per-pane state machine handler: processes each CC CLI pane state
 * and executes the appropriate action (respawn, inject, compact, etc.)
 *
 * Called once per pane per cycle from vibe-factory-monitor.js main loop.
 */

'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const { scanBeforeDispatch } = require('./cto-pre-dispatch-scan');
const { trackIdle } = require('./cto-progress-tracker');
const { checkEscalation } = require('./cto-escalation');
const { isDispatchAllowed } = require('./cto-ram-policy');
const { canDispatch } = require('./cto-worker-coordinator');
const { getNextPoolTask, smartTaskFromReality, checkExternalQueue, wrapWithRole } = require('./cto-task-dispatch');
const { scanCodebase } = require('./cto-codebase-scanner');

const COMPLETION_PATTERN = /(?:Cooked|Worked|Crunched|Sautéed|Choreographed|Cogitated)\s+for\s+\d/i;
const SCORE_HISTORY_FILE = '/tmp/vibe-score-history.json';

function recordScore(project, scoreResult) {
	try {
		let history = {};
		try {
			history = JSON.parse(fs.readFileSync(SCORE_HISTORY_FILE, 'utf-8'));
		} catch {}
		if (!history[project]) history[project] = [];
		history[project].push({ ts: Date.now(), total: scoreResult.total, grade: scoreResult.grade });
		if (history[project].length > 20) history[project] = history[project].slice(-20);
		fs.writeFileSync(SCORE_HISTORY_FILE, JSON.stringify(history, null, 2));
	} catch {}
}

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

/**
 * Handle a single pane for one cycle.
 *
 * @param {object} pane          - { idx, project, dir, isOpus? }
 * @param {string} output        - tmux captured output
 * @param {string} state         - from detectPaneState()
 * @param {object} ctx           - { session, fallbackModel, lastInjection, paneProgress, log,
 *                                   capture, sendBuf, sendKeys, respawn,
 *                                   isPaneTaskComplete, recordTaskInjected, recordTaskCompleted,
 *                                   isInCooldown, recordInjection }
 */
async function handlePane(pane, output, state, ctx) {
	const { session, fallbackModel, lastInjection, paneProgress, log, capture, sendKeys, respawn, recordTaskCompleted } = ctx;

	switch (state) {
		case 'DEAD':
			log(`P${pane.idx}: DEAD — respawning with --continue`);
			respawn(pane.idx, pane.dir, '--continue');
			break;

		case 'CRASHED':
			log(`P${pane.idx}: CRASHED — respawning with --continue`);
			respawn(pane.idx, pane.dir, '--continue');
			break;

		case 'MODEL_UNAVAILABLE': {
			log(`P${pane.idx}: MODEL_UNAVAILABLE — switching to fallback`);
			try {
				const settingsPath = path.join(process.env.HOME, '.claude/settings.json');
				const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
				const currentModel = settings.env?.ANTHROPIC_MODEL || settings.model || '';
				if (currentModel !== fallbackModel) {
					if (settings.env) settings.env.ANTHROPIC_MODEL = fallbackModel;
					settings.model = fallbackModel;
					fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
					log(`P${pane.idx}: Model: ${currentModel} → ${fallbackModel}`);
				}
			} catch (e) {
				log(`P${pane.idx}: Settings update failed: ${e.message}`);
			}
			respawn(pane.idx, pane.dir);
			lastInjection[pane.idx] = { ts: Date.now(), type: 'simple' };
			break;
		}

		case 'CONTEXT_LIMIT': {
			const ctxOut = capture(pane.idx, 5);
			if (/0% remaining|Context low \(0%/.test(ctxOut)) {
				log(`P${pane.idx}: CONTEXT 0% — respawning fresh`);
				respawn(pane.idx, pane.dir);
			} else {
				log(`P${pane.idx}: CONTEXT LIMIT — /compact`);
				sendKeys(pane.idx, 'Escape');
				await sleep(300);
				execSync(`tmux send-keys -t ${session}.${pane.idx} 'C-u' '/compact' Enter 2>/dev/null || true`);
			}
			lastInjection[pane.idx] = { ts: Date.now(), type: 'simple' };
			break;
		}

		case 'LOW_CONTEXT': {
			const lowOut = capture(pane.idx, 5);
			if (/0% remaining/.test(lowOut)) {
				log(`P${pane.idx}: LOW CONTEXT 0% — respawning fresh`);
				respawn(pane.idx, pane.dir);
				lastInjection[pane.idx] = { ts: Date.now(), type: 'simple' };
			} else {
				log(`P${pane.idx}: LOW CONTEXT — letting CC CLI finish`);
			}
			break;
		}

		case 'RATE_LIMITED':
			log(`P${pane.idx}: RATE LIMITED — respawning`);
			respawn(pane.idx, pane.dir);
			break;

		case 'PENDING':
			log(`P${pane.idx}: PENDING — Escape+Enter`);
			sendKeys(pane.idx, 'Escape');
			await sleep(300);
			sendKeys(pane.idx, 'Enter');
			break;

		case 'STUCK_PROMPT':
			log(`P${pane.idx}: STUCK_PROMPT — Enter`);
			sendKeys(pane.idx, 'Enter');
			break;

		case 'INTERACTIVE': {
			const iOut = capture(pane.idx, 15);
			if (/Submit answers|Review your answers|Ready to submit/.test(iOut)) {
				log(`P${pane.idx}: INTERACTIVE (Submit) — option 1`);
				sendKeys(pane.idx, '1');
			} else if (/Validation|approve as-is/.test(iOut)) {
				log(`P${pane.idx}: INTERACTIVE (Validation) — option 2`);
				sendKeys(pane.idx, '2');
			} else {
				log(`P${pane.idx}: INTERACTIVE (Generic) — Enter`);
				sendKeys(pane.idx, 'Enter');
			}
			await sleep(500);
			sendKeys(pane.idx, 'Enter');
			break;
		}

		case 'WORKING': {
			log(`P${pane.idx}: WORKING`);
			checkEscalation(pane.idx, pane, respawn, sendKeys, log, fallbackModel, session);
			if (COMPLETION_PATTERN.test(output)) {
				recordTaskCompleted(pane.idx, pane.project, paneProgress[pane.idx]?.task);
			}
			break;
		}

		case 'IDLE':
			await _handleIdle(pane, output, ctx);
			break;

		default:
			log(`P${pane.idx}: ACTIVE`);
	}
}

async function _handleIdle(pane, output, ctx) {
	const {
		session,
		lastInjection,
		paneProgress,
		log,
		sendKeys,
		sendBuf,
		isPaneTaskComplete,
		recordTaskInjected,
		recordTaskCompleted,
		isInCooldown,
		recordInjection,
	} = ctx;

	if (!isPaneTaskComplete(pane.idx, output)) return;
	if (paneProgress[pane.idx] && !paneProgress[pane.idx].completed) {
		recordTaskCompleted(pane.idx, pane.project, paneProgress[pane.idx].task);
	}
	if (isInCooldown(pane.idx)) return;
	if (!isDispatchAllowed(pane.idx, log)) return;

	// Context gate
	const ctxMatch = output.match(/Context left until auto-compact: (\d+)%/);
	if (ctxMatch && parseInt(ctxMatch[1], 10) <= 45) {
		log(`P${pane.idx}: Context ${ctxMatch[1]}% <= 45% — compacting`);
		sendKeys(pane.idx, 'Escape');
		await sleep(300);
		execSync(`tmux send-keys -t ${session}.${pane.idx} 'C-u' '/compact' Enter 2>/dev/null || true`);
		lastInjection[pane.idx] = { ts: Date.now(), type: 'simple' };
		return;
	}

	log(`P${pane.idx}: IDLE — pre-dispatch scan & reality check`);

	// Score
	if (!global.calculateProjectScore) {
		try {
			global.calculateProjectScore = require('./project-score-calculator').calculateProjectScore;
		} catch {
			global.calculateProjectScore = () => ({ total: 0, grade: 'F' });
		}
	}
	const scoreResult = global.calculateProjectScore(pane.dir);
	recordScore(pane.project, scoreResult);
	const intel = scanCodebase(pane);
	log(
		`P${pane.idx}: ${pane.project} Score=${scoreResult.total}/100 (${scoreResult.grade}) git=${intel.gitStatus} todos=${intel.todoCount}`,
	);

	if (scoreResult.grade === 'S') {
		log(`P${pane.idx}: Grade S — generating handover`);
		try {
			if (!global.generateHandoverPackage) {
				global.generateHandoverPackage = require('./handover-generator').generateHandoverPackage;
			}
			const hRes = global.generateHandoverPackage(pane.dir, pane.project, scoreResult);
			log(`P${pane.idx}: HANDOVER: ${hRes.files.length} docs → ${hRes.outputDir}`);
		} catch (e) {
			log(`P${pane.idx}: Handover failed: ${e.message}`);
		}
		trackIdle(pane.idx, pane.project);
		return;
	}

	// Factory pipeline
	let cookCmd = null;
	try {
		if (!global.factoryPipeline) global.factoryPipeline = require('./factory-pipeline');
		const ap = global.factoryPipeline.getActivePipeline(pane.project, pane.idx);
		if (ap) {
			const r = global.factoryPipeline.advanceStage(ap.id);
			if (r.advanced) {
				cookCmd = `${r.command} --auto`;
				log(`P${pane.idx}: PIPELINE [${ap.currentStage}→${r.nextStage}]`);
			} else if (!r.completed) {
				const c = global.factoryPipeline.getCurrentCommand(ap.id);
				if (c) cookCmd = `${c.command} --auto`;
			}
		}
	} catch {}

	// Pre-dispatch scan
	if (!cookCmd) {
		const scan = scanBeforeDispatch(pane.dir, pane.project, log);
		if (scan.action === 'block') {
			trackIdle(pane.idx, pane.project);
			return;
		}
		if (scan.action === 'debug') cookCmd = scan.debugTask;
	}

	if (!cookCmd) {
		cookCmd = smartTaskFromReality(pane, log);
		if (cookCmd) log(`P${pane.idx}: REALITY: ${cookCmd.slice(0, 80)}`);
	}
	if (!cookCmd) cookCmd = checkExternalQueue(pane, log);
	if (!cookCmd) {
		cookCmd = getNextPoolTask(pane.project);
		if (cookCmd) log(`P${pane.idx}: POOL: ${cookCmd.slice(0, 80)}`);
		else {
			log(`P${pane.idx}: No tasks for ${pane.project}`);
			trackIdle(pane.idx, pane.project);
			return;
		}
	}

	if (!cookCmd.startsWith('/')) {
		log(`P${pane.idx}: BLOCKED raw text — wrapping`);
		cookCmd = `/cook "${cookCmd.replace(/"/g, '\\"')}" --auto`;
	}

	if (!canDispatch(`P${pane.idx}-current`, log)) {
		trackIdle(pane.idx, pane.project);
		return;
	}

	// Wrap command with pane's agent role context
	const { PANE_ROLES } = require('./cto-task-dispatch');
	cookCmd = wrapWithRole(cookCmd, pane.idx);
	const roleName = (PANE_ROLES[pane.idx] || {}).role || 'generic';
	log(`P${pane.idx}: INJECTING [${roleName}]: ${cookCmd.slice(0, 100)}`);
	sendBuf(pane.idx, cookCmd);
	recordInjection(pane.idx, cookCmd);
	recordTaskInjected(pane.idx, cookCmd, pane.project);
}

module.exports = { handlePane };
