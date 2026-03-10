/**
 * brain-state-machine.js
 *
 * BUSY/IDLE/COMPLETE pattern arrays and state detection functions.
 *
 * AGI L4 Enhancement (2026-03-03):
 * - Confidence scoring for each state detection
 * - Adaptive pattern weights (learn from feedback)
 * - Ambiguity resolution with LLM
 *
 * Exports: BUSY_PATTERNS, COMPLETION_PATTERNS, APPROVE_PATTERNS,
 *          PRO_LIMIT_PATTERNS, CONTEXT_LIMIT_PATTERNS,
 *          isBusy, hasCompletionPattern, hasPrompt, hasApproveQuestion,
 *          hasContextLimit, isShellPrompt, detectState,
 *          detectStateWithConfidence, recordFeedback, getPatternStats
 */

const { log } = require('./brain-logger');
const { getCleanTail } = require('./brain-tmux-controller');

// ═══════════════════════════════════════════════════
// AGI L4: Adaptive Pattern Weights
// ═══════════════════════════════════════════════════

/** Pattern weight storage — adjusts based on feedback */
const patternWeights = {
	busy: new Map(),
	completion: new Map(),
	approve: new Map(),
};

/** Initialize weights from file if exists */
const weightFile = require('path').join(require('os').homedir(), '.openclaw', 'pattern-weights.json');
try {
	const fs = require('fs');
	if (fs.existsSync(weightFile)) {
		const data = JSON.parse(fs.readFileSync(weightFile, 'utf-8'));
		if (data.busy) data.busy.forEach(([p, w]) => patternWeights.busy.set(p, w));
		if (data.completion) data.completion.forEach(([p, w]) => patternWeights.completion.set(p, w));
		if (data.approve) data.approve.forEach(([p, w]) => patternWeights.approve.set(p, w));
		log(
			`[state-machine] Loaded ${patternWeights.busy.size + patternWeights.completion.size + patternWeights.approve.size} pattern weights`,
		);
	}
} catch (e) {
	/* fresh start */
}

/** Feedback history for learning */
const feedbackHistory = [];
const MAX_FEEDBACK_SIZE = 1000;

// ═══════════════════════════════════════════════════
// AGI L4: Feedback & Learning Functions
// ═══════════════════════════════════════════════════

/**
 * Record feedback for state detection
 * @param {string} expectedState - What state should have been detected
 * @param {string} detectedState - What was actually detected
 * @param {string} output - The tmux output that was analyzed
 */
function recordFeedback(expectedState, detectedState, output) {
	const isCorrect = expectedState === detectedState;

	feedbackHistory.push({
		timestamp: Date.now(),
		expected: expectedState,
		detected: detectedState,
		correct: isCorrect,
		outputSample: output?.slice(0, 200),
	});

	// Trim history
	if (feedbackHistory.length > MAX_FEEDBACK_SIZE) {
		feedbackHistory.splice(0, feedbackHistory.length - MAX_FEEDBACK_SIZE);
	}

	// Adjust weights based on feedback
	if (expectedState === 'busy' && detectedState !== 'busy') {
		// False negative — increase weights for patterns that matched
		BUSY_PATTERNS.forEach((pattern, idx) => {
			if (pattern.test(output)) {
				const key = pattern.toString();
				const current = patternWeights.busy.get(key) || 1.0;
				patternWeights.busy.set(key, Math.min(current * 1.1, 2.0)); // Cap at 2x
			}
		});
	} else if (expectedState !== 'busy' && detectedState === 'busy') {
		// False positive — decrease weights
		BUSY_PATTERNS.forEach((pattern, idx) => {
			if (pattern.test(output)) {
				const key = pattern.toString();
				const current = patternWeights.busy.get(key) || 1.0;
				patternWeights.busy.set(key, Math.max(current * 0.9, 0.5)); // Floor at 0.5x
			}
		});
	}

	// Save weights periodically
	if (feedbackHistory.length % 50 === 0) {
		saveWeights();
	}

	log(`[state-machine] Feedback: ${expectedState}→${detectedState} (${isCorrect ? '✅' : '❌'})`);
}

/** Save pattern weights to file */
function saveWeights() {
	try {
		const fs = require('fs');
		const dir = require('path').dirname(weightFile);
		if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

		const data = {
			busy: Array.from(patternWeights.busy.entries()),
			completion: Array.from(patternWeights.completion.entries()),
			approve: Array.from(patternWeights.approve.entries()),
		};
		fs.writeFileSync(weightFile, JSON.stringify(data, null, 2));
	} catch (e) {
		log(`[state-machine] Failed to save weights: ${e.message}`);
	}
}

