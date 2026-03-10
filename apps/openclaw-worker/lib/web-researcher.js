/**
 * Web Researcher — CTO Real-Time Web Search & Solution Synthesis
 * AGI Level 10+: 「用間」Espionage — Internet Intelligence Gathering
 *
 * 📜 Binh Pháp Ch.13 用間: 「先知者，不可取於鬼神」
 *    "Foreknowledge cannot be obtained from spirits — it must come from intelligence"
 *
 * CTO searches the web for real-time solutions to problems encountered
 * during missions, synthesizes results via LLM, and injects intel into prompts.
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const config = require('../config');

const DATA_DIR = path.join(config.MEKONG_DIR, 'apps/openclaw-worker/data');
const RESEARCH_DIR = path.join(DATA_DIR, 'research');
const PROXY_PORT = config.PROXY_PORT || 20128;

if (!fs.existsSync(RESEARCH_DIR)) fs.mkdirSync(RESEARCH_DIR, { recursive: true });

function log(msg) {
	const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
	try {
		fs.appendFileSync('/Users/macbookprom1/tom_hum_cto.log', `[${ts}] [tom-hum] [RESEARCHER] ${msg}\n`);
	} catch (e) {}
}

// ═══════════════════════════════════════════════════
// Web Search via DuckDuckGo (no API key needed)
// ═══════════════════════════════════════════════════

function searchDDG(query) {
	return new Promise((resolve) => {
		const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
		const timer = setTimeout(() => {
			resolve([]);
		}, 10000);

		https
			.get(
				url,
				{
					headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) CTO-Researcher/1.0' },
				},
				(res) => {
					let data = '';
					res.on('data', (c) => (data += c));
					res.on('end', () => {
						clearTimeout(timer);
						// Parse results from HTML (simple regex extraction)
						const results = [];
						const linkRegex = /class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)/g;
						const snippetRegex = /class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
						let match;
						while ((match = linkRegex.exec(data)) && results.length < 5) {
							const url = decodeURIComponent(match[1].replace(/.*uddg=/, '').replace(/&.*/, ''));
							const title = match[2].replace(/<[^>]+>/g, '').trim();
							results.push({ title, url });
						}
						// Try to get snippets
						let i = 0;
						while ((match = snippetRegex.exec(data)) && i < results.length) {
							results[i].snippet = match[1]
								.replace(/<[^>]+>/g, '')
								.replace(/&amp;/g, '&')
								.replace(/&lt;/g, '<')
								.replace(/&gt;/g, '>')
								.trim()
								.slice(0, 200);
							i++;
						}
						resolve(results);
					});
				},
			)
			.on('error', () => {
				clearTimeout(timer);
				resolve([]);
			});
	});
}

// ═══════════════════════════════════════════════════
// Web Search via curl + Google (fallback)
// ═══════════════════════════════════════════════════

function searchGoogle(query) {
	try {
		const result = execSync(
			`curl -s "https://www.google.com/search?q=${encodeURIComponent(query)}&num=5" -H "User-Agent: Mozilla/5.0" 2>/dev/null | head -c 50000`,
			{ encoding: 'utf-8', timeout: 10000 },
		);
		// Extract titles and snippets
		const results = [];
		const titleRegex = /<h3[^>]*>(.*?)<\/h3>/g;
		let match;
		while ((match = titleRegex.exec(result)) && results.length < 5) {
			results.push({ title: match[1].replace(/<[^>]+>/g, '').trim(), url: '', snippet: '' });
		}
		return results;
	} catch (e) {
		return [];
	}
}

// ═══════════════════════════════════════════════════
// LLM Synthesis — Turn search results into actionable intel
// ═══════════════════════════════════════════════════

