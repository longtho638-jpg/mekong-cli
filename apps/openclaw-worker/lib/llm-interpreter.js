/**
 * LLM Interpreter — CTO Vision via Antigravity Proxy (9router)
 * AGI Level 7: Hardened LLM-powered state detection
 *
 * 📜 Binh Pháp Ch.1 始計: 「知己知彼，百戰不殆」
 *    "Know yourself and know the enemy, and you will never be defeated"
 *
 * Gives the CTO "eyes" by sending CC CLI's tmux output to gemini-3-flash
 * for intelligent state detection. Replaces fragile regex-based detection.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const config = require('../config');

// CTO uses dedicated Key C on DashScope International OpenAI-compatible endpoint
const DASHSCOPE_OPENAI_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
const DASHSCOPE_KEYS = [
	process.env.CTO_DASHSCOPE_KEY || 'sk-80d8537485d04f609c498f1881e67c6f', // Key C (CTO dedicated)
	process.env.DASHSCOPE_API_KEY || 'sk-sp-652cd51db1774704a992863926cd1f67', // Key A (Coding Plan fallback)
	'sk-sp-afce4429a10e41bb901d6012d7f525c8', // Key B (Coding Plan fallback)
];
let _dsKeyIdx = 0;
const getDashScopeKey = () => DASHSCOPE_KEYS[_dsKeyIdx];
const rotateDashScopeKey = () => {
	_dsKeyIdx = (_dsKeyIdx + 1) % DASHSCOPE_KEYS.length;
	log(`🔄 Rotated to DashScope Key ${_dsKeyIdx + 1}/${DASHSCOPE_KEYS.length}`);
};
const MODEL = process.env.CTO_LLM_MODEL || 'qwen-plus'; // 🧠 CTO Brain = qwen-plus (Key C)
const TIMEOUT_MS = 8000;
const CACHE_TTL_MS = 5000;
const METRICS_FILE = path.join(config.MEKONG_DIR, 'apps/openclaw-worker/data/llm-metrics.json');

// Ensure data dir exists
const DATA_DIR = path.dirname(METRICS_FILE);
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Simple in-memory cache
let _cache = { result: null, timestamp: 0 };

// Metrics tracking
let _metrics = { calls: 0, successes: 0, failures: 0, avgLatencyMs: 0, totalLatencyMs: 0 };

function log(msg) {
	const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
	const line = `[${ts}] [tom-hum] [LLM-VISION] ${msg}`;
	try {
		fs.appendFileSync('/Users/macbookprom1/tom_hum_cto.log', line + '\n');
	} catch (e) {}
}

function saveMetrics() {
	try {
		fs.writeFileSync(METRICS_FILE, JSON.stringify(_metrics, null, 2));
	} catch (e) {}
}

const SYSTEM_PROMPT = `You are a CTO monitoring agent. Analyze Claude Code CLI terminal output and return state JSON.

RULES:
- Return ONLY valid JSON, no markdown fences, no explanation
- The prompt symbol is "❯" — if it's at the bottom with nothing after it → IDLE
- Status words (Thinking, Orbiting, Cooking, Churning, Sautéing, etc.) → BUSY
- "Cooked for Xm Ys" or "Churned for Xm Ys" or "Brewed for Xs" → COMPLETE
- "Interrupted" → IDLE (was stopped)
- Stack traces, errors, "Background task failed" → ERROR
- Yes/No questions, approval prompts, "Press Enter to continue" (during compacting) → QUESTION
- "bypass permissions on" or "(shift+tab to cycle)" in the status bar → IGNORE (not a question)
- "Compacting conversation..." AND prompt "❯" is present → QUESTION (needs Enter to unblock)
- "Background tasks" view (with "esc to exit") → QUESTION (needs Escape to exit view)
- "Context limit reached - /compact or /clear to continue" → CONTEXT_LIMIT

Return: {"state":"busy|idle|complete|error|question|context_limit","confidence":0.9,"summary":"brief","lastAction":"what finished","recommendation":"next step"}`;

function callLLM(prompt) {
	return new Promise((resolve) => {
		const payload = JSON.stringify({
			model: MODEL,
			max_tokens: 150,
			messages: [
				{ role: 'system', content: SYSTEM_PROMPT.trim() },
				{ role: 'user', content: prompt },
			],
		});

		// 🧠 Route directly to DashScope International (Key C)
		const url = new URL(`${DASHSCOPE_OPENAI_URL}/chat/completions`);
		const isHttps = url.protocol === 'https:';
		const transport = isHttps ? require('https') : http;
		const req = transport.request(
			{
				hostname: url.hostname,
				port: url.port || (isHttps ? 443 : 80),
				path: url.pathname,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': Buffer.byteLength(payload),
					Authorization: `Bearer ${getDashScopeKey()}`,
				},
				timeout: TIMEOUT_MS,
			},
			(res) => {
				let data = '';
				res.on('data', (chunk) => (data += chunk));
				res.on('end', () => {
					try {
						const json = JSON.parse(data);

						if (json.error) {
							log(`API error: ${json.error.message || JSON.stringify(json.error)}`);
							resolve(null);
							return;
						}
						const rawContent = json.choices?.[0]?.message?.content || json.content?.find((c) => c.type === 'text')?.text || '';
						if (!rawContent) {
							log(`Empty text in response. Raw: ${data.slice(0, 100)}...`);
							resolve(null);
							return;
						}

						// Parse JSON (strip thought tags and markdown fences)
						let jsonStr = content
							.replace(/<thought>[\s\S]*?<\/thought>/g, '') // Strip thinking blocks
							.replace(/```json?\n?/g, '')
							.replace(/```/g, '')
							.trim();

						// Fallback JSON extraction
						const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
						if (jsonMatch) jsonStr = jsonMatch[0];

						const result = JSON.parse(jsonStr);
						resolve(result);
					} catch (e) {
						log(`Parse error: ${e.message}. Raw: ${data.slice(0, 200)}`);
						resolve(null);
					}
				});
			},
		);

		req.on('error', (e) => {
			log(`HTTP network error: ${e.message}`);
			resolve(null);
		});

		req.on('timeout', () => {
			req.destroy();
			log(`TIMEOUT after ${TIMEOUT_MS}ms`);
			resolve(null);
		});

		req.write(payload);
		req.end();
	});
}

/**
 * Interpret CC CLI state from tmux output.
 * Features: cache, retry, metrics, logging.
 */