/** Get pattern statistics */
function getPatternStats() {
	const recent = feedbackHistory.slice(-100);
	const byState = {};

	['busy', 'completion', 'approve', 'idle'].forEach((state) => {
		const stateFeedback = recent.filter((f) => f.expected === state);
		const correct = stateFeedback.filter((f) => f.correct).length;
		const total = stateFeedback.length;
		byState[state] = {
			total,
			correct,
			accuracy: total > 0 ? ((correct / total) * 100).toFixed(1) + '%' : 'N/A',
		};
	});

	return {
		byState,
		recentAccuracy: recent.length > 0 ? ((recent.filter((f) => f.correct).length / recent.length) * 100).toFixed(1) + '%' : 'N/A',
		patternCount: {
			busy: patternWeights.busy.size,
			completion: patternWeights.completion.size,
			approve: patternWeights.approve.size,
		},
	};
}

/** Get adaptive confidence threshold based on recent accuracy */
function getConfidenceThreshold() {
	const recent = feedbackHistory.slice(-50);
	if (recent.length === 0) return 0.7; // Default threshold

	const accuracy = recent.filter((f) => f.correct).length / recent.length;

	// Higher accuracy = lower threshold (trust the model)
	// Lower accuracy = higher threshold (require more confidence)
	if (accuracy >= 0.95) return 0.6;
	if (accuracy >= 0.9) return 0.7;
	if (accuracy >= 0.8) return 0.75;
	return 0.85; // Low accuracy = require high confidence
}