function synthesize(query, searchResults) {
	return new Promise((resolve) => {
		const resultText = searchResults.map((r, i) => `${i + 1}. ${r.title}\n   URL: ${r.url || 'N/A'}\n   ${r.snippet || ''}`).join('\n');

		const prompt = `I'm a CTO debugging a software issue. Here are web search results for: "${query}"

${resultText}

Synthesize these results into:
1. ROOT CAUSE: Most likely cause of the issue
2. BEST SOLUTION: The recommended fix with code example if applicable
3. ALTERNATIVE: A backup approach
4. GOTCHAS: Common mistakes when applying this fix

Return JSON: {"rootCause": "...", "bestSolution": "...", "codeExample": "...", "alternative": "...", "gotchas": ["..."], "sourceUrl": "most relevant URL"}`;

		const body = JSON.stringify({
			model: 'gemini-3-flash',
			max_tokens: 2048,
			system: 'You are a senior software engineer synthesizing web search results into actionable solutions. Return ONLY valid JSON.',
			messages: [{ role: 'user', content: prompt }],
		});

		const timer = setTimeout(() => {
			resolve(null);
		}, 20000);

		const req = http.request(
			{
				hostname: '127.0.0.1',
				port: PROXY_PORT,
				path: '/v1/messages',
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'x-api-key': 'ollama', 'anthropic-version': '2023-06-01' },
			},
			(res) => {
				let data = '';
				res.on('data', (c) => (data += c));
				res.on('end', () => {
					clearTimeout(timer);
					try {
						const r = JSON.parse(data);
						const text = (r.content || []).find((c) => c.type === 'text')?.text || '';
						const result = JSON.parse(
							text
								.replace(/```json?\n?/g, '')
								.replace(/```/g, '')
								.trim(),
						);
						resolve(result);
					} catch (e) {
						resolve(null);
					}
				});
			},
		);

		req.on('error', () => {
			clearTimeout(timer);
			resolve(null);
		});
		req.write(body);
		req.end();
	});
}

// ═══════════════════════════════════════════════════
// Main Research Pipeline
// ═══════════════════════════════════════════════════

/**
 * Research a problem and return synthesized solution.
 * Pipeline: Search DDG → fallback Google → LLM Synthesis → Save Intel
 */
async function research(problem, context = '') {
	const query = `${problem} ${context} solution fix`.slice(0, 200);
	log(`🔍 SEARCHING: "${query.slice(0, 80)}..."`);

	// Step 1: Search
	let results = await searchDDG(query);
	if (results.length === 0) {
		log(`DDG returned 0 results — trying Google fallback`);
		results = searchGoogle(query);
	}

	log(`📊 Found ${results.length} results`);
	if (results.length === 0) {
		return { error: 'No search results found', query };
	}

	// Step 2: Synthesize via LLM
	const intel = await synthesize(query, results);
	if (!intel) {
		return { error: 'LLM synthesis failed', results, query };
	}

	// Step 3: Save research
	const filename = `research_${Date.now()}.json`;
	const researchData = {
		query,
		problem,
		context,
		searchResults: results,
		synthesis: intel,
		timestamp: new Date().toISOString(),
	};

	try {
		fs.writeFileSync(path.join(RESEARCH_DIR, filename), JSON.stringify(researchData, null, 2));
	} catch (e) {}

	log(`✅ INTEL: ${intel.rootCause?.slice(0, 60)} → ${intel.bestSolution?.slice(0, 60)}`);

	return researchData;
}

/**
 * Research a build/lint error and generate a fix prompt with web intel.
 */
async function researchError(errorMessage, projectName) {
	const intel = await research(errorMessage, `${projectName} Next.js React TypeScript`);
	if (intel.error) return null;

	// Format for mission prompt injection
	const s = intel.synthesis;
	return `
WEB INTEL (researched in real-time):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROOT CAUSE: ${s.rootCause || 'Unknown'}
BEST SOLUTION: ${s.bestSolution || 'Unknown'}
${s.codeExample ? `CODE EXAMPLE:\n${s.codeExample}` : ''}
ALTERNATIVE: ${s.alternative || 'N/A'}
GOTCHAS: ${(s.gotchas || []).join('; ')}
SOURCE: ${s.sourceUrl || 'N/A'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

/**
 * Get recent research results as context for missions.
 */
function getRecentResearch(limit = 3) {
	try {
		const files = fs
			.readdirSync(RESEARCH_DIR)
			.filter((f) => f.endsWith('.json'))
			.sort()
			.reverse()
			.slice(0, limit);
		return files.map((f) => {
			const data = JSON.parse(fs.readFileSync(path.join(RESEARCH_DIR, f), 'utf-8'));
			return { problem: data.problem, solution: data.synthesis?.bestSolution, source: data.synthesis?.sourceUrl };
		});
	} catch (e) {
		return [];
	}
}

module.exports = { research, researchError, getRecentResearch, searchDDG, searchGoogle };