async function interpretState(paneOutput) {
	// Check cache
	const now = Date.now();
	if (_cache.result && now - _cache.timestamp < CACHE_TTL_MS) {
		return _cache.result;
	}

	const lines = paneOutput.split('\n');
	const lastLines = lines.slice(-10).join('\n');
	const lastLine = lines.filter((l) => l.trim()).slice(-1)[0] || '';

	// 🚀 REGEX FAST-PATH: Skip LLM for obvious states (0ms vs 13s)
	// This handles 80%+ of cases without burning API tokens
	const fastResult = regexFastPath(lastLines, lastLine);
	if (fastResult) {
		_cache = { result: fastResult, timestamp: Date.now() };
		return fastResult;
	}

	_metrics.calls++;
	const startTime = Date.now();

	// 🚀 Truncate to last 15 lines (was 40) — less tokens = faster response
	const truncated = lines.slice(-15).join('\n');
	const prompt = `Analyze this CC CLI terminal output:\n\n${truncated}`;

	// Attempt 1
	let result = await callLLM(prompt);

	// Retry with simpler prompt if failed
	if (!result) {
		log(`Attempt 1 failed — retrying with simpler prompt`);
		const simplePrompt = `Terminal last 10 lines:\n${lastLines}\n\nReturn JSON with state (busy/idle/complete/error/question).`;
		result = await callLLM(simplePrompt);
	}

	const latencyMs = Date.now() - startTime;
	_metrics.totalLatencyMs += latencyMs;

	if (result) {
		_metrics.successes++;
		_metrics.avgLatencyMs = Math.round(_metrics.totalLatencyMs / _metrics.successes);
		// Validate and normalize
		if (!result.state) result.state = 'unknown';
		if (!result.confidence) result.confidence = 0.5;
		if (!result.summary) result.summary = '';
		if (!result.lastAction) result.lastAction = '';
		if (!result.recommendation) result.recommendation = '';

		log(`${result.state.toUpperCase()} (${result.confidence}) ${latencyMs}ms — ${result.summary.slice(0, 80)}`);
		_cache = { result, timestamp: Date.now() };
		saveMetrics();
		return result;
	}

	// Both attempts failed
	_metrics.failures++;
	_metrics.avgLatencyMs = _metrics.successes > 0 ? Math.round(_metrics.totalLatencyMs / _metrics.successes) : 0;
	saveMetrics();

	const fallback = {
		state: 'unknown',
		confidence: 0,
		summary: 'LLM call failed — falling back to regex',
		lastAction: '',
		recommendation: 'use_regex_fallback',
	};
	log(
		`FAILED (${latencyMs}ms) — both attempts failed. Calls: ${_metrics.calls}, Success: ${_metrics.successes}, Fail: ${_metrics.failures}`,
	);
	return fallback;
}

/**
 * Generate a mission completion summary from CC CLI output.
 * Called after a mission completes to log what CC CLI actually did.
 */
