/**
 * Strategy Optimizer — LLM-based failure analysis + correction hints
 *
 * TASK 11/22: CTO Brain Upgrade
 *
 * Analyzes WHY a mission failed and generates actionable correction hints
 * for retry with progressive prompt augmentation.
 */

const fs = require('fs');
const config = require('../config');

function log(msg) {
	const ts = new Date().toISOString().slice(11, 19);
	const line = `[${ts}] [strategy] ${msg}\n`;
	try {
		fs.appendFileSync(config.LOG_FILE, line);
	} catch (_) {}
}

// ═══ Error classification → known fix hints (fast, no AI) ═══
const KNOWN_FIX_PATTERNS = [
	{
		pattern: /FileNotFound|ENOENT|no such file/i,
		hint: 'The file path may be wrong. Use `find . -name "filename"` or `ls -la` to locate the correct file first.',
		type: 'file_not_found',
	},
	{
		pattern: /SyntaxError|Unexpected token/i,
		hint: 'There is a syntax error in the code. Run the linter first: `npm run lint` or `npx tsc --noEmit` to find the exact location.',
		type: 'syntax_error',
	},
	{
		pattern: /TypeError|is not a function|Cannot read propert/i,
		hint: 'There is a type error. Check the variable types and ensure the function/property exists. Run `npx tsc --noEmit` for TypeScript projects.',
		type: 'type_error',
	},
	{
		pattern: /test.*fail|FAIL|AssertionError|expect.*received/i,
		hint: 'Tests are failing. Read the test output carefully — the expected vs received values tell you exactly what is wrong. Fix the implementation, not the test.',
		type: 'test_failed',
	},
	{
		pattern: /build.*fail|compilation.*error|Module not found/i,
		hint: 'Build is failing. Check import paths and ensure all dependencies are installed with `npm install`. Look for missing modules.',
		type: 'build_failed',
	},
	{
		pattern: /EADDRINUSE|port.*already in use/i,
		hint: 'Port is already in use. Find the process: `lsof -i:PORT` and kill it, or use a different port.',
		type: 'port_conflict',
	},
	{
		pattern: /EACCES|Permission denied/i,
		hint: 'Permission denied. Check file ownership with `ls -la`. Do NOT use sudo — fix the permissions properly.',
		type: 'permission_error',
	},
	{
		pattern: /timeout|ETIMEDOUT|ECONNREFUSED/i,
		hint: 'Network timeout or connection refused. Check if the service is running and the URL/port is correct.',
		type: 'network_error',
	},
	{
		pattern: /Out of memory|heap.*overflow|JavaScript heap/i,
		hint: 'Out of memory. The operation is too large. Try processing in smaller batches or increase Node memory: `NODE_OPTIONS=--max-old-space-size=4096`.',
		type: 'memory_error',
	},
	{
		pattern: /ESLint|lint.*error|Parsing error/i,
		hint: 'Lint errors found. Fix them by running `npm run lint -- --fix` or manually correcting the flagged lines.',
		type: 'lint_error',
	},
];

/**
 * Analyze failure and generate correction hint (fast heuristic path)
 * @param {string} errorOutput - stderr/stdout from failed mission
 * @returns {{ type: string, hint: string } | null}
 */
function quickAnalyze(errorOutput) {
	if (!errorOutput) return null;

	for (const { pattern, hint, type } of KNOWN_FIX_PATTERNS) {
		if (pattern.test(errorOutput)) {
			return { type, hint };
		}
	}
	return null;
}

/**
 * Full LLM-based strategy optimization
 * @param {string} originalPrompt - The original mission prompt
 * @param {string} errorOutput - Error output from failed execution
 * @param {number} attemptCount - Which retry attempt (1, 2, 3)
 * @returns {Promise<string>} - Corrected/augmented prompt
 */
