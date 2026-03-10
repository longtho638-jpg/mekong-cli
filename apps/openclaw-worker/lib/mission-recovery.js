/**
 * Mission Recovery — Cửu Biến 7-State Adaptation (九變 Ch.8)
 *
 * Expanded from 2 fallback models to 7 adaptation states per doctrine.
 * Each state maps to a specific scenario with diagnostic awareness.
 *
 * 有所不爭 — Not every battle is worth fighting
 * 有所不取 — Not every city is worth taking
 */

const config = require('../config');

// 九變 Triple-Mix MAX Adaptation v10.2
// 7 states matching BINH_PHAP_MASTER.md exactly
const ADAPTATION_STATES = [
	{
		id: 'opus_burst',
		description: 'AG Opus burst (2 calls) → kéo trớn thinking',
		model: 'claude-sonnet-4-6-20250514',
		provider: 'antigravity',
		chapter: '九變 Biến 1',
	},
	{
		id: 'opus_done',
		description: 'Opus burst done → nhã ra Google Pro/Flash FREE',
		model: 'gemini-3-pro',
		provider: 'google',
		chapter: '九變 Biến 2',
	},
	{
		id: 'skip_ag',
		description: 'Not worthy of Opus → skip AG, thẳng Google',
		model: 'gemini-3-flash',
		provider: 'google',
		chapter: '九變 Biến 3',
	},
	{
		id: 'google_error',
		description: 'Google 429/error → chuyển Ollama',
		model: 'gemini-3-flash',
		provider: 'ollama',
		chapter: '九變 Biến 4',
	},
	{
		id: 'ollama_gap',
		description: 'Ollama gap → chuyển OpenRouter (last resort)',
		model: 'auto',
		provider: 'openrouter',
		chapter: '九變 Biến 5',
	},
	{
		id: 'ag_budget_hit',
		description: 'AG hourly budget (30) → nhã ra Google (tiết kiệm)',
		model: 'gemini-3-pro',
		provider: 'google',
		chapter: '九變 Biến 6',
	},
	{
		id: 'all_blocked',
		description: 'ALL blocked → 有所不爭 — dừng, đợi cooldown',
		model: null,
		provider: null,
		action: 'cooldown',
		chapter: '九變 Biến 7',
	},
];

// Legacy compatibility
const FALLBACK_MODELS = {
	antigravity: 'claude-sonnet-4-20250514',
	qwen: 'qwen-max',
};

const MODEL_ERROR_PATTERNS = [/\b400\b/, /model_not_found/i, /overloaded/i, /invalid_model/i, /model.*unavailable/i];

const CONTEXT_OVERFLOW_PATTERNS = [
	/context.*overflow/i,
	/context.*too\s+long/i,
	/token\s+limit/i,
	/maximum\s+context/i,
	/prompt.*too\s+long/i,
];

const RATE_LIMIT_PATTERNS = [/\b429\b/, /rate.?limit/i, /too.?many.?requests/i, /quota.?exceeded/i];

const TRUNCATED_PROMPT_LENGTH = 8000;

/**
 * Check if error output indicates a model-related failure (HTTP 400, etc.)
 */
function isModelError(output) {
	return MODEL_ERROR_PATTERNS.some((pat) => pat.test(output));
}

/**
 * Check if error output indicates context overflow
 */
function isContextOverflow(output) {
	return CONTEXT_OVERFLOW_PATTERNS.some((pat) => pat.test(output));
}

/**
 * Check if error output indicates rate limiting (HTTP 429)
 */
function isRateLimited(output) {
	return RATE_LIMIT_PATTERNS.some((pat) => pat.test(output));
}

/**
 * Get the fallback model name for the current engine. (Legacy API)
 */
function getFallbackModel() {
	return FALLBACK_MODELS[config.ENGINE] || FALLBACK_MODELS.antigravity;
}

/**
 * Truncate prompt to fit within context limits.
 * Keeps the first TRUNCATED_PROMPT_LENGTH chars to preserve intent.
 */
function truncatePrompt(prompt) {
	if (prompt.length <= TRUNCATED_PROMPT_LENGTH) return prompt;
	return prompt.slice(0, TRUNCATED_PROMPT_LENGTH) + '\n\n[TRUNCATED — original prompt exceeded context limit]';
}

/**
 * Determine recovery action from mission failure output.
 * Enhanced with Cửu Biến adaptation awareness.
 *
 * Returns: { action, model, adaptationState, chapter }
 */
function diagnoseFailure(output) {
	if (isModelError(output)) {
		const state = ADAPTATION_STATES[0]; // opus_burst fallback
		return {
			action: 'model_failover',
			model: getFallbackModel(),
			adaptationState: state.id,
			chapter: state.chapter,
		};
	}
	if (isRateLimited(output)) {
		const state = ADAPTATION_STATES[5]; // ag_budget_hit
		return {
			action: 'rate_limit_fallback',
			model: state.model,
			adaptationState: state.id,
			chapter: state.chapter,
		};
	}
	if (isContextOverflow(output)) {
		return {
			action: 'context_truncate',
			adaptationState: 'context_overflow',
			chapter: '虛實 Ch.6',
		};
	}
	return { action: null };
}

/**
 * Get the next adaptation state given a current state ID.
 * Implements the 7-state fallback chain.
 *
 * @param {string} currentStateId - Current adaptation state ID
 * @returns {object|null} Next adaptation state or null if at end
 */
function getNextAdaptation(currentStateId) {
	const idx = ADAPTATION_STATES.findIndex((s) => s.id === currentStateId);
	if (idx < 0 || idx >= ADAPTATION_STATES.length - 1) return null;
	return ADAPTATION_STATES[idx + 1];
}

module.exports = {
	diagnoseFailure,
	getFallbackModel,
	truncatePrompt,
	getNextAdaptation,
	isRateLimited,
	ADAPTATION_STATES,
	TRUNCATED_PROMPT_LENGTH,
};
