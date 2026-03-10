/**
 * 🧠 INTELLIGENT QUESTION HANDLER — CTO đọc hiểu câu hỏi CC CLI
 *
 * Khi CC CLI hỏi câu hỏi (không phải pattern cứng), module này:
 * 1. Capture nội dung câu hỏi từ tmux pane
 * 2. Gửi cho LLM (Antigravity Proxy) phân tích
 * 3. Nhận quyết định: approve / reject / custom answer
 * 4. Gửi response phù hợp cho CC CLI
 *
 * SAFETY: Câu hỏi nguy hiểm (xóa file, deploy prod, drop DB) → REJECT
 */

const http = require('http');
const { log } = require('./brain-process-manager');

const PROXY_URL = 'http://127.0.0.1:20128';
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
	/continue|tiếp tục|proceed|yes.*continue/i,
	/install.*(?:dep|package|module)/i,
	/create.*(?:file|directory|folder|test)/i,
	/run.*test/i,
	/commit.*(?:change|this|code)/i,
	/save.*(?:file|change|progress)/i,
	/read.*(?:file|docs|document)/i,
	/update.*(?:doc|readme|changelog)/i,
	/xử lý chung|tiếp tục xử lý/i,
];

/**
 * Analyze a question using LLM via Antigravity Proxy
 * Returns: { action: 'approve'|'reject'|'answer', response: string, reason: string }
 */
function analyzeLLM(questionText) {
	return new Promise((resolve) => {
		const systemPrompt = `Bạn là CTO AI. CC CLI (coding agent) đang hỏi một câu hỏi. 
Phân tích câu hỏi và quyết định:

RULES:
- Nếu câu hỏi an toàn (tiếp tục, install, create, test) → approve
- Nếu câu hỏi nguy hiểm (xoá data, deploy prod, force push) → reject
- Nếu câu hỏi cần chọn option → chọn option an toàn nhất
- Nếu không chắc → approve (vì CC CLI đang chạy trong sandbox với bypass permissions)

Trả lời ĐÚNG FORMAT JSON (không có text khác):
{"action":"approve|reject|answer","response":"text to send to CLI","reason":"why"}`;

		const body = JSON.stringify({
			model: MODEL,
			max_tokens: 200,
			messages: [{ role: 'user', content: `${systemPrompt}\n\nCC CLI hỏi:\n${questionText}` }],
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