async function getMissionSummary(paneOutput) {
	const lines = paneOutput.split('\n').slice(-50).join('\n');
	const prompt = `This CC CLI session just completed a mission. Analyze the output and return JSON:
{"filesChanged": 0, "bugsFixed": 0, "summary": "what was accomplished", "improvements": ["list of specific improvements"]}

Terminal output:
${lines}`;

	const result = await callLLM(prompt);
	if (result) {
		log(`MISSION SUMMARY: ${JSON.stringify(result).slice(0, 200)}`);
		// Save to mission summaries file
		try {
			const summariesFile = path.join(DATA_DIR, 'mission-summaries.json');
			let summaries = [];
			if (fs.existsSync(summariesFile)) summaries = JSON.parse(fs.readFileSync(summariesFile, 'utf-8'));
			summaries.push({ ...result, timestamp: new Date().toISOString() });
			// Keep last 100 summaries
			if (summaries.length > 100) summaries = summaries.slice(-100);
			fs.writeFileSync(summariesFile, JSON.stringify(summaries, null, 2));
		} catch (e) {}
	}
	return result;
}

/**
 * Ask LLM which strategic task to run next, given project health and history.
 */
async function selectNextTask(project, taskHistory, availableTasks) {
	const prompt = `You are a CTO deciding which improvement task to run next for project "${project}".

Task history (times run): ${JSON.stringify(taskHistory)}
Available tasks: ${JSON.stringify(availableTasks.map((t) => ({ id: t.id, cmd: t.cmd.slice(0, 60) })))}

Pick the MOST valuable task to run next. Consider:
- Tasks run less often should be prioritized
- Diminishing returns for over-run tasks
- Balance security, performance, quality, and maintenance

Return: {"taskId": "chosen_task_id", "reason": "why this task"}`;

	const result = await callLLM(prompt);
	if (result?.taskId) {
		log(`TASK SELECTION: ${result.taskId} — ${result.reason?.slice(0, 80)}`);
	}
	return result;
}

function clearCache() {
	_cache = { result: null, timestamp: 0 };
}

function getMetrics() {
	return { ..._metrics };
}

/**
 * 🚀 Regex Fast-Path — detect obvious states without LLM call
 * Handles ~80% of cases in 0ms instead of 13s
 */
function regexFastPath(lastLines, lastLine) {
	// IDLE: prompt symbol visible in last 5 lines (status bar may be final line)
	const hasPrompt = /❯/.test(lastLines);
	const hasBusyIndicator =
		/Cooking|Brewing|Frosting|Moonwalking|Concocting|Sautéing|Churning|Orbiting|Hatching|thinking|Ebbing|Compacting/i.test(lastLines);
	if (hasPrompt && !hasBusyIndicator) {
		return { state: 'idle', confidence: 0.95, summary: 'CC CLI at prompt (regex)', lastAction: '', recommendation: 'dispatch_task' };
	}

	// QUESTION: compaction prompt or yes/no (MUST be before BUSY — Compacting matches both)
	if (/Compacting conversation|Press Enter|compact or.*clear|\(y\/n\)/i.test(lastLines)) {
		return { state: 'question', confidence: 0.9, summary: 'Needs user input (regex)', lastAction: '', recommendation: 'send_enter' };
	}

	// COMPLETE: "Cooked for Xm Ys" or "Brewed for Xs" (MUST be before BUSY)
	const completeMatch = lastLines.match(/(Cooked|Brewed|Churned|Sautéed)\s+for\s+(\d+[ms].*?)$/im);
	if (completeMatch) {
		return {
			state: 'complete',
			confidence: 0.95,
			summary: `${completeMatch[1]} for ${completeMatch[2]} (regex)`,
			lastAction: completeMatch[0],
			recommendation: 'check_result',
		};
	}

	// BUSY: thinking/cooking status words
	const busyMatch = lastLines.match(
		/(Cooking|Brewing|Frosting|Moonwalking|Concocting|Sautéing|Churning|Orbiting|Finagling|Blanching|Gitifying|thinking).*?\((\d+[ms].*?)\)/i,
	);
	if (busyMatch) {
		return {
			state: 'busy',
			confidence: 0.95,
			summary: `Agent ${busyMatch[1]} (${busyMatch[2]}) (regex)`,
			lastAction: '',
			recommendation: 'wait',
		};
	}

	// Also catch "* Thinking..." or status bar patterns
	if (/[✶·✻]\s*(Thinking|Implementing|Scanning)/i.test(lastLines)) {
		return { state: 'busy', confidence: 0.9, summary: 'Agent working (regex)', lastAction: '', recommendation: 'wait' };
	}

	// CC CLI loading/initializing (bypass permissions visible but NO prompt anywhere)
	if (/bypass permissions on/i.test(lastLines) && !hasPrompt) {
		return { state: 'busy', confidence: 0.85, summary: 'CC CLI loading (regex)', lastAction: '', recommendation: 'wait' };
	}

	// SHELL: crashed to bash (% or $ prompt)
	if (/(%|\$)\s*$/.test(lastLine) && !lastLine.includes('❯')) {
		return { state: 'error', confidence: 0.9, summary: 'CC CLI exited to shell (regex)', lastAction: '', recommendation: 'respawn' };
	}

	// No match — fall through to LLM
	return null;
}

module.exports = { interpretState, getMissionSummary, selectNextTask, clearCache, getMetrics, regexFastPath };