// CC CLI activity indicators (present continuous = actively processing)
const BUSY_PATTERNS = [
	/Photosynthesizing/i,
	/Crunching/i,
	/Saut[eé]ing/i,
	/Marinating/i,
	/Fermenting/i,
	/Braising/i,
	/Reducing/i,
	/Blanching/i,
	/[*·✢✻✽✳✶]\s*(?:Thinking|Compacting|Galloping|Reading|Writing|Executing|Running|Bắt đầu|Gusting|Whirring|Boondoggling|Pondering|Synthesizing|Refining|Actioning|Investigating|Analyzing|Exploring)/i,
	/Churning/i,
	/Cooking/i,
	/Toasting/i,
	/Galloping/i,
	/Simmering/i,
	/Steaming/i,
	/Grilling/i,
	/Roasting/i,
	/Levitating/i,
	/Osmosing/i,
	/Computing/i,
	/^\s*⏺\s*Read/m,
	/^\s*⏺\s*Execut/m,
	/Indexing/i,
	/[*·✻✢✽✳✶]\s+\w+ing/,
	/\d+[ms]\s+\d+[ms]\s*·\s*[↑↓]/,
	/[↑↓]\s*[\d.]+k?\s*tokens/i,
	/\d+\s+local\s+agents?/i,
	/Cost:\s*\$[\d.]+/,
	/Calling tool/i,
	/Running command/i,
	/Searching/i,
	/Reading/i,
	/Writing/i,
	/Running tests/i,
	/Running\s+\d+\s+Task agents?/i,
	/[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/,
	/Nesting/i,
	/Puttering/i,
	/Pasted text/i,
	/filesystem\s*[-–—]\s*/i,
	/\+\d+\s+lines\s*\(ctrl/i,
	/Gusting/i,
	/Whirring/i,
	/Boondoggling/i,
	/Pondering/i,
	/Synthesizing/i,
	/Refining/i,
	/Actioning/i,
	/Investigating/i,
	/Analyzing/i,
	/Exploring/i,
];

// CC CLI completion indicators (past tense = finished cooking)
const COMPLETION_PATTERNS = [
	/(?:Cooked|Churned|Saut[eé]ed|Braised|Blanched|Reduced|Fermented|Marinated|Toasted|Simmered|Steamed|Grilled|Roasted)\s+for\s+\d+/i,
	/[·✻✢✽✳✶]\s+\w+(?:ed|t)\s+for\s+\d+/i,
	/Task completed in/i,
	/Finished in \d+/i,
	/Completed\s+\d+\s+steps/i,
	/Subagent finished/i,
];

// CC CLI asking for approval/confirmation
const APPROVE_PATTERNS = [
	/Do you want to run this command\?/,
	/Do you want to proceed\?/,
	/Do you want to execute this code\?/,
	/Enter your API key/,
	/Do you want to use this API key\?/,
	/\(y\/n\)/i,
	/\[y\/n\]/i,
	/\[Y\/n\]/i,
	/Approve\?/i,
	/Confirm\?/i,
	/Do you want to allow/i,
	/Use arrow keys to select/i,
	/Select an option/i,
	/2\.\s+No\s+\(recommended\)/i,
	/1\.\s+Yes,\s+I accept/i,
	/By proceeding, you accept all responsibility/i,
	/muốn.*làm gì/i,
	/USER DECISION/i,
	/Khuyến nghị.*chọn/i,
	/Options?:/i,
	/What would you like/i,
	/Which option/i,
	/tiếp theo/i,
	/Continue with/i,
	/Proceed with/i,
	/Glob patterns are not allowed/i,
	/Waiting for approval/i,
	/Press\s+Enter\s+to\s+continue/i,
	/accept edits on/i,
	/Enter to select/i,
	/↑\/↓ to navigate/i,
	/Enter to confirm/i,
	/Chat about this/i,
	/Context low/i,
];

// Claude Pro Rate Limit indicators
const PRO_LIMIT_PATTERNS = [/You(?:'ve| have) hit your limit/i, /resets 6am/i, /Switch to extra usage/i, /Upgrade your plan/i];

// CC CLI context exhaustion
const CONTEXT_LIMIT_PATTERNS = [/Context limit reached/i, /\/compact or \/clear/i, /context is full/i, /out of context/i];

// --- State detection functions ---

/**
 * CC CLI is ACTIVELY PROCESSING (Photosynthesizing, Crunching, etc.)
 * AGI L4 Enhancement: Returns { isBusy, confidence, matchedPatterns }
 */
function isBusy(output) {
	// 🦞 FIX 2026-02-25: ALL checks now scan only lines AFTER the last ❯ prompt.
	const lines = getCleanTail(output, 8);
	const promptIdx = lines.findLastIndex((l) => l.includes('❯'));
	const checkLines = (promptIdx >= 0 ? lines.slice(promptIdx) : lines).filter((l) => {
		const clean = l.trim();
		if (!clean) return false;
		if (/^[─━-]+$/.test(clean)) return false;
		if (/bypass permissions/i.test(clean)) return false;
		return true;
	});
	const tail = checkLines.join('\n');

	const subagentPattern = /\d+\s+local\s+agents?/i;
	const hasSubagent = subagentPattern.test(tail);

	const promptLine = promptIdx >= 0 ? lines[promptIdx] : '';
	if (promptLine.match(/^[❯>]\s*(Try\s|$)/) && checkLines.length <= 1) return { isBusy: false, confidence: 0.9 };

	// Find all matched patterns with weights
	const matchedPatterns = [];
	let totalWeight = 0;

	BUSY_PATTERNS.forEach((pattern) => {
		const match = pattern.test(tail);
		if (match) {
			const key = pattern.toString();
			const weight = patternWeights.busy.get(key) || 1.0;
			matchedPatterns.push({ pattern: key, regexp: pattern, weight });
			totalWeight += weight;
		}
	});

	const isActuallyBusy = hasSubagent || matchedPatterns.length > 0;

	// If CC CLI is interrupted, it is IDLE not busy
	const interruptedIdx = lines.findLastIndex((l) => /Interrupted\.\s*What should Claude do instead\?/i.test(l) || /Interrupted/i.test(l));
	const busyIdx = lines.findLastIndex((l) => matchedPatterns.some((p) => p.regexp.test(l)));

	if (interruptedIdx > busyIdx && interruptedIdx !== -1) {
		return { isBusy: false, confidence: 0.95, reason: 'interrupted' };
	}

	// Calculate confidence based on weighted patterns
	let confidence = 0.5; // Base confidence
	if (hasSubagent) confidence += 0.3;
	if (matchedPatterns.length > 0) {
		confidence += Math.min(totalWeight / 3, 0.4); // Max +0.4 from patterns
	}
	confidence = Math.min(confidence, 1.0);

	if (matchedPatterns.length > 0) {
		log(`isBusy MATCH: ${matchedPatterns.length} patterns (confidence: ${(confidence * 100).toFixed(0)}%) → ${tail.slice(0, 50)}...`);
	}

	return { isBusy: isActuallyBusy, confidence, matchedPatterns };
}

/** Mission completion pattern found (Cooked for Xm Ys, Sautéed for Xm Ys) */
function hasCompletionPattern(output) {
	const tail = getCleanTail(output, 10).join('\n');
	return COMPLETION_PATTERNS.some((p) => p.test(tail));
}

/**
 * CC CLI prompt visible — ONLY meaningful when NOT busy.
 * WARNING: CC CLI TUI always renders ❯ even when processing.
 */
function hasPrompt(output) {
	if (isBusy(output).isBusy) return false;
	for (const line of getCleanTail(output, 10)) {
		const t = line.trim();
		if (!t) continue;
		if (t.includes('❯')) return true;
		if (/^>\s*$/.test(t)) return true;
		if (t.includes('Interrupted')) return true;
	}
	return false;
}

function hasApproveQuestion(output) {
	// Extend to 15 lines — questions can appear mid-scrollback
	const tail = getCleanTail(output, 15).join('\n');
	return APPROVE_PATTERNS.some((p) => p.test(tail));
}

function hasContextLimit(output) {
	// 🦞 FIX: Proxy handles infinite context, so we never trigger context_limit state.
	return false;
}

/** Check if the pane is sitting at a raw shell prompt (zsh/bash) instead of Claude */
function isShellPrompt(output) {
	const tail = getCleanTail(output, 5).join('\n');
	if (tail.includes('❯')) return false;
	if (tail.includes('Choose a capability:')) return false;
	if (/^>\s*$/.test(tail.trim())) return false;

	if (/%[\s]*$/.test(tail)) return true; // zsh
	if (/\$ \s*$/.test(tail)) return true; // bash
	if (/# \s*$/.test(tail)) return true; // root
	return false;
}

/**
 * Unified state detection from tmux output.
 * Returns: 'busy' | 'complete' | 'context_limit' | 'question' | 'idle' | 'unknown'
 * CRITICAL: BUSY checked BEFORE completion — prevents stale "Cooked for"
 * in scrollback from overriding active processing indicators.
 */
function detectState(output) {
	if (hasContextLimit(output)) return 'context_limit';
	// Questions can appear while "Busy" text is still visible — handle first to unblock
	if (hasApproveQuestion(output)) return 'question';
	const busyResult = isBusy(output);
	if (busyResult.isBusy) return 'busy';
	if (hasCompletionPattern(output)) return 'complete';
	if (hasPrompt(output)) return 'idle';
	return 'unknown';
}

/**
 * AGI L4: Enhanced state detection with confidence scoring
 * Returns: { state, confidence, ambiguities, details }
 */
function detectStateWithConfidence(output) {
	const threshold = getConfidenceThreshold();

	// Check context limit (always false currently)
	if (hasContextLimit(output)) {
		return { state: 'context_limit', confidence: 1.0, ambiguities: [] };
	}

	// Check approval questions (high priority — can appear during busy)
	if (hasApproveQuestion(output)) {
		return { state: 'question', confidence: 0.95, ambiguities: [] };
	}

	// Check busy state with confidence
	const busyResult = isBusy(output);
	if (busyResult.isBusy && busyResult.confidence >= threshold) {
		return {
			state: 'busy',
			confidence: busyResult.confidence,
			ambiguities: busyResult.confidence < 0.8 ? ['low_confidence_busy'] : [],
			details: { matchedPatterns: busyResult.matchedPatterns },
		};
	}

	// Check completion
	if (hasCompletionPattern(output)) {
		return { state: 'complete', confidence: 0.9, ambiguities: [] };
	}

	// Check idle (prompt visible)
	if (hasPrompt(output)) {
		return { state: 'idle', confidence: 0.85, ambiguities: [] };
	}

	// Unknown state with low confidence
	return {
		state: 'unknown',
		confidence: 0.5,
		ambiguities: ['no_clear_pattern_match'],
		details: { suggestedAction: 'wait_and_poll_again' },
	};
}

module.exports = {
	BUSY_PATTERNS,
	COMPLETION_PATTERNS,
	APPROVE_PATTERNS,
	PRO_LIMIT_PATTERNS,
	CONTEXT_LIMIT_PATTERNS,
	isBusy,
	hasCompletionPattern,
	hasPrompt,
	hasApproveQuestion,
	hasContextLimit,
	isShellPrompt,
	detectState,
	detectStateWithConfidence,
	recordFeedback,
	getPatternStats,
	getConfidenceThreshold,
	saveWeights,
};
