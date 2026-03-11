/**
 * 🧠 INTELLIGENT QUESTION HANDLER — CTO reads and understands CC CLI questions
 *
 * When CC CLI asks a question (not a hardcoded pattern), this module:
 * 1. Captures question content from tmux pane
 * 2. Sends to LLM provider for analysis
 * 3. Receives decision: approve / reject / custom answer
 * 4. Sends appropriate response to CC CLI
 *
 * SAFETY: Dangerous questions (delete files, deploy prod, drop DB) → REJECT
 */

const http = require('http');
const { log } = require('./brain-process-manager');

const PROXY_URL = process.env.LLM_BASE_URL || process.env.ANTHROPIC_BASE_URL || '';
const TIMEOUT_MS = 15_000; // 15s max for LLM decision
const MODEL = 'claude-sonnet-4-6-20250514';

// === SAFETY RULES ===
// Questions matching these = ALWAYS REJECT (no LLM needed)
const DANGER_PATTERNS = [
	/delete.*(?:all|entire|everything|database|production)/i,
	/drop\s+(?:table|database|collection)/i,
	/rm\s+-rf/i,
	/deploy.*prod/i,
	/push.*(?:main|master|production)/i,
	/format.*disk/i,
	/reset.*hard/i,
	/force.*push/i,
	/remove.*(?:\.env|config|secret|credential)/i,
	/overwrite.*(?:backup|migration)/i,
];

// Questions matching these = ALWAYS APPROVE (no LLM needed)
const SAFE_PATTERNS = [
	/continue|proceed|yes.*continue/i,
	/install.*(?:dep|package|module)/i,
	/create.*(?:file|directory|folder|test)/i,
	/run.*test/i,
	/commit.*(?:change|this|code)/i,
	/save.*(?:file|change|progress)/i,
	/read.*(?:file|docs|document)/i,
	/update.*(?:doc|readme|changelog)/i,
	/handle generally|continue processing/i,
];

/**
 * Analyze a question using LLM via configured LLM provider
 * Returns: { action: 'approve'|'reject'|'answer', response: string, reason: string }
 */
function analyzeLLM(questionText) {
	return new Promise((resolve) => {
		const systemPrompt = `You are an AI CTO. CC CLI (coding agent) is asking a question.
Analyze the question and decide:

RULES:
- If the question is safe (continue, install, create, test) → approve
- If the question is dangerous (delete data, deploy prod, force push) → reject
- If the question requires choosing an option → choose the safest option
- If unsure → approve (CC CLI runs in a sandbox with permissions bypassed)

Reply in EXACT JSON FORMAT (no other text):
{"action":"approve|reject|answer","response":"text to send to CLI","reason":"why"}`;

		const body = JSON.stringify({
			model: MODEL,
			max_tokens: 200,
			messages: [{ role: 'user', content: `${systemPrompt}\n\nCC CLI asks:\n${questionText}` }],
		});

		const req = http.request(
			`${PROXY_URL}/v1/messages`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': 'proxy-internal',
					'anthropic-version': '2023-06-01',
				},
				timeout: TIMEOUT_MS,
			},
			(res) => {
				let data = '';
				res.on('data', (chunk) => (data += chunk));
				res.on('end', () => {
					try {
						const parsed = JSON.parse(data);
						const text = parsed.content?.[0]?.text || '';

						// Extract JSON from response
						const jsonMatch = text.match(/\{[^}]+\}/);
						if (jsonMatch) {
							const decision = JSON.parse(jsonMatch[0]);
							resolve({
								action: decision.action || 'approve',
								response: decision.response || '',
								reason: decision.reason || 'LLM decision',
							});
						} else {
							// LLM didn't return JSON — default approve
							resolve({ action: 'approve', response: '', reason: 'LLM no JSON — default approve' });
						}
					} catch (e) {
						resolve({ action: 'approve', response: '', reason: `Parse error: ${e.message}` });
					}
				});
			},
		);

		req.on('error', (e) => {
			log(`[QH] LLM call failed: ${e.message} — defaulting to approve`);
			resolve({ action: 'approve', response: '', reason: `Network error: ${e.message}` });
		});

		req.on('timeout', () => {
			req.destroy();
			resolve({ action: 'approve', response: '', reason: 'LLM timeout — default approve' });
		});

		req.write(body);
		req.end();
	});
}

/**
 * Main handler: Decide what to do with a CC CLI question
 * @param {string} questionText - The raw pane output containing the question
 * @returns {Promise<{action: string, keys: string[], reason: string}>}
 *   action: 'approve' | 'reject' | 'answer'
 *   keys: array of tmux key sequences to send
 *   reason: human-readable explanation
 */
async function handleQuestion(questionText) {
	// Step 1: Check DANGER patterns (instant reject, no LLM)
	for (const pattern of DANGER_PATTERNS) {
		if (pattern.test(questionText)) {
			const reason = `🛑 DANGER: matched ${pattern}`;
			log(`[QH] ${reason}`);
			return { action: 'reject', keys: ['Escape'], reason };
		}
	}

	// Step 2: Check SAFE patterns (instant approve, no LLM)
	for (const pattern of SAFE_PATTERNS) {
		if (pattern.test(questionText)) {
			const reason = `✅ SAFE: matched ${pattern}`;
			log(`[QH] ${reason}`);
			return { action: 'approve', keys: ['Enter'], reason };
		}
	}

	// Step 3: Unknown question → ask LLM
	log(`[QH] 🧠 Unknown question — consulting LLM...`);
	const decision = await analyzeLLM(questionText);
	log(`[QH] LLM decided: ${decision.action} — ${decision.reason}`);

	switch (decision.action) {
		case 'reject':
			return { action: 'reject', keys: ['Escape'], reason: decision.reason };

		case 'answer':
			// LLM provided a specific answer to type
			const answerKeys = [];
			if (decision.response) {
				// Type the response character by character isn't needed — paste it
				answerKeys.push(decision.response);
			}
			answerKeys.push('Enter');
			return { action: 'answer', keys: answerKeys, reason: decision.reason };

		case 'approve':
		default:
			return { action: 'approve', keys: ['Enter'], reason: decision.reason };
	}
}

module.exports = { handleQuestion, DANGER_PATTERNS, SAFE_PATTERNS };