async function optimizeStrategy(originalPrompt, errorOutput, attemptCount = 1) {
	// Phase 1: Quick heuristic
	const quick = quickAnalyze(errorOutput);
	if (quick && attemptCount <= 1) {
		log(`STRATEGY HINT [${quick.type}]: ${quick.hint}`);
		return `${originalPrompt}\n\n⚠️ PREVIOUS ATTEMPT FAILED (${quick.type}):\n${errorOutput.slice(-500)}\n\n💡 HINT: ${quick.hint}`;
	}

	// Phase 2: LLM analysis (for retries 2+ or unknown errors)
	try {
		// 🔒 FIX 2026-02-19: Use Anthropic /v1/messages via proxy-client
		const { callLLM } = require('./proxy-client');
		const hint = await callLLM({
			system: `You are an expert debugging assistant. Analyze why this code task failed and provide a SPECIFIC, ACTIONABLE correction hint (max 3 lines). Focus on the root cause, not symptoms.`,
			user: `ORIGINAL TASK:\n${originalPrompt.slice(0, 1000)}\n\nERROR OUTPUT (attempt ${attemptCount}):\n${errorOutput.slice(-1500)}\n\nWhat specific fix should be applied?`,
			maxTokens: 200,
			timeoutMs: 10000,
		});

		if (!hint) {
			log(`Strategy API error`);
			const fallbackHint = quick ? quick.hint : 'Review the error output carefully and try a different approach.';
			return `${originalPrompt}\n\n⚠️ RETRY #${attemptCount}: ${fallbackHint}`;
		}

		log(`STRATEGY LLM HINT (attempt ${attemptCount}): ${hint.slice(0, 100)}`);
		return `${originalPrompt}\n\n⚠️ RETRY #${attemptCount} — PREVIOUS ERROR:\n${errorOutput.slice(-500)}\n\n💡 AI ANALYSIS:\n${hint}`;
	} catch (err) {
		log(`Strategy optimizer error: ${err.message}`);
		return `${originalPrompt}\n\n⚠️ RETRY #${attemptCount}: Review error and try different approach.\nError: ${errorOutput.slice(-300)}`;
	}
}

// Result codes returned by brain-process-manager — classify without regex
const RESULT_CODE_MAP = {
	// Non-recoverable terminal codes
	unsafe_blocked: { errorType: 'unsafe', recoverable: false },
	brain_died: { errorType: 'brain_died', recoverable: false },
	brain_died_fatal: { errorType: 'brain_died', recoverable: false },
	no_brain_module: { errorType: 'no_brain', recoverable: false },
	duplicate_rejected: { errorType: 'duplicate', recoverable: false },
	max_retries_exhausted: { errorType: 'max_retries', recoverable: false },
	// Recoverable transient codes
	timeout: { errorType: 'timeout', recoverable: true },
	killed_stuck: { errorType: 'timeout', recoverable: true },
	busy_blocked: { errorType: 'busy', recoverable: true },
	all_workers_busy: { errorType: 'busy', recoverable: true },
	failed_to_start: { errorType: 'startup_failure', recoverable: true },
	queued_abort: { errorType: 'busy', recoverable: true },
	// 🧬 FIX: 'unknown' → NOT recoverable by default (no hint available → retry wastes quota)
	// Only retry 'unknown' if there is actual error output to analyze
	unknown: { errorType: 'unknown', recoverable: false },
	unknown_failure: { errorType: 'unknown', recoverable: false },
};

/**
 * Classify error type from output OR result code string
 * @param {string} output - Full error output OR short result code
 * @returns {{ errorType: string, errorMessage: string, recoverable: boolean }}
 */
function classifyError(output) {
	if (!output) return { errorType: 'unknown', errorMessage: '', recoverable: false };

	// Fast path: short result codes from brain-process-manager
	const cleanOutput = (output || '').trim();
	const codeMatch = RESULT_CODE_MAP[cleanOutput];
	if (codeMatch) {
		return { ...codeMatch, errorMessage: cleanOutput };
	}

	const quick = quickAnalyze(output);
	if (quick) {
		return {
			errorType: quick.type,
			errorMessage: output.slice(-500),
			recoverable: !['memory_error'].includes(quick.type),
		};
	}

	// Check for terminal (non-recoverable) errors
	const terminalPatterns = [/UNSAFE.*blocked/i, /authentication.*fail/i, /API key.*invalid/i];

	const isTerminal = terminalPatterns.some((p) => p.test(output));

	return {
		errorType: isTerminal ? 'terminal' : 'unknown',
		errorMessage: output.slice(-500),
		recoverable: !isTerminal,
	};
}

module.exports = {
	optimizeStrategy,
	quickAnalyze,
	classifyError,
	KNOWN_FIX_PATTERNS,
};
